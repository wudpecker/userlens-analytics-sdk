// rollup.config.js
import resolve from "@rollup/plugin-node-resolve";

export default {
  input: "src/index.js", // Entry point for your package
  output: [
    {
      file: "dist/userlens.cjs.js", // CommonJS output for Node.js
      format: "cjs", // Use CommonJS format
      exports: "default",
    },
    {
      file: "dist/userlens.esm.js", // ESModule output for browsers
      format: "esm", // Use ESModule format
    },
  ],
  plugins: [
    resolve(), // Resolves node modules
  ],
};
