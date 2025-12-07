import React from "react";
import { Stack, Typography } from "@mui/material";
import WidgetCard from "../components/WidgetCard";
import FileDropZone from "../components/FileDropZone";
import type { WidgetContentProps } from "../components/widgetTypes";

const UploadXmlWidget: React.FC<WidgetContentProps> = ({
    isEditMode,
    cardProps,
}) => (
    <WidgetCard title="Upload XML Message" isEditMode={isEditMode} cardProps={cardProps}>
        <Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Drag & drop a pain.001 XML file or click to browse.
            </Typography>
            <FileDropZone />
        </Stack>
    </WidgetCard>
);

export default UploadXmlWidget;
