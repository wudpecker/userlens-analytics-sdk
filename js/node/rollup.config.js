import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "src/index.js", // Your main entry file
  output: [
    {
      file: "dist/index.cjs", // CommonJS output
      format: "cjs",
      sourcemap: true,
    },
    {
      file: "dist/index.mjs", // ESM output
      format: "es",
      sourcemap: true,
    },
  ],
  plugins: [resolve(), commonjs()],
};
