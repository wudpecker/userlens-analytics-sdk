const resolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const terser = require("@rollup/plugin-terser");
const typescript = require("rollup-plugin-typescript2");

const replace = require("@rollup/plugin-replace");
const pkg = require("./package.json");

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
    replace({
      preventAssignment: true,
      __USERLENS_VERSION__: JSON.stringify(pkg.version),
    }),
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
