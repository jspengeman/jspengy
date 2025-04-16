import { encode } from "blurhash";
import { inferRemoteSize } from "astro:assets";
import { getPixels } from "@unpic/pixels";
import { blurhashToImageCssObject } from "@unpic/placeholder";
import { memoizeToDisk } from "./cache";

// Just for local test data.
const getStubImages = async () => {
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
    return Promise.resolve(
        urls.map((url) => ({
            url: url,
            filePath: "/woman.jpg",
            updatedAt: 0,
            name: "woman.jpg",
        }))
    );
};

const newImage = (src, fileName, height, width, style, loading) => ({
    src,
    fileName,
    attributes: {
        height,
        width,
        style,
        loading,
    },
});

const relateImages = (currImage, nextImage, prevImage) => {
    return Object.assign(
        {},
        { ...currImage },
        { nextImage: nextImage },
        { prevImage: prevImage }
    );
};

const getImageStyle = memoizeToDisk(async (src) => {
    const imageData = await getPixels(src);
    const data = Uint8ClampedArray.from(imageData.data);
    const blurhash = encode(data, imageData.width, imageData.height, 4, 4);
    return blurhashToImageCssObject(blurhash);
});

const searchForImages = async () => {
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

    return response.json();
};

export const getAllImages = async () => {
    const json = await searchForImages();

    const images = [];
    for (let i = 0; i < json.length; i++) {
        const { url, name, filePath, updatedAt } = json[i];
        const style = await getImageStyle(url, filePath, updatedAt);
        const { height, width } = await inferRemoteSize(url);
        const loading = i < 6 ? "eager" : "lazy";
        images.push(newImage(url, name, height, width, style, loading));
    }

    const results = [];
    for (let i = 0; i < images.length; i++) {
        const prev = i - 1;
        const next = i + 1;
        const currResult = relateImages(
            images[i],
            prev in images ? images[prev] : null,
            next in images ? images[next] : null
        );
        results.push(currResult);
    }

    return results;
};
