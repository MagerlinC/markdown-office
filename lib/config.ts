import { join } from "jsr:@std/path";

const CONFIG_FILENAME = "mdo-config.json";

export interface BrandConfig {
  company_name_prefix: string;
  company_name_highlight: string;
  brand_color: string;
  confidentiality_label: string;
}

export interface ConfigResult {
  config: BrandConfig;
  source: string;
}

/** Platform-appropriate global config directory. */
function globalConfigDir(): string {
  if (Deno.build.os === "windows") {
    return join(Deno.env.get("APPDATA") ?? join(Deno.env.get("USERPROFILE") ?? "", "AppData", "Roaming"), "mdo");
  }
  return join(Deno.env.get("XDG_CONFIG_HOME") ?? join(Deno.env.get("HOME") ?? "", ".config"), "mdo");
}

function parseAndValidate(text: string, path: string): BrandConfig {
  const raw = JSON.parse(text);

  const required = [
    "company_name_prefix",
    "company_name_highlight",
    "brand_color",
    "confidentiality_label",
  ] as const;

  for (const key of required) {
    if (typeof raw[key] !== "string") {
      throw new Error(`${path}: missing or invalid field "${key}"`);
    }
  }

  return raw as BrandConfig;
}

/**
 * Load branding config with the following resolution order:
 * 1. rootDir/mdo-config.json (project-level)
 * 2. ~/.config/mdo/mdo-config.json (global default)
 *
 * Returns the parsed config and which path it was loaded from.
 */
export async function loadConfig(rootDir: string): Promise<ConfigResult> {
  const localPath = join(rootDir, CONFIG_FILENAME);
  try {
    const text = await Deno.readTextFile(localPath);
    return { config: parseAndValidate(text, localPath), source: localPath };
  } catch {
    // Fall through to global
  }

  const globalPath = join(globalConfigDir(), CONFIG_FILENAME);
  try {
    const text = await Deno.readTextFile(globalPath);
    return { config: parseAndValidate(text, globalPath), source: globalPath };
  } catch {
    // Neither found
  }

  throw new Error(
    `No ${CONFIG_FILENAME} found.\n` +
    `  Checked: ${localPath}\n` +
    `           ${globalPath}\n` +
    `  Create one in your project root or at ${globalPath} for a global default.`,
  );
}
