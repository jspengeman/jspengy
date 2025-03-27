const IMAGE_KIT_URL = "https://ik.imagekit.io/pmbw7zrkob";

export const getImageUrl = (filePath) => {
    return `${IMAGE_KIT_URL}${filePath}`;
};

const newImageModel = (currResult, prevResult, nextResult) => ({
    src: getImageUrl(currResult.filePath),
    fileName: currResult.name,
    prevFileName: prevResult?.name,
    nextFileName: nextResult?.name,
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
        const currResult = newImageModel(
            json[i],
            prev in json ? json[prev] : null,
            next in json ? json[next] : null
        );
        results.push(currResult);
    }

    return results;
};
