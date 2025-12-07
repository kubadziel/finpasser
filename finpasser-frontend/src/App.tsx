import React from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import Dashboard from "./pages/Dashboard";
import UploadPage from "./pages/UploadPage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

const AppContent = () => {
    const location = useLocation();
    const { authenticated, contractId, logout, initialized } = useAuth();
    const showChrome = location.pathname !== "/login";

    if (!initialized) {
        return null;
    }

    return (
        <>
            {showChrome && (
                <AppBar position="static">
                    <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography component={Link} to="/" variant="h6" color="inherit" sx={{ textDecoration: "none" }}>
                            FinPasser
                        </Typography>
                        <Box>
                            {authenticated && (
                                <Button color="inherit" onClick={logout}>
                                    Logout {contractId ? `(${contractId})` : ""}
                                </Button>
                            )}
                        </Box>
                    </Toolbar>
                </AppBar>
            )}

            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                <Route path="/login" element={<LoginPage />} />
                <Route
                    path="/upload"
                    element={
                        <ProtectedRoute>
                            <UploadPage />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </>
    );
};

export default function App() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}
