import React from "react";
import { Container, Typography } from "@mui/material";
import FileDropZone from "../components/FileDropZone";

export default function UploadPage() {
    return (
        <Container maxWidth="sm" sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>
                Upload XML File
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Drag & drop a pain.001 XML file below.
            </Typography>

            <FileDropZone />
        </Container>
    );
}
