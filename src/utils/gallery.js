const IMAGE_KIT_URL = "https://ik.imagekit.io/pmbw7zrkob"

const getImageUrl = (filePath) => {
    return `${IMAGE_KIT_URL}${filePath}`
}

export const getAllImages = async () => {
    const token = import.meta.env.IMAGE_KIT_KEY;

    const headers = { 
        "Accept": "application/json",
        "Authorization": `Basic ${btoa(token)}`
    };
    const query = "fileType=image&sort=ASC_CREATED";
    const response = await fetch(`https://api.imagekit.io/v1/files?${query}`, { 
        method: 'GET',
        headers: headers 
    });

    if (!response.ok) {
        console.log("ImageKit response:", response)
        throw new Error("Failed to search ImageKit. Failing build.")
    }

    const json = await response.json();

    return json
        .map(fileResult => fileResult.filePath)
        .map(getImageUrl);
}