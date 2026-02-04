import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import dynamicImportVars from '@rollup/plugin-dynamic-import-vars';
import autoExternal from 'rollup-plugin-auto-external';

export default {
  input: ['src/index.ts', 'src/cli.ts'],
  output: {
    dir: 'dist',
    format: 'es',
    sourcemap: true,
    preserveModules: true, // 保持模块结构
    exports: 'auto'
  },
  external: [], // Let autoExternal handle all externals
  plugins: [
    autoExternal({
      packagePath: './package.json',
      builtins: true,
      dependencies: true,
      peerDependencies: true,
    }),
    json(),
    nodeResolve({
      preferBuiltins: true,
      exportConditions: ['node', 'default'] // 支持多种导出条件
    }),
    typescript({ 
      tsconfig: './tsconfig.json',
      compilerOptions: {
        module: 'ESNext',
        target: 'ES2022',
        lib: ['ES2022'],
        strict: true,
        esModuleInterop: true,  // 关键：启用ES模块互操作
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true,
        moduleResolution: 'node'
      }
    }),
    dynamicImportVars(), // 允许动态导入变量
    commonjs({
      include: [/node_modules/],
      requireReturnsDefault: 'preferred'  // 指定默认的require行为
    }),
  ],
};