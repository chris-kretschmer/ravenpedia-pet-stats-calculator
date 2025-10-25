import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'server', // Enable SSR
  adapter: vercel(), // Set Vercel adapter
  integrations: [
    vue({
      // Add FormKit to Vue's compiler options
      appEntrypoint: '/src/entry.js',
    }),
  ],
});