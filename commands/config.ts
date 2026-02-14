import { loadConfig, saveConfig, type XpConfig } from "../lib/config-store.ts";

export async function configSetCommand(args: string[]): Promise<void> {
  // Parse flags
  const flags: Partial<XpConfig> = {};
  for (const arg of args) {
    if (arg.startsWith("--api-key=")) {
      flags.apiKey = arg.slice("--api-key=".length);
    } else if (arg.startsWith("--api-secret=")) {
      flags.apiSecret = arg.slice("--api-secret=".length);
    } else if (arg.startsWith("--access-token=")) {
      flags.accessToken = arg.slice("--access-token=".length);
    } else if (arg.startsWith("--access-token-secret=")) {
      flags.accessTokenSecret = arg.slice("--access-token-secret=".length);
    }
  }

  let config: XpConfig;

  if (flags.apiKey && flags.apiSecret && flags.accessToken && flags.accessTokenSecret) {
    // All flags provided - non-interactive mode
    config = {
      apiKey: flags.apiKey,
      apiSecret: flags.apiSecret,
      accessToken: flags.accessToken,
      accessTokenSecret: flags.accessTokenSecret,
    };
  } else {
    // Interactive mode
    console.log("Enter your X API credentials (from Developer Portal):\n");
    const apiKey = prompt("API Key:") ?? "";
    const apiSecret = prompt("API Secret:") ?? "";
    const accessToken = prompt("Access Token:") ?? "";
    const accessTokenSecret = prompt("Access Token Secret:") ?? "";

    if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
      throw new Error("All fields are required");
    }

    config = { apiKey, apiSecret, accessToken, accessTokenSecret };
  }

  await saveConfig(config);
  console.log("Config saved");
}

export async function configShowCommand(): Promise<void> {
  const config = await loadConfig();
  const mask = (s: string) => s.slice(0, 4) + "****";
  console.log(`API Key:             ${mask(config.apiKey)}`);
  console.log(`API Secret:          ${mask(config.apiSecret)}`);
  console.log(`Access Token:        ${mask(config.accessToken)}`);
  console.log(`Access Token Secret: ${mask(config.accessTokenSecret)}`);
}
