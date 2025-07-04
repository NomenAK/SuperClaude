import yaml from "js-yaml";
import { parse as parseYAML } from "yaml";
import logger from "@/logger.js";
import { Command, Persona } from "@/schemas.js";
import { SuperClaudeRules } from "@types";
import { ISourceLoader } from "./interfaces.js";
import type { UnparsedFile } from "@/models/database.model.js";

export type { UnparsedFile };

export interface LoadResult<T> {
  data: T[];
  unparsedFiles: UnparsedFile[];
}

/**
 * Base class for source loaders with shared functionality
 */
export abstract class BaseSourceLoader implements ISourceLoader {
  protected unparsedFiles: UnparsedFile[] = [];

  /**
   * Load commands from the source
   */
  abstract loadCommands(): Promise<Command[]>;

  /**
   * Load personas from the source
   */
  abstract loadPersonas(): Promise<Persona[]>;

  /**
   * Load rules from the source
   */
  abstract loadRules(): Promise<SuperClaudeRules>;

  /**
   * Clear any cached data
   */
  abstract clearCache(): void;

  /**
   * Load shared includes (for command templates)
   */
  abstract loadSharedIncludes(includes: string[]): Promise<string>;

  /**
   * Get unparsed files from the last load operation
   */
  getUnparsedFiles(): UnparsedFile[] {
    return [...this.unparsedFiles];
  }

  /**
   * Clear unparsed files list
   */
  clearUnparsedFiles(): void {
    this.unparsedFiles = [];
  }

  /**
   * Parse YAML content with multiple fallback strategies
   */
  protected async parseYamlContent(content: string, filePath: string): Promise<any | null> {
    try {
      // First attempt: Use the more lenient yaml parser (handles duplicate keys)
      return parseYAML(content, {
        uniqueKeys: false, // Allow duplicate keys - last value wins
        merge: true,
        strict: false,
        logLevel: "error",
      });
    } catch (parseError) {
      logger.debug(
        { error: parseError, file: filePath },
        "YAML package parsing failed, trying js-yaml"
      );

      try {
        // Second attempt: Standard js-yaml parsing
        return yaml.load(content, {
          schema: yaml.JSON_SCHEMA,
          onWarning: warning => {
            logger.warn({ warning: warning.toString(), file: filePath }, "YAML warning");
          },
        });
      } catch (error) {
        logger.debug(
          { error, file: filePath },
          "Standard YAML parsing failed, trying manual fallback"
        );

        // Third attempt: Manual parsing for complex duplicate keys
        try {
          return this.parseYamlManually(content);
        } catch (fallbackError) {
          // Track as unparsed file
          this.trackUnparsedFile(filePath, error instanceof Error ? error.message : String(error));
          return null;
        }
      }
    }
  }

