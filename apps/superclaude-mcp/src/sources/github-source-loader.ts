import axios from "axios";
import logger from "@/logger.js";
import { Command, Persona } from "@/schemas.js";
import { SuperClaudeRules } from "@types";
import { BaseSourceLoader } from "./base-source-loader.js";

// Default configuration
const DEFAULT_GITHUB_URL = "https://github.com/NomenAK/SuperClaude";
const DEFAULT_BRANCH = "master";
const DEFAULT_CACHE_TTL = 5; // minutes

/**
 * GitHubSourceLoader loads SuperClaude data from a GitHub repository
 * Uses raw.githubusercontent.com for direct file access
 * Expected directory structure in .claude folder:
 * {repository}/.claude/
 * ├── commands/
 * │   ├── shared/
 * │   │   ├── pattern1.yml
 * │   │   ├── pattern2.yml
 * │   │   ├── constants1.yml
 * │   │   └── config.yml
 * │   ├── command1.yml
 * │   └── command2.yml
 * ├── shared/
 * │   ├── superclaude-core.yml
 * │   ├── superclaude-mcp.yml
 * │   ├── superclaude-personas.yaml
 * │   └── superclaude-rules.yaml
 */
export class GitHubSourceLoader extends BaseSourceLoader {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTTL: number;
  private githubRawUrl: string;
  private githubApiUrl: string;
  private owner: string;
  private repo: string;
  private branch: string;

  constructor(
    repositoryUrl: string = DEFAULT_GITHUB_URL,
    branch: string = DEFAULT_BRANCH,
    cacheTTLMinutes: number = DEFAULT_CACHE_TTL
  ) {
    super();

    // Parse repository URL
    const { owner, repo } = this.parseGitHubUrl(repositoryUrl);
    this.owner = owner;
    this.repo = repo;
    this.branch = branch;
    this.cacheTTL = cacheTTLMinutes * 60 * 1000; // Convert to milliseconds

    // Construct URLs using raw.githubusercontent.com
    this.githubRawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/${branch}`;
    this.githubApiUrl = `https://api.github.com/repos/${owner}/${repo}`;

    logger.info(
      {
        owner: this.owner,
        repo: this.repo,
        branch: this.branch,
        cacheTTLMinutes,
        rawUrl: this.githubRawUrl,
      },
      "GitHubSourceLoader initialized"
    );
  }

  /**
   * Parse GitHub URL to extract owner and repository name
   */
  private parseGitHubUrl(url: string): { owner: string; repo: string } {
    // Remove trailing slash
    url = url.replace(/\/$/, "");

    // Handle different GitHub URL formats
    // https://github.com/owner/repo
    // git@github.com:owner/repo.git
    // https://github.com/owner/repo.git

    let match = url.match(/github\.com[/:]([\w-]+)\/([\w-]+?)(\.git)?$/);

    if (!match || match.length < 3) {
      throw new Error(`Invalid GitHub URL format: ${url}`);
    }

    return {
      owner: match[1],
      repo: match[2],
    };
  }

  /**
   * Fetch content from GitHub using raw URL
   */
  private async fetchFromGitHub(path: string): Promise<string> {
    const cacheKey = path;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      logger.debug({ path }, "Using cached GitHub content");
      return cached.data;
    }

