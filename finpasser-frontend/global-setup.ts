import { chromium } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const KEYCLOAK_URL =
  process.env.KEYCLOAK_PUBLIC_URL ??
  process.env.VITE_KEYCLOAK_URL ??
  "http://keycloak:8085";
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM ?? "finpasser";
const KEYCLOAK_CLIENT_ID =
  process.env.KEYCLOAK_CLIENT_ID ?? "finpasser-frontend";
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const USERNAME = process.env.E2E_USER_EMAIL;
const PASSWORD = process.env.E2E_USER_PASSWORD;
const STORAGE_PATH = path.join(".auth", "state.json");

export default async function globalSetup() {
  if (!USERNAME || !PASSWORD) {
    throw new Error(
      "Set E2E_USER_EMAIL and E2E_USER_PASSWORD before running Playwright tests."
    );
  }

  const browser = await chromium.launch({
    headless: true,
    args: ["--host-resolver-rules=MAP keycloak 127.0.0.1,EXCLUDE localhost"],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  const redirectUri = `${BASE_URL}/dashboard`;

  const authUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/auth?client_id=${encodeURIComponent(
    KEYCLOAK_CLIENT_ID
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=openid%20profile%20email&prompt=login`;

  await page.goto(authUrl);

  const usernameField = page.locator("input#username, input[name='username']");
  const passwordField = page.locator("input#password, input[name='password']");

  await usernameField.first().waitFor({ timeout: 20000, state: "visible" });
  await usernameField.first().fill(USERNAME);
  await passwordField.first().fill(PASSWORD);
  await page
    .locator("input#kc-login, button[name='login'], button[type='submit']")
    .first()
    .click();

  await page.waitForURL(`${redirectUri}**`, { timeout: 20000 });

  fs.mkdirSync(path.dirname(STORAGE_PATH), { recursive: true });
  await context.storageState({ path: STORAGE_PATH });

  await browser.close();
}
