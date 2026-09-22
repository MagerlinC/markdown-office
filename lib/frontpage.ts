import { join } from "jsr:@std/path";
import type { BrandConfig } from "./config.ts";
import type { DocMeta } from "./frontmatter.ts";
import { resolveTemplateContent } from "./templates.ts";

const LOGO_NAMES = ["logo.png", "logo.svg"];

/** Platform-appropriate global config directory. */
function globalConfigDir(): string {
  if (Deno.build.os === "windows") {
    return join(Deno.env.get("APPDATA") ?? join(Deno.env.get("USERPROFILE") ?? "", "AppData", "Roaming"), "mdo");
  }
  return join(Deno.env.get("XDG_CONFIG_HOME") ?? join(Deno.env.get("HOME") ?? "", ".config"), "mdo");
}

/**
 * Find the logo file. Checks the project root first, then the global config dir.
 * Returns an absolute path.
 */
async function findLogo(rootDir: string): Promise<string> {
  const searchDirs = [rootDir, globalConfigDir()];
  for (const dir of searchDirs) {
    for (const name of LOGO_NAMES) {
      const path = join(dir, name);
      try {
        const realPath = await Deno.realPath(path);
        return realPath;
      } catch {
        // try next
      }
    }
  }
  throw new Error(
    `No logo file found (expected ${LOGO_NAMES.join(" or ")} in ${searchDirs.join(" or ")})`,
  );
}

/**
 * Read the frontpage.typ template and substitute placeholders
 * with branding config and document metadata.
 */
export async function buildFrontpage(
  rootDir: string,
  config: BrandConfig,
  meta: DocMeta,
): Promise<string> {
  let template = await resolveTemplateContent("frontpage.typ", rootDir);

  const logoPath = await findLogo(rootDir);

  const replacements: Record<string, string> = {
    "%%COMPANY_PREFIX%%": config.company_name_prefix,
    "%%COMPANY_HIGHLIGHT%%": config.company_name_highlight,
    "%%BRAND_COLOR%%": config.brand_color,
    "%%CONFIDENTIALITY%%": config.confidentiality_label,
    "%%LOGO_PATH%%": logoPath,
    "%%TITLE%%": meta.title,
    "%%SUBTITLE%%": meta.subtitle,
  };

  for (const [placeholder, value] of Object.entries(replacements)) {
    template = template.replaceAll(placeholder, value);
  }

  return template;
}
