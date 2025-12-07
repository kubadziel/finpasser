import React from "react";
import { Card, CardContent, Stack, Typography, Box, CardProps } from "@mui/material";

type WidgetCardProps = {
    title: string;
    value?: string;
    description?: string;
    color?: "primary" | "error" | "secondary";
    isEditMode: boolean;
    children?: React.ReactNode;
    dragProps?: React.HTMLAttributes<HTMLDivElement>;
    cardProps?: CardProps;
};

const WidgetCard = React.forwardRef<HTMLDivElement, WidgetCardProps>(
    (
        { title, value, description, color, isEditMode, children, dragProps, cardProps },
        ref
    ) => {
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
                                {title}
                            </Typography>
                            {value && (
                                <Typography variant="h3" color={color ?? "primary"}>
                                    {value}
                                </Typography>
                            )}
                            {description && (
                                <Typography variant="body2" color="text.secondary">
                                    {description}
                                </Typography>
                            )}
                        </Box>
                    </Stack>

                    {children ? <Box sx={{ mt: 2 }}>{children}</Box> : null}
                </CardContent>
            </Card>
        );
    }
);

WidgetCard.displayName = "WidgetCard";

export default WidgetCard;
