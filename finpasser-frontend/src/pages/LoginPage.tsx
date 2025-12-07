import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, authenticated, initialized } = useAuth();
  const location = useLocation() as { state?: { from?: Location } };
  const navigate = useNavigate();
  const redirectPath =
    (location.state?.from as Location | undefined)?.pathname ?? "/dashboard";
  const [loginTriggered, setLoginTriggered] = useState(false);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!authenticated && !loginTriggered) {
      setLoginTriggered(true);
      login(window.location.origin + redirectPath);
      return;
    }

    if (authenticated) {
      setLoginTriggered(false);
      navigate(redirectPath, { replace: true });
    }
  }, [authenticated, loginTriggered, login, redirectPath, navigate]);

  return null;
}
