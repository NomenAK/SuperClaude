import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, it, expect, beforeAll } from "vitest";
import path from "node:path";

describe("E2E Build Tests", () => {
  const projectRoot = path.resolve(__dirname, "..");
  const packageJsonPath = path.join(projectRoot, "package.json");
  let packageJson: { version: string; name?: string; description?: string };

  beforeAll(() => {
    // Read the package.json to get expected version
    packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

    // Ensure the project is built
    try {
      execSync("pnpm build", {
        cwd: projectRoot,
        stdio: "inherit",
        timeout: 30000,
      });
    } catch (error) {
      throw new Error(`Build failed: ${error}`);
    }
  });

  describe("CommonJS Build", () => {
    it("should execute CJS build and return correct version", () => {
      const result = execSync("node dist/main.cjs --version", {
        cwd: projectRoot,
        encoding: "utf-8",
        timeout: 30000,
      });

      expect(result.trim()).toBe(packageJson.version);
    });

    it("should execute CJS build help command successfully", () => {
      const result = execSync("node dist/main.cjs --help", {
        cwd: projectRoot,
        encoding: "utf-8",
        timeout: 30000,
      });

      expect(result).toContain("Usage:");
      expect(result).toContain("superclaude-mcp");
    });
  });

  describe("ESM Build", () => {
    it("should execute ESM build and return correct version", () => {
      const result = execSync("node dist/main.js --version", {
        cwd: projectRoot,
        encoding: "utf-8",
        timeout: 30000,
      });

      expect(result.trim()).toBe(packageJson.version);
    });

    it("should execute ESM build help command successfully", () => {
      const result = execSync("node dist/main.js --help", {
        cwd: projectRoot,
        encoding: "utf-8",
        timeout: 30000,
      });

      expect(result).toContain("Usage:");
      expect(result).toContain("superclaude-mcp");
    });
  });

  describe("Package.json Integration", () => {
    it("should have consistent version across CJS and ESM builds", () => {
      const cjsResult = execSync("node dist/main.cjs --version", {
        cwd: projectRoot,
        encoding: "utf-8",
        timeout: 30000,
      });

      const esmResult = execSync("node dist/main.js --version", {
        cwd: projectRoot,
        encoding: "utf-8",
        timeout: 30000,
      });

      expect(cjsResult.trim()).toBe(esmResult.trim());
      expect(cjsResult.trim()).toBe(packageJson.version);
    });

    it("should include package name and description in help output", () => {
      const packageName = packageJson.name || "superclaude-mcp";

      const cjsHelp = execSync("node dist/main.cjs --help", {
        cwd: projectRoot,
        encoding: "utf-8",
        timeout: 30000,
      });

      const esmHelp = execSync("node dist/main.js --help", {
        cwd: projectRoot,
        encoding: "utf-8",
        timeout: 30000,
      });

      // Both builds should contain package info
      [cjsHelp, esmHelp].forEach(help => {
        expect(help).toContain(packageName);
        expect(help).toContain("MCP server providing portable access");
      });
    });
  });

  describe("Build Artifacts", () => {
    it("should have generated both CJS and ESM entry points", () => {
      const cjsMainExists = (() => {
        try {
          execSync("test -f dist/main.cjs", { cwd: projectRoot });
          return true;
        } catch {
          return false;
        }
      })();

      const esmMainExists = (() => {
        try {
          execSync("test -f dist/main.js", { cwd: projectRoot });
          return true;
        } catch {
          return false;
        }
      })();

      expect(cjsMainExists).toBe(true);
      expect(esmMainExists).toBe(true);
    });

    it("should have generated TypeScript declaration files", () => {
      const dtsExists = (() => {
        try {
          execSync("test -f dist/index.d.ts", { cwd: projectRoot });
          return true;
        } catch {
          return false;
        }
      })();

      expect(dtsExists).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid arguments gracefully in both builds", () => {
      const testInvalidArg = (command: string) => {
        try {
          execSync(`${command} --invalid-flag`, {
            cwd: projectRoot,
            encoding: "utf-8",
            timeout: 10000,
          });
          return { success: true, output: "" };
        } catch (error: any) {
          return {
            success: false,
            output: error.stdout?.toString() || "",
            stderr: error.stderr?.toString() || "",
          };
        }
      };

      const cjsResult = testInvalidArg("node dist/main.cjs");
      const esmResult = testInvalidArg("node dist/main.js");

      // Both should fail with invalid arguments but not crash
      expect(cjsResult.success).toBe(false);
      expect(esmResult.success).toBe(false);

      // Should contain error message about unknown option
      [cjsResult.output + cjsResult.stderr, esmResult.output + esmResult.stderr].forEach(output => {
        expect(output.toLowerCase()).toMatch(/unknown.*option|error.*unknown/);
      });
    });
  });
});
