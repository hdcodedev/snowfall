import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/**/*.ts', 'src/**/*.tsx'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    minify: false,
    external: ['react', 'react-dom'],
    bundle: false,
});
