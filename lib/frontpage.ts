import { join, resolve } from "jsr:@std/path";
import type { BrandConfig } from "./config.ts";
import type { DocMeta } from "./frontmatter.ts";
import { resolveTemplate } from "./templates.ts";

const LOGO_NAMES = ["logo.png", "logo.svg"];

/** Find the logo file in the document root. Returns an absolute path. */
async function findLogo(rootDir: string): Promise<string> {
  for (const name of LOGO_NAMES) {
    const path = join(rootDir, name);
    try {
      // Resolve the real path (follows symlinks) so typst can find it
      const realPath = await Deno.realPath(path);
      return realPath;
    } catch {
      // try next
    }
  }
  throw new Error(
    `No logo file found in ${rootDir} (expected ${LOGO_NAMES.join(" or ")})`,
  );
}

/**
 * Read the frontpage.typ template and substitute placeholders
 * with branding config and document metadata.
 */
export async function buildFrontpage(
  cliDir: string,
  rootDir: string,
  config: BrandConfig,
  meta: DocMeta,
): Promise<string> {
  const templatePath = await resolveTemplate("frontpage.typ", cliDir, rootDir);
  let template = await Deno.readTextFile(templatePath);

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
