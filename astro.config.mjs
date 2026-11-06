import { defineConfig } from 'astro/config';

// Static output, CSS inlined into the HTML so nothing blocks first paint.
export default defineConfig({
  output: 'static',
  build: { inlineStylesheets: 'always' },
  compressHTML: true,
});
