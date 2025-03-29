// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import netlify from "@astrojs/netlify";

import sitemap from "@astrojs/sitemap";

import { imageService } from "@unpic/astro/service";

// https://astro.build/config
export default defineConfig({
    site: "https://spengy.com",
    prefetch: true,

    vite: {
        plugins: [tailwindcss()],
    },

    adapter: netlify({
        imageCDN: true,
    }),

    image: {
        remotePatterns: [{ protocol: "https" }],
        service: imageService({
            placeholder: "blurhash",
            layout: "fullWidth",
        }),
    },

    integrations: [sitemap()],
});
