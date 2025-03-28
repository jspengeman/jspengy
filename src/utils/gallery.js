import { inferRemoteSize } from "astro:assets";

const IMAGE_KIT_URL = "https://ik.imagekit.io/pmbw7zrkob";

export const getImageUrl = (filePath) => {
    return `${IMAGE_KIT_URL}${filePath}`;
};

const newImageModel = (
    src,
    fileName,
    prevResult,
    nextResult,
    height,
    width
) => ({
    src: src,
    fileName: fileName,
    prevFileName: prevResult?.name,
    nextFileName: nextResult?.name,
    height,
    width,
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
        const src = getImageUrl(json[i].filePath);
        const { height, width } = await inferRemoteSize(src);
        const currResult = newImageModel(
            src,
            json[i].name,
            prev in json ? json[prev] : null,
            next in json ? json[next] : null,
            height,
            width
        );
        results.push(currResult);
    }

    return results;
};
