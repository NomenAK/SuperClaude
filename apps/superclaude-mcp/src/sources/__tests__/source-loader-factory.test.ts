import { describe, it, expect, vi, beforeEach } from "vitest";
import { SourceLoaderFactory } from "../source-loader-factory.js";
import { LocalSourceLoader } from "../local-source-loader.js";
import { GitHubSourceLoader } from "../github-source-loader.js";
import { SourceConfig } from "@/models/config.model.js";

// Mock the source loaders
vi.mock("../local-source-loader.js");
vi.mock("../github-source-loader.js");

describe("SourceLoaderFactory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create LocalSourceLoader for local source type", () => {
      const sourceConfig: SourceConfig = {
        type: "local",
        local: { path: "/test/data" },
        remote: {
          url: "https://github.com/default/repo",
          branch: "main",
          cacheTTL: 60,
        },
      };

      const loader = SourceLoaderFactory.create(sourceConfig);

      expect(LocalSourceLoader).toHaveBeenCalledWith("/test/data");
      expect(loader).toBeInstanceOf(LocalSourceLoader);
      expect(GitHubSourceLoader).not.toHaveBeenCalled();
    });

    it("should create GitHubSourceLoader for remote source type", () => {
      const sourceConfig: SourceConfig = {
        type: "remote",
        remote: {
          url: "https://github.com/test/repo",
          branch: "develop",
          cacheTTL: 120,
        },
        local: { path: "/default/path" },
      };

      const loader = SourceLoaderFactory.create(sourceConfig);

      expect(GitHubSourceLoader).toHaveBeenCalledWith(
        "https://github.com/test/repo",
        "develop",
        120
      );
      expect(loader).toBeInstanceOf(GitHubSourceLoader);
      expect(LocalSourceLoader).not.toHaveBeenCalled();
    });

    it("should use default local path if not provided", () => {
      const sourceConfig: SourceConfig = {
        type: "local",
        local: { path: "/default/path" },
        remote: {
          url: "https://github.com/default/repo",
          branch: "main",
          cacheTTL: 60,
        },
      };

      const loader = SourceLoaderFactory.create(sourceConfig);

      expect(LocalSourceLoader).toHaveBeenCalledWith("/default/path");
    });

    it("should handle various GitHub URL formats for remote source", () => {
      const testCases = [
        {
          url: "https://github.com/owner/repo",
          expectedArgs: ["https://github.com/owner/repo", "main", 60],
        },
        {
          url: "https://github.com/owner/repo.git",
          expectedArgs: ["https://github.com/owner/repo.git", "main", 60],
        },
        {
          url: "git@github.com:owner/repo.git",
          expectedArgs: ["git@github.com:owner/repo.git", "main", 60],
        },
      ];

      testCases.forEach(({ url, expectedArgs }) => {
        vi.clearAllMocks();

        const sourceConfig: SourceConfig = {
          type: "remote",
          remote: { url, branch: "main", cacheTTL: 60 },
          local: { path: "/default/path" },
        };

        SourceLoaderFactory.create(sourceConfig);

        expect(GitHubSourceLoader).toHaveBeenCalledWith(...expectedArgs);
      });
    });
  });

  describe("validateConfig", () => {
    it("should validate local source config", () => {
      const config: SourceConfig = {
        type: "local",
        local: { path: "/test/path" },
        remote: {
          url: "https://github.com/default/repo",
          branch: "main",
          cacheTTL: 60,
        },
      };

      // Should not throw
      expect(() => SourceLoaderFactory.validateConfig(config)).not.toThrow();
    });

    it("should throw for local source without path", () => {
      const config: SourceConfig = {
        type: "local",
        local: { path: "" },
        remote: {
          url: "https://github.com/default/repo",
          branch: "main",
          cacheTTL: 60,
        },
      };

      expect(() => SourceLoaderFactory.validateConfig(config)).toThrow(
        "Local source path is required"
      );
    });

    it("should validate remote source config", () => {
      const config: SourceConfig = {
        type: "remote",
        remote: {
          url: "https://github.com/test/repo",
          branch: "main",
          cacheTTL: 60,
        },
        local: { path: "/default/path" },
      };

      // Should not throw
      expect(() => SourceLoaderFactory.validateConfig(config)).not.toThrow();
    });

    it("should throw for invalid remote URL", () => {
      const config: SourceConfig = {
        type: "remote",
        remote: {
          url: "not-a-url",
          branch: "main",
          cacheTTL: 60,
        },
        local: { path: "/default/path" },
      };

      expect(() => SourceLoaderFactory.validateConfig(config)).toThrow(
        "Invalid remote source URL format"
      );
    });
  });

  describe("edge cases", () => {
    it("should handle empty path for local source", () => {
      const sourceConfig: SourceConfig = {
        type: "local",
        local: { path: "" },
        remote: {
          url: "https://github.com/default/repo",
          branch: "main",
          cacheTTL: 60,
        },
      };

      const loader = SourceLoaderFactory.create(sourceConfig);

      expect(LocalSourceLoader).toHaveBeenCalledWith("");
    });

    it("should handle very long cache TTL for remote source", () => {
      const sourceConfig: SourceConfig = {
        type: "remote",
        remote: {
          url: "https://github.com/test/repo",
          branch: "main",
          cacheTTL: 999999,
        },
        local: { path: "/default/path" },
      };

      const loader = SourceLoaderFactory.create(sourceConfig);

      expect(GitHubSourceLoader).toHaveBeenCalledWith(
        "https://github.com/test/repo",
        "main",
        999999
      );
    });

    it("should handle minimum cache TTL for remote source", () => {
      const sourceConfig: SourceConfig = {
        type: "remote",
        remote: {
          url: "https://github.com/test/repo",
          branch: "main",
          cacheTTL: 1,
        },
        local: { path: "/default/path" },
      };

      const loader = SourceLoaderFactory.create(sourceConfig);

      expect(GitHubSourceLoader).toHaveBeenCalledWith("https://github.com/test/repo", "main", 1);
    });
  });
});
