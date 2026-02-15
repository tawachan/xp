import { loadPartialConfig, mergeConfig, unsetConfigKeys, type XpConfig } from "../lib/config-store.ts";

export async function configSetCommand(args: string[]): Promise<void> {
  // Parse flags
  const flags: Partial<XpConfig> = {};
  let hasCacheDir = false;
  for (const arg of args) {
    if (arg.startsWith("--api-key=")) {
      flags.apiKey = arg.slice("--api-key=".length);
    } else if (arg.startsWith("--api-secret=")) {
      flags.apiSecret = arg.slice("--api-secret=".length);
    } else if (arg.startsWith("--access-token=")) {
      flags.accessToken = arg.slice("--access-token=".length);
    } else if (arg.startsWith("--access-token-secret=")) {
      flags.accessTokenSecret = arg.slice("--access-token-secret=".length);
    } else if (arg.startsWith("--cache-dir=")) {
      flags.cacheDir = arg.slice("--cache-dir=".length);
      hasCacheDir = true;
    }
  }

  const hasOAuth = flags.apiKey || flags.apiSecret || flags.accessToken || flags.accessTokenSecret;

  if (hasOAuth && flags.apiKey && flags.apiSecret && flags.accessToken && flags.accessTokenSecret) {
    // All OAuth flags provided - non-interactive mode
    await mergeConfig(flags);
  } else if (hasOAuth) {
    // Some but not all OAuth flags - interactive mode
    console.log("Enter your X API credentials (from Developer Portal):\n");
    const apiKey = prompt("API Key:") ?? "";
    const apiSecret = prompt("API Secret:") ?? "";
    const accessToken = prompt("Access Token:") ?? "";
    const accessTokenSecret = prompt("Access Token Secret:") ?? "";

    if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
      throw new Error("All fields are required");
    }

    await mergeConfig({ apiKey, apiSecret, accessToken, accessTokenSecret, ...hasCacheDir ? { cacheDir: flags.cacheDir } : {} });
  } else if (hasCacheDir) {
    // Only --cache-dir provided
    await mergeConfig({ cacheDir: flags.cacheDir });
  } else {
    // No flags - interactive mode
    console.log("Enter your X API credentials (from Developer Portal):\n");
    const apiKey = prompt("API Key:") ?? "";
    const apiSecret = prompt("API Secret:") ?? "";
    const accessToken = prompt("Access Token:") ?? "";
    const accessTokenSecret = prompt("Access Token Secret:") ?? "";

    if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
      throw new Error("All fields are required");
    }

    await mergeConfig({ apiKey, apiSecret, accessToken, accessTokenSecret });
  }

  console.log("Config saved");
}

export async function configUnsetCommand(args: string[]): Promise<void> {
  const keys: (keyof XpConfig)[] = [];
  for (const arg of args) {
    if (arg === "--cache-dir") {
      keys.push("cacheDir");
    }
  }

  if (keys.length === 0) {
    throw new Error("Usage: xp config unset --cache-dir");
  }

  await unsetConfigKeys(keys);
  console.log("Config updated");
}

export async function configShowCommand(): Promise<void> {
  const config = await loadPartialConfig();
  const mask = (s: string) => s.slice(0, 4) + "****";
  console.log(`API Key:             ${config.apiKey ? mask(config.apiKey) : "(not set)"}`);
  console.log(`API Secret:          ${config.apiSecret ? mask(config.apiSecret) : "(not set)"}`);
  console.log(`Access Token:        ${config.accessToken ? mask(config.accessToken) : "(not set)"}`);
  console.log(`Access Token Secret: ${config.accessTokenSecret ? mask(config.accessTokenSecret) : "(not set)"}`);
  console.log(`Cache Dir:           ${config.cacheDir ?? "(default: ~/.config/xp/cache)"}`);
}
