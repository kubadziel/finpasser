import React from "react";
import {
    Card,
    CardContent,
    Stack,
    Typography,
    Box,
    CardProps,
} from "@mui/material";
import FileDropZone from "./FileDropZone";
import { Widget } from "./widgetTypes";

type WidgetCardProps = {
    widget: Widget;
    isEditMode: boolean;
    dragProps?: React.HTMLAttributes<HTMLDivElement>;
    cardProps?: CardProps;
};

const WidgetCard = React.forwardRef<HTMLDivElement, WidgetCardProps>(
    ({ widget, isEditMode, dragProps, cardProps }, ref) => {
        return (
            <Card
                ref={ref}
                {...dragProps}
                {...cardProps}
                variant="outlined"
                sx={{
                    borderStyle: isEditMode ? "dotted" : "solid",
                    borderColor: isEditMode ? "primary.main" : "divider",
                    cursor: isEditMode ? "grab" : "default",
                    position: "relative",
                    height: "100%",
                    boxShadow: 4,
                    ...cardProps?.sx,
                }}
            >
                <CardContent>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                    >
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                {widget.title}
                            </Typography>
                            {widget.value && (
                                <Typography
                                    variant="h3"
                                    color={widget.color ?? "primary"}
                                >
                                    {widget.value}
                                </Typography>
                            )}
                            {widget.description && (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {widget.description}
                                </Typography>
                            )}
                        </Box>
                    </Stack>

                    {widget.type === "upload" && (
                        <Stack sx={{ mt: 2 }}>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 1 }}
                            >
                                Drag & drop a pain.001 XML file or click to
                                browse.
                            </Typography>
                            <FileDropZone />
                        </Stack>
                    )}
                </CardContent>

            </Card>
        );
    }
);

WidgetCard.displayName = "WidgetCard";

export default WidgetCard;
