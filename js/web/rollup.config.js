const resolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const terser = require("@rollup/plugin-terser");
const typescript = require("@rollup/plugin-typescript");
const external = require("rollup-plugin-peer-deps-external");

module.exports = {
  input: "src/index.ts",
  output: [
    {
      file: "dist/userlens.cjs.js",
      format: "cjs",
      exports: "auto",
      sourcemap: true,
    },
    {
      file: "dist/userlens.esm.js",
      format: "esm",
      sourcemap: true,
    },
    {
      file: "dist/userlens.umd.js",
      format: "umd",
      name: "Userlens",
      globals: {
        react: "React",
        "react-dom": "ReactDOM",
      },
      sourcemap: true,
    },
  ],
  plugins: [
    external(),
    resolve(),
    typescript({
      tsconfig: "./tsconfig.json",
      // clean: true,
      // useTsconfigDeclarationDir: true,
    }),
    commonjs(),
    terser(),
  ],
  external: ["react", "react-dom"],
};