  /**
   * Manual YAML parsing for files with duplicate keys or other issues
   */
  protected parseYamlManually(content: string): any {
    const result: any = {};
    const lines = content.split("\n");
    let currentKey: string | null = null;
    let currentIndent = 0;
    let currentObject: any = result;
    const objectStack: any[] = [result];
    const keyStack: string[] = [];

    for (const line of lines) {
      // Skip comments and empty lines
      if (line.trim().startsWith("#") || !line.trim()) continue;

      const indent = line.length - line.trimStart().length;
      const trimmedLine = line.trim();

      // Handle dedent
      while (indent < currentIndent && objectStack.length > 1) {
        objectStack.pop();
        keyStack.pop();
        currentObject = objectStack[objectStack.length - 1];
        currentIndent -= 2; // Assuming 2-space indentation
      }

      // Parse key-value pairs
      if (trimmedLine.includes(":")) {
        const colonIndex = trimmedLine.indexOf(":");
        const key = trimmedLine.substring(0, colonIndex).trim();
        const value = trimmedLine.substring(colonIndex + 1).trim();

        if (value) {
          // Direct key-value pair
          currentObject[key] = value.replace(/^["']|["']$/g, ""); // Remove quotes
        } else {
          // New object
          currentObject[key] = {};
          objectStack.push(currentObject[key]);
          keyStack.push(key);
          currentObject = currentObject[key];
          currentIndent = indent;
          currentKey = key;
        }
      } else if (currentKey && trimmedLine.startsWith("-")) {
        // Array item
        if (!Array.isArray(currentObject[currentKey])) {
          currentObject[currentKey] = [];
        }
        const value = trimmedLine
          .substring(1)
          .trim()
          .replace(/^["']|["']$/g, "");
        currentObject[currentKey].push(value);
      }
    }

    return result;
  }

  /**
   * Track a file that couldn't be parsed
   */
  protected trackUnparsedFile(path: string, error: string): void {
    this.unparsedFiles.push({
      path,
      error,
      timestamp: new Date(),
    });
    logger.warn({ path, error }, "Failed to parse file, tracking as unparsed");
  }

  /**
   * Determine the type of content based on structure
   */
  protected categorizeContent(
    content: any,
    filePath: string
  ): "command" | "persona" | "rule" | "unknown" {
    if (!content || typeof content !== "object") {
      return "unknown";
    }

    // Check for command structure
    if (content.name && content.prompt) {
      return "command";
    }

    // Check for persona structure
    if (content.name && (content.instructions || content.Identity || content.Core_Belief)) {
      return "persona";
    }

    // Check for rules structure
    if (content.rules && Array.isArray(content.rules)) {
      return "rule";
    }

    // Check for nested personas (All_Personas)
    if (content.All_Personas || content.personas) {
      return "persona";
    }

    // Check if it's a map of personas
    const values = Object.values(content);
    if (
      values.length > 0 &&
      values.every(
        (v: any) => v && typeof v === "object" && (v.Identity || v.Core_Belief || v.instructions)
      )
    ) {
      return "persona";
    }

    return "unknown";
  }

  /**
   * Parse a command from content
   */
  protected parseCommand(content: any, filePath: string): Command | null {
    try {
      // Validate required fields
      if (!content.name || !content.prompt) {
        logger.debug({ file: filePath, content }, "Invalid command structure");
        return null;
      }

      return {
        name: content.name,
        description: content.description || `Command: ${content.name}`,
        prompt: content.prompt,
        messages: content.messages,
        arguments: content.arguments,
      };
    } catch (error) {
      logger.error({ error, file: filePath }, "Failed to parse command");
      return null;
    }
  }

  /**
   * Parse personas from content (handles various formats)
   */
  protected parsePersonas(content: any, filePath: string): Persona[] {
    const personas: Persona[] = [];

    try {
      // Handle All_Personas or personas section
      const personasData = content?.All_Personas || content?.personas || content;

      if (personasData && typeof personasData === "object") {
        for (const [key, value] of Object.entries(personasData)) {
          if (typeof value === "object" && value !== null) {
            const persona = this.parsePersona(value, key);
            if (persona) {
              personas.push(persona);
            }
          }
        }
      }
    } catch (error) {
      logger.error({ error, file: filePath }, "Failed to parse personas");
    }

    return personas;
  }

  /**
   * Parse a single persona
   */
  protected parsePersona(data: any, defaultName: string): Persona | null {
    try {
      // Check if Identity contains multiple personas separated by |
      if (data.Identity && data.Identity.includes("|")) {
        // This is a multi-persona entry, we'll use the defaultName (key) as the persona name
        const name = defaultName;
        const description = data.Core_Belief || `${name} persona`;

        // Build instructions from various fields
        const instructionParts = [
          data.Identity,
          data.Core_Belief,
          data.Primary_Question,
          data.Decision_Framework,
          data.Problem_Solving,
          data.Focus,
        ].filter(Boolean);

        const instructions =
          instructionParts.length > 0 ? instructionParts.join(". ") : description;

        return {
          name,
          description,
          instructions,
        };
      }

      // Original logic for other persona formats
      const name = data.name || data.Identity || defaultName;
      const description = data.description || data.Core_Belief || `${name} persona`;

      // Build instructions from various fields
      const instructionParts = [
        data.instructions,
        data.Identity,
        data.Core_Belief,
        data.Problem_Solving,
        data.Focus,
      ].filter(Boolean);

      const instructions = instructionParts.length > 0 ? instructionParts.join(". ") : description;

      return {
        name,
        description,
        instructions,
      };
    } catch (error) {
      logger.error({ error, data }, "Failed to parse persona");
      return null;
    }
  }

  /**
   * Parse rules from content
   */
  protected parseRules(content: any, filePath: string): SuperClaudeRules {
    const rules: Array<{ name: string; content: string }> = [];

    try {
      // Direct rules array
      if (content.rules && Array.isArray(content.rules)) {
        for (const rule of content.rules) {
          if (rule.name && rule.content) {
            rules.push(rule);
          }
        }
      } else {
        // Extract rules from nested structure
        this.extractRulesFromObject(content, rules);
      }
    } catch (error) {
      logger.error({ error, file: filePath }, "Failed to parse rules");
    }

    return { rules };
  }

  /**
   * Recursively extract rules from nested objects
   */
  private extractRulesFromObject(
    obj: any,
    rules: Array<{ name: string; content: string }>,
    prefix = ""
  ): void {
    if (typeof obj === "string") {
      if (prefix) {
        // Use only the last part of the path as the rule name
        const parts = prefix.split(".");
        const leafName = parts[parts.length - 1];
        rules.push({
          name: leafName,
          content: obj,
        });
      }
    } else if (typeof obj === "object" && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        const newPrefix = prefix ? `${prefix}.${key}` : key;
        this.extractRulesFromObject(value, rules, newPrefix);
      }
    }
  }

  /**
   * Check if a file has YAML extension
   */
  protected isYamlFile(filename: string): boolean {
    return filename.endsWith(".yaml") || filename.endsWith(".yml");
  }

  /**
   * Check if a file is markdown
   */
  protected isMarkdownFile(filename: string): boolean {
    return filename.endsWith(".md");
  }
}
