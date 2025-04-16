import fs from "fs/promises";

export const BLURHASH_CACHE_DIR = `${process.env.PWD}/.dist/.blurhash`;

const blurhashFilePath = (fileName, updatedAt) =>
    `${BLURHASH_CACHE_DIR}${fileName}_${updatedAt}.json`;

const checkFileExists = (file) =>
    fs
        .access(file, fs.constants.F_OK)
        .then(() => true)
        .catch(() => false);

const createCacheDirectory = async (cacheDirectory) => {
    const exists = await checkFileExists(cacheDirectory);
    if (exists) {
        return BLURHASH_CACHE_DIR;
    }
    const result = await fs.mkdir(cacheDirectory, { recursive: true });
    return result;
};

export const memoizeToDisk = (getImageStyleFn) => {
    return async (src, fileName, updatedAt) => {
        const diskFilePath = blurhashFilePath(fileName, updatedAt);
        const fileExists = await checkFileExists(diskFilePath);
        if (fileExists) {
            console.log("Read from cache: ", diskFilePath);
            const file = await fs.readFile(diskFilePath, "utf8");
            return JSON.parse(file);
        }
        console.log("Not read from cache: ", diskFilePath);
        const result = await getImageStyleFn(src);
        await createCacheDirectory(BLURHASH_CACHE_DIR);
        await fs.writeFile(diskFilePath, JSON.stringify(result));
        console.log("Wrote file to disk: ", diskFilePath);
        return result;
    };
};
