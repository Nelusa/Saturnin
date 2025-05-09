import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    alias: {
      '~': resolve(__dirname, './client'),
    },
  },
}); 