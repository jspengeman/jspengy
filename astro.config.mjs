// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },

  adapter: netlify(),

  image: {
    // TODO: THIS IS JUST FOR TESTING IMAGES.
    domains: ['images.pexels.com'],
  },
});