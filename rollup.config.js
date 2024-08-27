import json from '@rollup/plugin-json';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import dotenv from "rollup-plugin-dotenv"

export default {
  input: 'src/started.js',
  output: {
    file: 'dist/main.js',
    format: 'cjs',
  },
  plugins: [json(), nodeResolve(), dotenv()],
  treeshake: true,
};
