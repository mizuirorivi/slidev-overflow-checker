import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts', 'src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node18',
  // Disable keepNames to avoid __name helper in page.evaluate
  esbuildOptions(options) {
    options.keepNames = false;
  },
});
