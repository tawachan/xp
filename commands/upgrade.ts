import denoConfig from "../deno.json" with { type: "json" };

const REPO = "tawachan/xp";

function getPlatformSuffix(): string {
  const os = Deno.build.os;
  const arch = Deno.build.arch;

  if (os === "darwin" && arch === "aarch64") return "darwin-arm64";
  if (os === "darwin" && arch === "x86_64") return "darwin-x64";
  if (os === "linux" && arch === "x86_64") return "linux-x64";
  if (os === "linux" && arch === "aarch64") return "linux-arm64";

  throw new Error(`Unsupported platform: ${os}/${arch}`);
}

interface GitHubRelease {
  tag_name: string;
  assets: Array<{ name: string; browser_download_url: string }>;
}

async function getLatestRelease(): Promise<GitHubRelease> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/releases/latest`,
    { headers: { Accept: "application/vnd.github.v3+json" } },
  );
  if (!res.ok) {
    throw new Error(`Failed to check for updates (${res.status})`);
  }
  return await res.json();
}

function parseVersion(tag: string): string {
  return tag.replace(/^v/, "");
}

export async function upgradeCommand(): Promise<void> {
  const currentVersion = denoConfig.version;
  console.log(`Current version: ${currentVersion}`);
  console.log("Checking for updates...");

  const release = await getLatestRelease();
  const latestVersion = parseVersion(release.tag_name);

  if (latestVersion === currentVersion) {
    console.log("Already up to date.");
    return;
  }

  console.log(`New version available: ${latestVersion}`);

  const suffix = getPlatformSuffix();
  const assetName = `xp-${suffix}`;
  const asset = release.assets.find((a) => a.name === assetName);

  if (!asset) {
    throw new Error(
      `No binary found for your platform (${suffix}).\n` +
        `Available assets: ${release.assets.map((a) => a.name).join(", ")}`,
    );
  }

  // Determine the path of the currently running binary
  const execPath = Deno.execPath();
  console.log(`Downloading ${assetName}...`);

  const downloadRes = await fetch(asset.browser_download_url, {
    redirect: "follow",
  });
  if (!downloadRes.ok) {
    throw new Error(`Failed to download binary (${downloadRes.status})`);
  }

  const binary = new Uint8Array(await downloadRes.arrayBuffer());

  // Write to a temp file next to the binary, then rename (atomic-ish swap)
  const tmpPath = `${execPath}.tmp`;
  await Deno.writeFile(tmpPath, binary, { mode: 0o755 });
  await Deno.rename(tmpPath, execPath);

  console.log(`Upgraded to ${latestVersion}`);
}
