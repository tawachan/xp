import { buildAuthHeader } from "../lib/oauth.ts";
import { loadPartialConfig, saveConfig } from "../lib/config-store.ts";

const REQUEST_TOKEN_URL = "https://api.twitter.com/oauth/request_token";
const AUTHORIZE_URL = "https://api.twitter.com/oauth/authorize";
const ACCESS_TOKEN_URL = "https://api.twitter.com/oauth/access_token";

export async function authLoginCommand(): Promise<void> {
  const partial = await loadPartialConfig();

  let apiKey = partial.apiKey ?? "";
  let apiSecret = partial.apiSecret ?? "";

  if (!apiKey || !apiSecret) {
    console.log("API Key が未設定です。Developer Portal で取得した値を入力してください:");
    console.log("  https://developer.x.com/en/portal/dashboard\n");

    if (!apiKey) {
      apiKey = prompt("API Key:")?.trim() ?? "";
    }
    if (!apiSecret) {
      apiSecret = prompt("API Secret:")?.trim() ?? "";
    }
    if (!apiKey || !apiSecret) {
      throw new Error("API Key と API Secret は必須です");
    }
  }

  // Step 1: Request token
  console.log("認証を開始します...\n");

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
    throw new Error(`Request Token の取得に失敗しました (${requestRes.status}): ${body}`);
  }

  const requestBody = await requestRes.text();
  const requestParams = new URLSearchParams(requestBody);
  const oauthToken = requestParams.get("oauth_token");
  const oauthTokenSecret = requestParams.get("oauth_token_secret");

  if (!oauthToken || !oauthTokenSecret) {
    throw new Error("Request Token のレスポンスが不正です");
  }

  // Step 2: Direct user to authorize
  const authorizeUrl = `${AUTHORIZE_URL}?oauth_token=${oauthToken}`;
  console.log("以下のURLをブラウザで開いて、アプリを許可してください:\n");
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
  const pin = prompt("PINを入力してください:")?.trim();
  if (!pin) {
    throw new Error("PINが入力されませんでした");
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
    throw new Error(`Access Token の取得に失敗しました (${accessRes.status}): ${body}`);
  }

  const accessBody = await accessRes.text();
  const accessParams = new URLSearchParams(accessBody);
  const accessToken = accessParams.get("oauth_token");
  const accessTokenSecret = accessParams.get("oauth_token_secret");
  const screenName = accessParams.get("screen_name");

  if (!accessToken || !accessTokenSecret) {
    throw new Error("Access Token のレスポンスが不正です");
  }

  // Step 5: Save config
  await saveConfig({
    apiKey,
    apiSecret,
    accessToken,
    accessTokenSecret,
  });

  console.log(`\n認証が完了しました！ (@${screenName ?? "unknown"})`);
  console.log("設定は ~/.config/xp/config.json に保存されました");
}
