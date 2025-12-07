import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Box, CircularProgress, Typography } from "@mui/material";
import { uploadFile } from "../api/api";

const CONTRACT_ID_REGEX = /^(\d{7})/;

export default function FileDropZone() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const onDrop = async (files: File[]) => {
        const file = files[0];
        if (!file) return;

        const match = CONTRACT_ID_REGEX.exec(file.name);
        if (!match) {
            setResult("Upload failed: filename must start with a 7-digit contract ID.");
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const response = await uploadFile(file);
            setResult(JSON.stringify(response.data, null, 2));
        } catch (err: any) {
            setResult("Upload failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "text/xml": [".xml"] },
    });

    return (
        <div>
            <Box
                {...getRootProps()}
                sx={{
                    border: "2px dashed #666",
                    borderRadius: "8px",
                    padding: "40px",
                    textAlign: "center",
                    cursor: "pointer",
                    bgcolor: isDragActive ? "#eeeeee" : "transparent",
                }}
            >
                <input {...getInputProps()} />

                {loading ? (
                    <CircularProgress />
                ) : (
                    <Typography>
                        {isDragActive
                            ? "Drop the file here..."
                            : "Drag & drop XML here or click to select"}
                    </Typography>
                )}
            </Box>

            {result && (
                <Box
                    data-testid="upload-result"
                    sx={{
                        mt: 3,
                        padding: 2,
                        bgcolor: "#f5f5f5",
                        borderRadius: "8px",
                        whiteSpace: "pre-wrap",
                        fontFamily: "monospace",
                        fontSize: "13px",
                    }}
                >
                    {result}
                </Box>
            )}
        </div>
    );
}
