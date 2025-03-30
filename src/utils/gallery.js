import { encode } from "blurhash";
import { inferRemoteSize } from "astro:assets";
import { getPixels } from "@unpic/pixels";
import { blurhashToDataUri } from "@unpic/placeholder";

const IMAGE_KIT_URL = "https://ik.imagekit.io/ikmedia";

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
    style
) => ({
    src: src,
    fileName: fileName,
    prevFileName: prevResult?.name,
    nextFileName: nextResult?.name,
    attributes: {
        height,
        width,
        style,
    },
});

const memoizeAsync = (fn) => {
    const cache = {};
    return async (arg) => {
        const cachedResult = cache[arg];
        if (cachedResult) {
            console.log("Cached build result used.");
            return Promise.resolve(cachedResult);
        }
        const evaledResult = fn(arg);
        cache[arg] = await evaledResult;
        console.log("cache: ", cache);
        return evaledResult;
    };
};

const getImageStyle = memoizeAsync(async (src) => {
    const imageData = await getPixels(src);
    const data = Uint8ClampedArray.from(imageData.data);
    const blurhash = encode(data, imageData.width, imageData.height, 4, 4);
    return blurhashToImageCssObject(blurhash);
});

export const getAllImages = async () => {
    // const token = import.meta.env.IMAGE_KIT_KEY;

    // const headers = {
    //     Accept: "application/json",
    //     Authorization: `Basic ${btoa(token)}`,
    // };
    // const query = "fileType=image&sort=ASC_CREATED";
    // const response = await fetch(`https://api.imagekit.io/v1/files?${query}`, {
    //     method: "GET",
    //     headers: headers,
    // });

    // if (!response.ok) {
    //     console.log("ImageKit response:", response);
    //     throw new Error("Failed to search ImageKit. Failing build.");
    // }

    // const json = await response.json();
    const json = getStubImages();

    const results = [];
    for (let i = 0; i < json.length; i++) {
        const prev = i - 1;
        const next = i + 1;
        const src = getImageUrl(json[i].filePath);
        const { height, width } = await inferRemoteSize(src);
        const style = await getImageStyle(src);
        const currResult = newImageModel(
            src,
            json[i].name,
            prev in json ? json[prev] : null,
            next in json ? json[next] : null,
            height,
            width,
            style
        );
        results.push(currResult);
    }

    return results;
};
