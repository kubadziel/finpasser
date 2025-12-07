import React from "react";
import {
    Card,
    CardContent,
    Typography,
    Container,
    Grid,
    Stack,
} from "@mui/material";
import FileDropZone from "../components/FileDropZone";

export default function Dashboard() {
    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>
                FinPasser Dashboard
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Pending Messages</Typography>
                            <Typography variant="h3" color="primary">
                                12
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Awaiting processing
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Processed Today</Typography>
                            <Typography variant="h3" color="primary">
                                34
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Successfully routed
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Alerts</Typography>
                            <Typography variant="h3" color="error">
                                2
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Requires review
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Stack
                                direction={{ xs: "column", md: "row" }}
                                justifyContent="space-between"
                                alignItems={{ xs: "flex-start", md: "center" }}
                                spacing={2}
                                sx={{ mb: 2 }}
                            >
                                <div>
                                    <Typography variant="h5" gutterBottom>
                                        Upload XML Message
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Drag & drop a pain.001 XML file or click
                                        to browse.
                                    </Typography>
                                </div>
                            </Stack>

                            <FileDropZone />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
}
