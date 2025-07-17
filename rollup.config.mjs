// rollup.config.mjs
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import external from "rollup-plugin-peer-deps-external";

const plugins = [
  external(),
  resolve(),
  typescript({ tsconfig: "./tsconfig.json" }),
  commonjs(),
  terser(),
];

const modernBuild = {
  input: {
    main: "src/index.ts",
    react: "src/react/index.tsx",
  },
  output: [
    {
      dir: "dist",
      format: "cjs",
      entryFileNames: "[name].cjs.js",
      sourcemap: true,
      exports: "auto",
    },
    {
      dir: "dist",
      format: "esm",
      entryFileNames: "[name].esm.js",
      sourcemap: true,
    },
  ],
  plugins,
  external: ["react", "react-dom"],
};

const umdBuild = {
  input: "src/index.ts",
  output: {
    file: "dist/userlens.umd.js",
    format: "umd",
    name: "Userlens",
    exports: "named",
    globals: {
      react: "React",
      "react-dom": "ReactDOM",
    },
    sourcemap: true,
  },
  plugins,
  external: ["react", "react-dom"],
};

export default [modernBuild, umdBuild];
