import { encode } from "blurhash";
import { inferRemoteSize } from "astro:assets";
import { getPixels } from "@unpic/pixels";
import { blurhashToImageCssObject } from "@unpic/placeholder";
import fs from "fs/promises";

const IMAGE_KIT_URL = "https://ik.imagekit.io/pmbw7zrkob/";

// Just for local test data.
const getStubImages = () => {
    const urls = [
        "https://ik.imagekit.io/ikmedia/woman.jpg",
        "https://ik.imagekit.io/ikmedia/woman.jpg",
        "https://ik.imagekit.io/ikmedia/woman.jpg",
        "https://ik.imagekit.io/ikmedia/woman.jpg",
        "https://ik.imagekit.io/ikmedia/woman.jpg",
        "https://ik.imagekit.io/ikmedia/woman.jpg",
        "https://ik.imagekit.io/ikmedia/woman.jpg",
        "https://ik.imagekit.io/ikmedia/woman.jpg",
        "https://ik.imagekit.io/ikmedia/woman.jpg",
        "https://ik.imagekit.io/ikmedia/woman.jpg",
        "https://ik.imagekit.io/ikmedia/woman.jpg",
        "https://ik.imagekit.io/ikmedia/woman.jpg",
    ];
    return urls.map((url) => ({
        src: url,
        filePath: "/woman.jpg",
        name: "woman.jpg",
    }));
};

export const getImageUrl = (filePath) => {
    return `${IMAGE_KIT_URL}${filePath}`;
};

const newImageModel = (
    src,
    fileName,
    prevResult,
    nextResult,
    height,
    width,
    style,
    loading
) => ({
    src: src,
    fileName: fileName,
    prevFileName: prevResult?.name,
    nextFileName: nextResult?.name,
    attributes: {
        height,
        width,
        style,
        loading,
    },
});

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

const memoizeToDisk = (getImageStyleFn) => {
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

const getImageStyle = memoizeToDisk(async (src) => {
    const imageData = await getPixels(src);
    const data = Uint8ClampedArray.from(imageData.data);
    const blurhash = encode(data, imageData.width, imageData.height, 4, 4);
    return blurhashToImageCssObject(blurhash);
});

export const getAllImages = async () => {
    const token = import.meta.env.IMAGE_KIT_KEY;

    const headers = {
        Accept: "application/json",
        Authorization: `Basic ${btoa(token)}`,
    };
    const query = "fileType=image&sort=ASC_CREATED";
    const response = await fetch(`https://api.imagekit.io/v1/files?${query}`, {
        method: "GET",
        headers: headers,
    });

    if (!response.ok) {
        console.log("ImageKit response:", response);
        throw new Error("Failed to search ImageKit. Failing build.");
    }

    const json = await response.json();

    const results = [];
    for (let i = 0; i < json.length; i++) {
        const prev = i - 1;
        const next = i + 1;
        const { name, filePath, updatedAt } = json[i];
        const src = getImageUrl(filePath);
        const { height, width } = await inferRemoteSize(src);
        const style = await getImageStyle(src, filePath, updatedAt);
        const currResult = newImageModel(
            src,
            name,
            prev in json ? json[prev] : null,
            next in json ? json[next] : null,
            height,
            width,
            style,
            i < 6 ? "eager" : "lazy"
        );
        results.push(currResult);
    }

    return results;
};
