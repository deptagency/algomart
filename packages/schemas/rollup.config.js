import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'
import tsPaths from 'rollup-plugin-tsconfig-paths'

export default [
  {
    input: 'src/index.ts',
    output: [{ file: 'dist/index.js', format: 'cjs', sourcemap: true }],
    external: (file) => {
      if (/\/node_modules\//.test(file)) {
        return true
      }
      return false
    },
    plugins: [
      tsPaths(),
      esbuild({
        sourceMap: true,
        minify: process.env.NODE_ENV === 'production',
        target: 'es2020',
      }),
      commonjs(),
      resolve(),
    ],
  },
  {
    input: 'src/index.ts',
    output: [{ file: 'dist/index.d.ts' }],
    plugins: [resolve(), dts()],
  },
]
