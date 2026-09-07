import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import fs from 'node:fs';
import path from 'node:path';

function emitDataFiles() {
  return {
    name: 'strettocharts-data',
    generateBundle() {
      const root = path.resolve(process.cwd(), 'data');
      const files = [];
      const walk = (directory) => {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
          const full = path.join(directory, entry.name);
          if (entry.isDirectory()) walk(full);
          else if (entry.name.endsWith('.json')) files.push(full);
        }
      };
      walk(root);
      for (const file of files) {
        this.emitFile({
          type: 'asset',
          fileName: path.relative(process.cwd(), file).replaceAll(path.sep, '/'),
          source: fs.readFileSync(file, 'utf8')
        });
      }
    }
  };
}

export default defineConfig({
  base: '/StrettoCharts/',
  plugins: [svelte(), emitDataFiles()],
  build: { outDir: 'dist', emptyOutDir: true }
});
