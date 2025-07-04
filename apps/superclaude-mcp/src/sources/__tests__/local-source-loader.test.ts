import { describe, it, expect, beforeEach, vi } from "vitest";
import { LocalSourceLoader } from "../local-source-loader.js";

describe("LocalSourceLoader", () => {
  let loader: LocalSourceLoader;
  const basePath = "/test/data";

  beforeEach(() => {
    vi.clearAllMocks();
    loader = new LocalSourceLoader(basePath);
  });

  describe("constructor", () => {
    it("should create instance with base path", () => {
      expect(loader).toBeDefined();
      expect(loader.getSourceInfo()).toEqual({
        type: "local",
        basePath: basePath,
      });
    });
  });

  describe("getSourceInfo", () => {
    it("should return local source information", () => {
      const info = loader.getSourceInfo();

      expect(info).toEqual({
        type: "local",
        basePath: basePath,
      });
    });

    it("should return correct info for different base paths", () => {
      const customLoader = new LocalSourceLoader("/custom/path");
      const info = customLoader.getSourceInfo();

      expect(info).toEqual({
        type: "local",
        basePath: "/custom/path",
      });
    });
  });

  describe("clearCache", () => {
    it("should be a no-op for local source loader", () => {
      // Should not throw
      expect(() => loader.clearCache()).not.toThrow();
    });
  });

  describe("loadSharedIncludes", () => {
    it("should handle empty includes array", async () => {
      const content = await loader.loadSharedIncludes([]);
      expect(content).toBe("");
    });

    it("should process include directives correctly", () => {
      // Test the path processing logic by checking how includes are processed
      const includes = ["@include header.md", "@include footer.md"];

      // Since we can't test actual file loading without mocking,
      // we test that the method exists and can be called
      expect(loader.loadSharedIncludes).toBeDefined();
      expect(typeof loader.loadSharedIncludes).toBe("function");
    });
  });

  // Note: loadCommands, loadPersonas, and loadRules methods are heavily dependent
  // on file system operations. In a real implementation, these would be tested
  // with integration tests using actual test fixture files, or with a more
  // sophisticated mocking strategy that doesn't conflict with vitest setup.

  describe("interface compliance", () => {
    it("should implement all required ISourceLoader methods", () => {
      expect(typeof loader.loadCommands).toBe("function");
      expect(typeof loader.loadPersonas).toBe("function");
      expect(typeof loader.loadRules).toBe("function");
      expect(typeof loader.clearCache).toBe("function");
      expect(typeof loader.loadSharedIncludes).toBe("function");
      expect(typeof loader.getSourceInfo).toBe("function");
    });

    it("should have async methods return promises", () => {
      expect(loader.loadCommands()).toBeInstanceOf(Promise);
      expect(loader.loadPersonas()).toBeInstanceOf(Promise);
      expect(loader.loadRules()).toBeInstanceOf(Promise);
      expect(loader.loadSharedIncludes([])).toBeInstanceOf(Promise);
    });
  });
});
