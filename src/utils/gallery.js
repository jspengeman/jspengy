import { encode } from "blurhash";
import { inferRemoteSize, getImage } from "astro:assets";
import { getPixels } from "@unpic/pixels";
import { blurhashToImageCssObject } from "@unpic/placeholder";
import { memoizeToDisk } from "./cache";

// Just for local test data.
const getStubImages = async () => {
    const urls = [
        "https://ik.imagekit.io/demo/tr:f-jpg/medium_cafe_B1iTdD0C.jpg",
        "https://ik.imagekit.io/demo/tr:f-jpg/medium_cafe_B1iTdD0C.jpg",
        "https://ik.imagekit.io/ikmedia/woman.jpg",
        "https://ik.imagekit.io/ikmedia/woman.jpg",
        "https://ik.imagekit.io/ikmedia/woman.jpg",
        "https://ik.imagekit.io/ikmedia/woman.jpg",
        "https://ik.imagekit.io/ikmedia/woman.jpg",
        "https://ik.imagekit.io/ikmedia/woman.jpg",
        "https://ik.imagekit.io/demo/tr:f-jpg/medium_cafe_B1iTdD0C.jpg",
        "https://ik.imagekit.io/ikmedia/woman.jpg",
        "https://ik.imagekit.io/demo/tr:f-jpg/medium_cafe_B1iTdD0C.jpg",
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

const getSrcSet = async (image, widths, quality) => {
    const optimizedImage = await getImage({
        src: image.src,
        format: "webp",
        height: image.attributes.height,
        width: image.attributes.width,
        widths: widths,
        quality: quality,
    });
    return optimizedImage.srcSet.attribute;
};

const newImage = async (src, fileName, height, width, style, loading) => ({
    src,
    fileName,
    attributes: {
        height,
        width,
        style,
        loading,
        hqsrcset: await getSrcSet(
            { src, attributes: { height, width } },
            [320, 480, 640, 768, 1024, 1280, 1920, 2560],
            50
        ),
        lqsrcset: await getSrcSet(
            { src, attributes: { height, width } },
            [320, 480, 640, 768],
            50
        ),
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
    const lowQualitySrc = src + "&tr=f-jpeg,q-5"
    const imageData = await getPixels(lowQualitySrc);
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
    const query = "fileType=image&sort=DESC_CREATED";
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
    for (let i = 0; i < 120; i++) {
        const { url, name, filePath, updatedAt } = json[i];
        const style = await getImageStyle(url, filePath, updatedAt);
        const { height, width } = await inferRemoteSize(url);
        const loading = i < 6 ? "eager" : "lazy";
        images.push(await newImage(url, name, height, width, style, loading));
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
