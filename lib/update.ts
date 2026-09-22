import { version } from "./version.ts";

const REPO = "MagerlinC/markdown-office";

interface GitHubRelease {
  tag_name: string;
  assets: { name: string; browser_download_url: string }[];
}

function detectPlatform(): string {
  const os = Deno.build.os === "darwin" ? "darwin" : "linux";
  const arch = Deno.build.arch === "x86_64" ? "x86_64" : "aarch64";
  return `${os}-${arch}`;
}

/** Compare two semver strings (v-prefix optional). Returns 1 if a > b, -1 if a < b, 0 if equal. */
function compareSemver(a: string, b: string): number {
  const parse = (s: string) => s.replace(/^v/, "").split(".").map(Number);
  const pa = parse(a);
  const pb = parse(b);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

export async function updateCommand(): Promise<void> {
  console.log(`Current version: ${version}`);

  if (version === "dev") {
    console.error(
      "Cannot update a development build. Install from a release binary first.",
    );
    Deno.exit(1);
  }

  console.log("Checking for updates...");

  let release: GitHubRelease;
  try {
    const resp = await fetch(
      `https://api.github.com/repos/${REPO}/releases/latest`,
    );
    if (!resp.ok) {
      throw new Error(`GitHub API returned ${resp.status}`);
    }
    release = await resp.json();
  } catch (err) {
    console.error(`Failed to check for updates: ${err}`);
    Deno.exit(1);
  }

  const latest = release.tag_name;

  if (compareSemver(latest, version) <= 0) {
    console.log(`Already up to date (${version}).`);
    return;
  }

  console.log(`New version available: ${latest}`);

  const platform = detectPlatform();
  const artifactName = `mdo-${platform}`;
  const asset = release.assets.find((a) => a.name === artifactName);

  if (!asset) {
    console.error(
      `No binary found for ${platform} in release ${latest}. Check https://github.com/${REPO}/releases`,
    );
    Deno.exit(1);
  }

  console.log(`Downloading ${artifactName}...`);

  const resp = await fetch(asset.browser_download_url);
  if (!resp.ok) {
    console.error(`Download failed: ${resp.status}`);
    Deno.exit(1);
  }

  const binary = new Uint8Array(await resp.arrayBuffer());

  // Find where the current binary is installed
  const currentBinary = Deno.execPath();

  // Write to a temp file next to the binary, then rename (atomic-ish)
  const tmpPath = `${currentBinary}.update`;
  try {
    await Deno.writeFile(tmpPath, binary, { mode: 0o755 });
    await Deno.rename(tmpPath, currentBinary);
  } catch (err) {
    // Clean up temp file on failure
    await Deno.remove(tmpPath).catch(() => {});
    console.error(`Failed to replace binary at ${currentBinary}: ${err}`);
    Deno.exit(1);
  }

  console.log(`Updated to ${latest}.`);
}
