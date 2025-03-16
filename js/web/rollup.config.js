// rollup.config.js
const resolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");

module.exports = {
  input: "src/index.js",
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
  ],
  plugins: [
    resolve(),
    commonjs(), // important to handle commonjs like chrome-dompath
  ],
};
