import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/index.ts', 'src/cli-example.ts'],
	dts: true,
	sourcemap: true,
	clean: true,
	format: ['cjs', 'esm'],
});
