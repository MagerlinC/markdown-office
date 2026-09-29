import { join } from "jsr:@std/path";

// ── Template directory ────────────────────────────────────────────────
// Templates live in ../templates/ relative to this file.
// Using import.meta.url (not dirname) so it resolves correctly in both
// `deno run` and `deno compile` — matching the pattern in astro.ts.
const TEMPLATES_ROOT = new URL("../templates/", import.meta.url);

/**
 * Read a bundled template by name.
 * Returns the file content, or undefined if the template doesn't exist.
 */
async function readBundledTemplate(
  filename: string,
): Promise<string | undefined> {
  try {
    return await Deno.readTextFile(new URL(filename, TEMPLATES_ROOT));
  } catch {
    return undefined;
  }
}

/**
 * Resolve a template file. Checks the document root first (local override),
 * then falls back to the bundled default.
 *
 * Returns the content as a string. If the caller needs a file path (e.g. for pandoc),
 * use resolveTemplateToFile() instead.
 */
export async function resolveTemplateContent(
  filename: string,
  rootDir: string,
): Promise<string> {
  // Local override in document root takes priority
  const localPath = join(rootDir, filename);
  try {
    return await Deno.readTextFile(localPath);
  } catch {
    // Fall through to bundled default
  }

  const bundled = await readBundledTemplate(filename);
  if (bundled) {
    return bundled;
  }

  throw new Error(
    `Template "${filename}" not found in ${rootDir} and no bundled default exists`,
  );
}

/**
 * Resolve a template to a file path. Checks the document root first,
 * then writes the bundled default to a temp directory.
 *
 * The caller is responsible for cleaning up tmpDir.
 */
export async function resolveTemplateToFile(
  filename: string,
  rootDir: string,
  tmpDir: string,
): Promise<string> {
  // Local override in document root takes priority
  const localPath = join(rootDir, filename);
  try {
    await Deno.stat(localPath);
    return localPath;
  } catch {
    // Fall through to bundled default
  }

  const bundled = await readBundledTemplate(filename);
  if (bundled) {
    const tmpPath = join(tmpDir, filename);
    await Deno.writeTextFile(tmpPath, bundled);
    return tmpPath;
  }

  throw new Error(
    `Template "${filename}" not found in ${rootDir} and no bundled default exists`,
  );
}
