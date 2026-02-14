export interface XpConfig {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

function getConfigDir(): string {
  const home = Deno.env.get("HOME") ?? Deno.env.get("USERPROFILE") ?? "";
  return `${home}/.config/xp`;
}

function getConfigPath(): string {
  return `${getConfigDir()}/config.json`;
}

export async function configExists(): Promise<boolean> {
  try {
    await Deno.stat(getConfigPath());
    return true;
  } catch {
    return false;
  }
}

export async function loadConfig(): Promise<XpConfig> {
  const path = getConfigPath();
  try {
    const text = await Deno.readTextFile(path);
    const config = JSON.parse(text) as XpConfig;
    if (!config.apiKey || !config.apiSecret || !config.accessToken || !config.accessTokenSecret) {
      throw new Error("Config is incomplete. Run `xp config set` to reconfigure");
    }
    return config;
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      throw new Error("Config not found. Run `xp auth login` to get started");
    }
    throw e;
  }
}

export async function loadPartialConfig(): Promise<Partial<XpConfig>> {
  const path = getConfigPath();
  try {
    const text = await Deno.readTextFile(path);
    return JSON.parse(text) as Partial<XpConfig>;
  } catch {
    return {};
  }
}

export async function deleteConfig(): Promise<void> {
  const path = getConfigPath();
  try {
    await Deno.remove(path);
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      throw new Error("Config not found (already logged out)");
    }
    throw e;
  }
}

export async function saveConfig(config: XpConfig): Promise<void> {
  const dir = getConfigDir();
  await Deno.mkdir(dir, { recursive: true });
  const path = getConfigPath();
  await Deno.writeTextFile(path, JSON.stringify(config, null, 2));
  // Set file permissions to 600 (owner read/write only)
  if (Deno.build.os !== "windows") {
    await Deno.chmod(path, 0o600);
  }
}
