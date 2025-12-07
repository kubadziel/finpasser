import React, { useEffect } from "react";
import { ReactKeycloakProvider, useKeycloak } from "@react-keycloak/web";
import keycloak from "../keycloak";
import { setAuthToken } from "../api/http";

type AuthProviderProps = {
  children: React.ReactNode;
};

const onTokens = (tokens: { token?: string } | undefined) => {
  if (tokens?.token) {
    setAuthToken(tokens.token);
  } else {
    setAuthToken(undefined);
  }
};

const TokenSynchronizer = ({ children }: { children: React.ReactNode }) => {
  const { keycloak, initialized } = useKeycloak();

  useEffect(() => {
    if (!initialized) {
      return;
    }

    const applyToken = () => setAuthToken(keycloak.token ?? undefined);

    applyToken();

    keycloak.onTokenExpired = () =>
      keycloak
        .updateToken(5)
        .then(applyToken)
        .catch(() => keycloak.logout());

    const intervalId = window.setInterval(() => {
      keycloak
        .updateToken(60)
        .then(refreshed => {
          if (refreshed) {
            applyToken();
          }
        })
        .catch(() => keycloak.logout());
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
      keycloak.onTokenExpired = undefined;
    };
  }, [initialized, keycloak]);

  return <>{children}</>;
};

export const AuthProvider = ({ children }: AuthProviderProps) => (
  <ReactKeycloakProvider
    authClient={keycloak}
    initOptions={{ onLoad: "check-sso", redirectUri: window.location.origin + "/dashboard", silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`, checkLoginIframe: false }}
    onTokens={onTokens}
    LoadingComponent={null}
  >
    <TokenSynchronizer>{children}</TokenSynchronizer>
  </ReactKeycloakProvider>
);

export const useAuth = () => {
  const { keycloak, initialized } = useKeycloak();
  const contractId = keycloak.tokenParsed?.contractId as string | undefined;
  const email = keycloak.tokenParsed?.email as string | undefined;
  return {
    authenticated: keycloak.authenticated ?? false,
    initialized,
    contractId,
    email,
    login: (redirectUri?: string) => keycloak.login({ redirectUri: redirectUri ?? window.location.origin + "/" }),
    logout: () => keycloak.logout({ redirectUri: window.location.origin }),
  };
};
