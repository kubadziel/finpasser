import http from "./http";

const API_URL = import.meta.env.VITE_UPLOAD_ENDPOINT ?? "/api/upload";

export function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    return http.post(API_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
}
