const resolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const terser = require("@rollup/plugin-terser");
const typescript = require("rollup-plugin-typescript2");

module.exports = {
  input: "src/index.ts",
  output: [
    {
      file: "dist/userlens.cjs.js",
      format: "cjs",
      exports: "auto",
    },
    {
      file: "dist/userlens.esm.js",
      format: "esm",
    },
    {
      file: "dist/userlens.umd.js",
      format: "umd",
      name: "Userlens",
    },
  ],
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.json",
      clean: true,
      useTsconfigDeclarationDir: true,
    }),
    terser(),
  ],
};
