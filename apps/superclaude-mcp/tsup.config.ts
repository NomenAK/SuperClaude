import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/main.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  minify: false,
  target: "node18",
  outDir: "dist",
  sourcemap: true,
  noExternal: [],
  esbuildOptions(options) {
    options.platform = "node";
    options.packages = "external";
  },
});
