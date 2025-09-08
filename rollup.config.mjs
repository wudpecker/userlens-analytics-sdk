import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import external from "rollup-plugin-peer-deps-external";
import dts from "rollup-plugin-dts";

const jsPlugins = [
  external(),
  resolve(),
  commonjs(),
  typescript({ tsconfig: "./tsconfig.json" }), // emits JS
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
      sourcemapExcludeSources: true,
      exports: "named",
    },
    {
      dir: "dist",
      format: "esm",
      entryFileNames: "[name].esm.js",
      sourcemap: true,
      sourcemapExcludeSources: true,
    },
  ],
  plugins: jsPlugins,
  external: ["react", "react-dom"],
};

const umdBuild = {
  input: "src/index.ts",
  output: {
    file: "dist/userlens.umd.js",
    format: "umd",
    name: "Userlens",
    exports: "named",
    globals: { react: "React", "react-dom": "ReactDOM" },
    sourcemap: true,
    sourcemapExcludeSources: true,
  },
  plugins: jsPlugins,
  external: ["react", "react-dom"],
};

// Types → dist/types/*
const dtsBuilds = [
  {
    input: "src/index.ts",
    output: { file: "dist/types/index.d.ts", format: "es" },
    plugins: [dts()],
  },
  {
    input: "src/react/index.tsx",
    output: { file: "dist/types/react.d.ts", format: "es" },
    plugins: [dts()],
  },
];

export default [modernBuild, umdBuild, ...dtsBuilds];
