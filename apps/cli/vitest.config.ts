import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        tsconfigPaths: true,
    },
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.spec.ts'],
        /**
         * tree-sitter WASM initialisation can take a second or two on the
         * first call; give integration tests enough headroom.
         */
        testTimeout: 30_000,
    },
});
