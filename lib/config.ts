import { join } from "jsr:@std/path";

export interface BrandConfig {
  company_name_prefix: string;
  company_name_highlight: string;
  brand_color: string;
  confidentiality_label: string;
}

export async function loadConfig(rootDir: string): Promise<BrandConfig> {
  const configPath = join(rootDir, "mdo-config.json");
  const text = await Deno.readTextFile(configPath);
  const raw = JSON.parse(text);

  const required = [
    "company_name_prefix",
    "company_name_highlight",
    "brand_color",
    "confidentiality_label",
  ] as const;

  for (const key of required) {
    if (typeof raw[key] !== "string") {
      throw new Error(`mdo-config.json: missing or invalid field "${key}"`);
    }
  }

  return raw as BrandConfig;
}
