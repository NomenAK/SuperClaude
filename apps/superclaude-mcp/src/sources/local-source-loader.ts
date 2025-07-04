import fs from "fs/promises";
import path from "path";
import logger from "@/logger.js";
import { Command, Persona } from "@/schemas.js";
import { SuperClaudeRules } from "@types";
import { BaseSourceLoader } from "./base-source-loader.js";

/**
 * LocalSourceLoader loads SuperClaude data from local file system
 * Expected directory structure:
 * {basePath}/
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
export class LocalSourceLoader extends BaseSourceLoader {
  private readonly basePath: string;

  constructor(basePath?: string) {
    super();
    // Default to .claude in current directory if no path provided
    this.basePath = basePath || path.join(process.cwd(), ".claude");
    logger.info({ basePath: this.basePath }, "LocalSourceLoader initialized");
  }

  async loadCommands(): Promise<Command[]> {
    try {
      const commands: Command[] = [];
      this.clearUnparsedFiles();

      // Load from commands directory
      const commandsPath = path.join(this.basePath, "commands");
      if (await this.directoryExists(commandsPath)) {
        const commandFiles = await this.discoverYamlFiles(commandsPath, ["shared"]);

        for (const filePath of commandFiles) {
          try {
            const content = await fs.readFile(filePath, "utf-8");
            const data = await this.parseYamlContent(content, filePath);

            if (data) {
              const command = this.parseCommand(data, filePath);
              if (command) {
                commands.push(command);
                logger.debug({ file: filePath, commandName: command.name }, "Loaded command");
              }
            }
          } catch (error) {
            logger.error({ error, file: filePath }, "Failed to load command file");
            this.trackUnparsedFile(
              filePath,
              error instanceof Error ? error.message : String(error)
            );
          }
        }
      }

      // Also check shared directory for command files
      const sharedPath = path.join(this.basePath, "shared");
      if (await this.directoryExists(sharedPath)) {
        const sharedFiles = await this.discoverYamlFiles(sharedPath);

        for (const filePath of sharedFiles) {
          try {
            const content = await fs.readFile(filePath, "utf-8");
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
            logger.error({ error, file: filePath }, "Failed to load shared file");
          }
        }
      }

      logger.info(
        {
          count: commands.length,
          path: this.basePath,
          unparsedCount: this.unparsedFiles.length,
        },
        "Loaded commands from local directory"
      );

      return commands;
    } catch (error) {
      logger.error({ error, basePath: this.basePath }, "Failed to load commands from local source");
      throw new Error(
        `Failed to load commands: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async loadPersonas(): Promise<Persona[]> {
    try {
      const personas: Persona[] = [];
      this.clearUnparsedFiles();

      // First check for the standard personas file in shared directory
      const sharedPersonasPath = path.join(this.basePath, "shared", "superclaude-personas.yaml");
      const sharedPersonasAltPath = path.join(this.basePath, "shared", "superclaude-personas.yml");

      for (const personasFilePath of [sharedPersonasPath, sharedPersonasAltPath]) {
        if (await this.fileExists(personasFilePath)) {
          try {
            const content = await fs.readFile(personasFilePath, "utf-8");
            const data = await this.parseYamlContent(content, personasFilePath);

            if (data) {
              const parsedPersonas = this.parsePersonas(data, personasFilePath);
              personas.push(...parsedPersonas);
              logger.debug(
                { file: personasFilePath, count: parsedPersonas.length },
                "Loaded personas from shared file"
              );
            }
          } catch (error) {
            logger.error({ error, file: personasFilePath }, "Failed to load personas file");
            this.trackUnparsedFile(
              personasFilePath,
              error instanceof Error ? error.message : String(error)
            );
          }
          break; // Only load from one file
        }
      }

      // Also check personas directory if it exists (backward compatibility)
      const personasPath = path.join(this.basePath, "personas");
      if (await this.directoryExists(personasPath)) {
        const personaFiles = await this.discoverYamlFiles(personasPath);

        for (const filePath of personaFiles) {
          try {
            const content = await fs.readFile(filePath, "utf-8");
            const data = await this.parseYamlContent(content, filePath);

            if (data) {
              const persona = this.parsePersona(
                data,
                path.basename(filePath, path.extname(filePath))
              );
              if (persona) {
                personas.push(persona);
                logger.debug({ file: filePath, personaName: persona.name }, "Loaded persona");
              }
            }
          } catch (error) {
            logger.error({ error, file: filePath }, "Failed to load persona file");
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
          path: this.basePath,
          unparsedCount: this.unparsedFiles.length,
        },
        "Loaded personas from local directory"
      );

      return personas;
    } catch (error) {
      logger.error({ error, basePath: this.basePath }, "Failed to load personas from local source");
      throw new Error(
        `Failed to load personas: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async loadRules(): Promise<SuperClaudeRules> {
    try {
      this.clearUnparsedFiles();

      // Check for rules file in shared directory
      const sharedRulesPath = path.join(this.basePath, "shared", "superclaude-rules.yaml");
      const sharedRulesAltPath = path.join(this.basePath, "shared", "superclaude-rules.yml");

      for (const rulesFilePath of [sharedRulesPath, sharedRulesAltPath]) {
        if (await this.fileExists(rulesFilePath)) {
          try {
            const content = await fs.readFile(rulesFilePath, "utf-8");
            const data = await this.parseYamlContent(content, rulesFilePath);

            if (data) {
              const rules = this.parseRules(data, rulesFilePath);
              logger.info(
                {
                  count: rules.rules.length,
                  unparsedCount: this.unparsedFiles.length,
                },
                "Loaded rules from local directory"
              );
              return rules;
            }
          } catch (error) {
            logger.error({ error, file: rulesFilePath }, "Failed to load rules file");
            this.trackUnparsedFile(
              rulesFilePath,
              error instanceof Error ? error.message : String(error)
            );
          }
        }
      }

      // Fallback to old location
      const rulesPath = path.join(this.basePath, "rules", "rules.yaml");
      if (await this.fileExists(rulesPath)) {
        try {
          const content = await fs.readFile(rulesPath, "utf-8");
          const data = await this.parseYamlContent(content, rulesPath);

          if (data) {
            const rules = this.parseRules(data, rulesPath);
            logger.info(
              {
                count: rules.rules.length,
                unparsedCount: this.unparsedFiles.length,
              },
              "Loaded rules from local directory"
            );
            return rules;
          }
        } catch (error) {
          logger.error({ error, file: rulesPath }, "Failed to load rules file");
          this.trackUnparsedFile(rulesPath, error instanceof Error ? error.message : String(error));
        }
      }

      logger.debug({ path: this.basePath }, "No rules file found");
      return { rules: [] };
    } catch (error) {
      logger.error({ error, basePath: this.basePath }, "Failed to load rules from local source");
      throw new Error(
        `Failed to load rules: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  clearCache(): void {
    // Local source loader doesn't use caching
    this.clearUnparsedFiles();
    logger.debug("Local source loader cache cleared");
  }

  async loadSharedIncludes(includes: string[]): Promise<string> {
    const contents: string[] = [];

    for (const include of includes) {
      try {
        const includePath = include.startsWith("@include")
          ? include.replace("@include ", "").trim()
          : include;

        // Check multiple possible locations
        const possiblePaths = [
          path.join(this.basePath, includePath),
          path.join(this.basePath, "commands", "shared", includePath),
          path.join(this.basePath, "shared", includePath),
        ];

        let loaded = false;
        for (const fullPath of possiblePaths) {
          if (await this.fileExists(fullPath)) {
            const content = await fs.readFile(fullPath, "utf-8");
            contents.push(content);
            loaded = true;
            break;
          }
        }

        if (!loaded) {
          logger.warn({ include, paths: possiblePaths }, "Include file not found in any location");
        }
      } catch (error) {
        logger.warn({ error, include }, "Failed to load include from local source");
      }
    }

    return contents.join("\n\n");
  }

  /**
   * Discover all YAML files in a directory recursively
   */
  private async discoverYamlFiles(dirPath: string, excludeDirs: string[] = []): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory() && !excludeDirs.includes(entry.name)) {
          // Recursively discover files in subdirectories
          const subFiles = await this.discoverYamlFiles(fullPath, excludeDirs);
          files.push(...subFiles);
        } else if (entry.isFile() && this.isYamlFile(entry.name)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      logger.error({ error, path: dirPath }, "Failed to discover files in directory");
    }

    return files;
  }

  /**
   * Check if a directory exists
   */
  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Check if a file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(filePath);
      return stat.isFile();
    } catch {
      return false;
    }
  }

  /**
   * Get information about the local source
   */
  getSourceInfo(): { type: "local"; basePath: string } {
    return {
      type: "local",
      basePath: this.basePath,
    };
  }
}
