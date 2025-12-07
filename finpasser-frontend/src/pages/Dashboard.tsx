import React from "react";
import {
    Card,
    CardActionArea,
    CardContent,
    Typography,
    Container,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
    const navigate = useNavigate();

    return (
        <Container sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>
                FinPasser Dashboard
            </Typography>

            <Card sx={{ maxWidth: 360 }}>
                <CardActionArea onClick={() => navigate("/upload")}>
                    <CardContent>
                        <Typography variant="h5">Upload XML Message</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Send an ISO 20022 pain.001 XML file.
                        </Typography>
                    </CardContent>
                </CardActionArea>
            </Card>
        </Container>
    );
}
