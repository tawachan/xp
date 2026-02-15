import { buildAuthHeader } from "../lib/oauth.ts";
import { deleteConfig, loadPartialConfig, mergeConfig } from "../lib/config-store.ts";

const REQUEST_TOKEN_URL = "https://api.twitter.com/oauth/request_token";
const AUTHORIZE_URL = "https://api.twitter.com/oauth/authorize";
const ACCESS_TOKEN_URL = "https://api.twitter.com/oauth/access_token";

export async function authLoginCommand(): Promise<void> {
  const partial = await loadPartialConfig();

  let apiKey = partial.apiKey ?? "";
  let apiSecret = partial.apiSecret ?? "";

  if (!apiKey || !apiSecret) {
    console.log("API Key not configured. Enter your credentials from the Developer Portal:");
    console.log("  https://developer.x.com/en/portal/dashboard\n");

    if (!apiKey) {
      apiKey = prompt("API Key:")?.trim() ?? "";
    }
    if (!apiSecret) {
      apiSecret = prompt("API Secret:")?.trim() ?? "";
    }
    if (!apiKey || !apiSecret) {
      throw new Error("API Key and API Secret are required");
    }
  }

  // Step 1: Request token
  console.log("Starting authentication...\n");

  const requestTokenCreds = {
    apiKey,
    apiSecret,
    accessToken: "",
    accessTokenSecret: "",
  };

  const requestAuthHeader = await buildAuthHeader(
    "POST",
    REQUEST_TOKEN_URL,
    requestTokenCreds,
    { oauth_callback: "oob" },
  );

  const requestRes = await fetch(REQUEST_TOKEN_URL, {
    method: "POST",
    headers: { Authorization: requestAuthHeader },
  });

  if (!requestRes.ok) {
    const body = await requestRes.text();
    throw new Error(`Failed to get request token (${requestRes.status}): ${body}`);
  }

  const requestBody = await requestRes.text();
  const requestParams = new URLSearchParams(requestBody);
  const oauthToken = requestParams.get("oauth_token");
  const oauthTokenSecret = requestParams.get("oauth_token_secret");

  if (!oauthToken || !oauthTokenSecret) {
    throw new Error("Invalid request token response");
  }

  // Step 2: Direct user to authorize
  const authorizeUrl = `${AUTHORIZE_URL}?oauth_token=${oauthToken}`;
  console.log("Open this URL in your browser and authorize the app:\n");
  console.log(`  ${authorizeUrl}\n`);

  // Try to open browser automatically
  try {
    const cmd = Deno.build.os === "darwin"
      ? "open"
      : Deno.build.os === "windows"
        ? "start"
        : "xdg-open";
    const command = new Deno.Command(cmd, { args: [authorizeUrl] });
    await command.output();
  } catch {
    // Ignore - user can open manually
  }

  // Step 3: Get PIN from user
  const pin = prompt("Enter PIN:")?.trim();
  if (!pin) {
    throw new Error("PIN is required");
  }

  // Step 4: Exchange PIN for access token
  const accessTokenCreds = {
    apiKey,
    apiSecret,
    accessToken: oauthToken,
    accessTokenSecret: oauthTokenSecret,
  };

  const accessAuthHeader = await buildAuthHeader(
    "POST",
    ACCESS_TOKEN_URL,
    accessTokenCreds,
    { oauth_verifier: pin },
  );

  const accessRes = await fetch(ACCESS_TOKEN_URL, {
    method: "POST",
    headers: { Authorization: accessAuthHeader },
  });

  if (!accessRes.ok) {
    const body = await accessRes.text();
    throw new Error(`Failed to get access token (${accessRes.status}): ${body}`);
  }

  const accessBody = await accessRes.text();
  const accessParams = new URLSearchParams(accessBody);
  const accessToken = accessParams.get("oauth_token");
  const accessTokenSecret = accessParams.get("oauth_token_secret");
  const screenName = accessParams.get("screen_name");

  if (!accessToken || !accessTokenSecret) {
    throw new Error("Invalid access token response");
  }

  // Step 5: Save config (mergeConfig preserves existing settings like cacheDir)
  await mergeConfig({
    apiKey,
    apiSecret,
    accessToken,
    accessTokenSecret,
  });

  console.log(`\nAuthenticated as @${screenName ?? "unknown"}`);
  console.log("Credentials saved to ~/.config/xp/config.json");
}

export async function authLogoutCommand(): Promise<void> {
  await deleteConfig();
  console.log("Logged out (credentials removed)");
}
