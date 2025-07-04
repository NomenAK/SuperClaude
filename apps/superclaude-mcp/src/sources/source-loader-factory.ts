import { SourceConfig } from "@/models/config.model.js";
import logger from "@/logger.js";
import { ISourceLoader } from "./interfaces.js";
import { GitHubSourceLoader } from "./github-source-loader.js";
import { LocalSourceLoader } from "./local-source-loader.js";

/**
 * Factory class for creating source loaders based on configuration
 */
export class SourceLoaderFactory {
  /**
   * Create a source loader instance based on the provided configuration
   */
  static create(sourceConfig: SourceConfig): ISourceLoader {
    switch (sourceConfig.type) {
      case "local":
        if (!sourceConfig.local) {
          throw new Error("Local source configuration is required when type is 'local'");
        }
        return this.createLocalSourceLoader(sourceConfig.local.path);

      case "remote":
        if (!sourceConfig.remote) {
          throw new Error("Remote source configuration is required when type is 'remote'");
        }
        return this.createGitHubSourceLoader(
          sourceConfig.remote.url,
          sourceConfig.remote.branch,
          sourceConfig.remote.cacheTTL
        );

      default:
        throw new Error(`Unsupported source type: ${(sourceConfig as any).type}`);
    }
  }

  /**
   * Create a local source loader
   */
  private static createLocalSourceLoader(basePath: string): LocalSourceLoader {
    logger.info({ basePath }, "Creating local source loader");
    return new LocalSourceLoader(basePath);
  }

  /**
   * Create a GitHub source loader with configurable URL, branch, and cache TTL
   */
  private static createGitHubSourceLoader(
    repositoryUrl: string,
    branch = "main",
    cacheTTL = 5
  ): GitHubSourceLoader {
    logger.info({ repositoryUrl, branch, cacheTTL }, "Creating GitHub source loader");

    return new GitHubSourceLoader(repositoryUrl, branch, cacheTTL);
  }

  /**
   * Validate source configuration
   */
  static validateConfig(sourceConfig: SourceConfig): void {
    switch (sourceConfig.type) {
      case "local":
        if (!sourceConfig.local?.path) {
          throw new Error("Local source path is required");
        }
        break;

      case "remote":
        if (!sourceConfig.remote?.url) {
          throw new Error("Remote source URL is required");
        }

        // Validate URL format
        try {
          new URL(sourceConfig.remote.url);
        } catch {
          throw new Error("Invalid remote source URL format");
        }

        // Validate GitHub URL (basic check)
        if (!sourceConfig.remote.url.includes("github.com")) {
          logger.warn(
            { url: sourceConfig.remote.url },
            "Remote URL is not a GitHub URL - this may not work as expected"
          );
        }
        break;

      default:
        throw new Error(`Unsupported source type: ${(sourceConfig as any).type}`);
    }
  }

  /**
   * Get information about what type of source loader would be created
   */
  static getSourceLoaderInfo(sourceConfig: SourceConfig): {
    type: string;
    description: string;
    config: any;
  } {
    switch (sourceConfig.type) {
      case "local":
        return {
          type: "local",
          description: "Local file system source loader",
          config: sourceConfig.local,
        };

      case "remote":
        return {
          type: "remote",
          description: "GitHub repository source loader",
          config: sourceConfig.remote,
        };

      default:
        throw new Error(`Unsupported source type: ${(sourceConfig as any).type}`);
    }
  }
}
