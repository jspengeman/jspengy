// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import netlify from "@astrojs/netlify";
import sitemap from "@astrojs/sitemap";

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
        experimentalLayout: "responsive",
        remotePatterns: [{ protocol: "https" }],
    },

    experimental: {
        responsiveImages: true,
    },

    integrations: [sitemap()],
});
