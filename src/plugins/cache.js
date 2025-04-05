import { BLURHASH_CACHE_DIR } from "../utils/gallery";

export const onPreBuild = async function ({ utils }) {
    console.log(`Restoring from Netlify cache ${BLURHASH_CACHE_DIR}`);
    await utils.cache.restore(BLURHASH_CACHE_DIR);
    const files = await utils.cache.list();
    console.log(`Restored files: `, files);
};

export const onPostBuild = async function ({ utils }) {
    console.log(`Saving to Netlify cache: ${BLURHASH_CACHE_DIR}`);
    await utils.cache.save(BLURHASH_CACHE_DIR);
};
