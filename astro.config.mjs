// @ts-check
import { defineConfig } from 'astro/config';

import vue from '@astrojs/vue';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  integrations: [vue()],
  adapter: vercel()
});