    try {
      const url = `${this.githubRawUrl}/.claude${path}`;
      logger.debug({ url }, "Fetching from GitHub raw");
      const response = await axios.get(url, {
        headers: {
          Accept: "text/plain",
        },
      });

      this.cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.debug({ path }, "File not found on GitHub");
        return "";
      }
      logger.error({ error: this.sanitizeError(error), path }, "Failed to fetch from GitHub");
      throw error;
    }
  }

  /**
   * List files in a directory using GitHub API
   */
  private async listGitHubDirectory(path: string): Promise<string[]> {
    const cacheKey = `dir:${path}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      logger.debug({ path }, "Using cached GitHub directory listing");
      return cached.data;
    }

    try {
      const url = `${this.githubApiUrl}/contents/.claude${path}?ref=${this.branch}`;
      logger.debug({ url }, "Listing GitHub directory");

      const response = await axios.get(url, {
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
      });

      const files: string[] = [];
      if (Array.isArray(response.data)) {
        for (const item of response.data) {
          if (
            item.type === "file" &&
            (this.isYamlFile(item.name) || this.isMarkdownFile(item.name))
          ) {
            files.push(path + "/" + item.name);
          } else if (item.type === "dir") {
            // Recursively list subdirectories
            const subFiles = await this.listGitHubDirectory(path + "/" + item.name);
            files.push(...subFiles);
          }
        }
      }

      this.cache.set(cacheKey, { data: files, timestamp: Date.now() });
      return files;
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.debug({ path }, "Directory not found on GitHub");
        return [];
      }
      logger.error({ error: this.sanitizeError(error), path }, "Failed to list GitHub directory");
      return [];
    }
  }

  async loadCommands(): Promise<Command[]> {
    try {
      const commands: Command[] = [];
      this.clearUnparsedFiles();

      // List all files in commands directory
      const commandFiles = await this.listGitHubDirectory("/commands");

      // Filter out shared directory files for now
      const directCommandFiles = commandFiles.filter(file => !file.includes("/commands/shared/"));

      for (const filePath of directCommandFiles) {
        try {
          const content = await this.fetchFromGitHub(filePath);
          if (!content) continue;

          // Handle markdown files differently
          if (this.isMarkdownFile(filePath)) {
            const command = this.parseMarkdownCommand(content, filePath);
            if (command) {
              commands.push(command);
              logger.debug(
                { file: filePath, commandName: command.name },
                "Loaded command from markdown"
              );
            }
          } else {
            // YAML file
            const data = await this.parseYamlContent(content, filePath);
            if (data) {
              const command = this.parseCommand(data, filePath);
              if (command) {
                commands.push(command);
                logger.debug(
                  { file: filePath, commandName: command.name },
                  "Loaded command from YAML"
                );
              }
            }
          }
        } catch (error) {
          logger.error(
            { error: this.sanitizeError(error), file: filePath },
            "Failed to load command"
          );
          this.trackUnparsedFile(filePath, error instanceof Error ? error.message : String(error));
        }
      }

      // Also check shared directory for command files
      const sharedFiles = await this.listGitHubDirectory("/shared");
      for (const filePath of sharedFiles) {
        try {
          const content = await this.fetchFromGitHub(filePath);
          if (!content) continue;

          const data = await this.parseYamlContent(content, filePath);
          if (data && this.categorizeContent(data, filePath) === "command") {
            const command = this.parseCommand(data, filePath);
            if (command) {
              commands.push(command);
              logger.debug(
                { file: filePath, commandName: command.name },
                "Loaded command from shared"
              );
            }
          }
        } catch (error) {
          logger.error(
            { error: this.sanitizeError(error), file: filePath },
            "Failed to load shared file"
          );
        }
      }

      logger.info(
        {
          count: commands.length,
          unparsedCount: this.unparsedFiles.length,
        },
        "Loaded commands from GitHub"
      );
      return commands;
    } catch (error) {
      logger.error({ error: this.sanitizeError(error) }, "Failed to load commands from GitHub");
      return [];
    }
  }

  async loadPersonas(): Promise<Persona[]> {
    try {
      const personas: Persona[] = [];
      this.clearUnparsedFiles();

      // First check for the standard personas file in shared directory
      const personasFiles = [
        "/shared/superclaude-personas.yaml",
        "/shared/superclaude-personas.yml",
      ];

      for (const personasFile of personasFiles) {
        try {
          const content = await this.fetchFromGitHub(personasFile);
          if (!content) continue;

          const data = await this.parseYamlContent(content, personasFile);
          if (data) {
            const parsedPersonas = this.parsePersonas(data, personasFile);
            personas.push(...parsedPersonas);
            logger.debug(
              { file: personasFile, count: parsedPersonas.length },
              "Loaded personas from shared file"
            );
            break; // Only load from one file
          }
        } catch (error) {
          if (error instanceof Error && !error.message.includes("404")) {
            logger.error(
              { error: this.sanitizeError(error), file: personasFile },
              "Failed to load personas file"
            );
            this.trackUnparsedFile(personasFile, error.message);
          }
        }
      }

      // If no personas found in shared, check personas directory (backward compatibility)
      if (personas.length === 0) {
        const personaFiles = await this.listGitHubDirectory("/personas");

        for (const filePath of personaFiles) {
          try {
            const content = await this.fetchFromGitHub(filePath);
            if (!content) continue;

            const data = await this.parseYamlContent(content, filePath);
            if (data) {
              const persona = this.parsePersona(data, this.getFileBaseName(filePath));
              if (persona) {
                personas.push(persona);
                logger.debug({ file: filePath, personaName: persona.name }, "Loaded persona");
              }
            }
          } catch (error) {
            logger.error(
              { error: this.sanitizeError(error), file: filePath },
              "Failed to load persona file"
            );
            this.trackUnparsedFile(
              filePath,
              error instanceof Error ? error.message : String(error)
            );
          }
        }
      }

      logger.info(
        {
          count: personas.length,
          unparsedCount: this.unparsedFiles.length,
        },
        "Loaded personas from GitHub"
      );
      return personas;
    } catch (error) {
      logger.error({ error: this.sanitizeError(error) }, "Failed to load personas from GitHub");
      return [];
    }
  }

  async loadRules(): Promise<SuperClaudeRules> {
    try {
      this.clearUnparsedFiles();

      // Check for rules file in shared directory
      const rulesFiles = ["/shared/superclaude-rules.yaml", "/shared/superclaude-rules.yml"];

      for (const rulesFile of rulesFiles) {
        try {
          const content = await this.fetchFromGitHub(rulesFile);
          if (!content) continue;

          const data = await this.parseYamlContent(content, rulesFile);
          if (data) {
            const rules = this.parseRules(data, rulesFile);
            logger.info(
              {
                count: rules.rules.length,
                unparsedCount: this.unparsedFiles.length,
              },
              "Loaded rules from GitHub"
            );
            return rules;
          }
        } catch (error) {
          if (error instanceof Error && !error.message.includes("404")) {
            logger.error(
              { error: this.sanitizeError(error), file: rulesFile },
              "Failed to load rules file"
            );
            this.trackUnparsedFile(rulesFile, error.message);
          }
        }
      }

      // Fallback to old location
      try {
        const content = await this.fetchFromGitHub("/rules/rules.yaml");
        if (content) {
          const data = await this.parseYamlContent(content, "/rules/rules.yaml");
          if (data) {
            const rules = this.parseRules(data, "/rules/rules.yaml");
            logger.info(
              {
                count: rules.rules.length,
                unparsedCount: this.unparsedFiles.length,
              },
              "Loaded rules from GitHub"
            );
            return rules;
          }
        }
      } catch (error) {
        logger.debug({ error: this.sanitizeError(error) }, "No rules found in legacy location");
      }

      logger.debug("No rules file found");
      return { rules: [] };
    } catch (error) {
      logger.error({ error: this.sanitizeError(error) }, "Failed to load rules from GitHub");
      return { rules: [] };
    }
  }

  clearCache(): void {
    this.cache.clear();
    this.clearUnparsedFiles();
    logger.debug("GitHub loader cache cleared");
  }

  async loadSharedIncludes(includes: string[]): Promise<string> {
    const contents: string[] = [];

    for (const include of includes) {
      try {
        const path = include.startsWith("@include")
          ? include.replace("@include ", "").trim()
          : include;

        // Try multiple possible locations
        const possiblePaths = [
          path.startsWith("/") ? path : "/" + path,
          `/commands/shared/${path}`,
          `/shared/${path}`,
        ];

        let loaded = false;
        for (const fullPath of possiblePaths) {
          try {
            const content = await this.fetchFromGitHub(fullPath);
            if (content) {
              contents.push(content);
              loaded = true;
              break;
            }
          } catch (error) {
            // Continue to next path
          }
        }

        if (!loaded) {
          logger.warn({ include, paths: possiblePaths }, "Include file not found in any location");
        }
      } catch (error) {
        logger.warn({ error: this.sanitizeError(error), include }, "Failed to load include");
      }
    }

    return contents.join("\n\n");
  }

  /**
   * Parse a markdown command file
   */
  private parseMarkdownCommand(content: string, filePath: string): Command | null {
    try {
      const name = this.getFileBaseName(filePath);

      // Extract description from Purpose line
      const purposeMatch = content.match(/\*\*Purpose\*\*:\s*(.+)/);
      const description = purposeMatch ? purposeMatch[1].trim() : `Command: ${name}`;

      // The entire content is the prompt
      const prompt = content;

      // Parse arguments from content (look for $ARGUMENTS or specific argument patterns)
      const argumentMatches = content.match(/\$([A-Z_]+)/g);
      const uniqueArgNames = argumentMatches
        ? [...new Set(argumentMatches.map(arg => arg.replace("$", "")))]
        : [];

      const commandArguments =
        uniqueArgNames.length > 0
          ? uniqueArgNames.map(argName => ({
              name: argName,
              description: `Argument: $${argName}`,
              required: true,
            }))
          : undefined;

      return {
        name,
        description,
        prompt,
        arguments: commandArguments,
      };
    } catch (error) {
      logger.error(
        { error: this.sanitizeError(error), file: filePath },
        "Failed to parse markdown command"
      );
      return null;
    }
  }

  /**
   * Get the base name of a file (without path and extension)
   */
  private getFileBaseName(filePath: string): string {
    const parts = filePath.split("/");
    const filename = parts[parts.length - 1];
    return filename.replace(/\.(yaml|yml|md)$/, "");
  }

  /**
   * Sanitize error objects for logging
   */
  private sanitizeError(error: any) {
    if (!error) return error;

    // For YAML parsing errors, extract only essential information
    if (error.name === "YAMLException" || error.reason) {
      return {
        name: error.name,
        reason: error.reason,
        message: error.message,
        line: error.mark?.line,
        column: error.mark?.column,
        snippet: error.mark?.snippet,
      };
    }

    // For axios errors
    if (error.response) {
      return {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        message: error.message,
      };
    }

    // For other errors
    return {
      name: error.name,
      message: error.message,
      code: error.code,
    };
  }

  /**
   * Get information about the GitHub source
   */
  getSourceInfo(): {
    type: "remote";
    owner: string;
    repo: string;
    branch: string;
    url: string;
    cacheTTLMinutes: number;
  } {
    return {
      type: "remote",
      owner: this.owner,
      repo: this.repo,
      branch: this.branch,
      url: `https://github.com/${this.owner}/${this.repo}`,
      cacheTTLMinutes: this.cacheTTL / 60000,
    };
  }
}
