import { join } from "jsr:@std/path";

/**
 * Resolve a template file, checking the document root first (local override),
 * then falling back to the CLI's bundled templates directory.
 */
export async function resolveTemplate(
  filename: string,
  cliDir: string,
  rootDir: string,
): Promise<string> {
  // Local override in document root takes priority
  const localPath = join(rootDir, filename);
  try {
    await Deno.stat(localPath);
    return localPath;
  } catch {
    // Fall through to CLI default
  }

  const cliPath = join(cliDir, "templates", filename);
  try {
    await Deno.stat(cliPath);
    return cliPath;
  } catch {
    throw new Error(
      `Template "${filename}" not found in ${rootDir} or ${join(cliDir, "templates")}`,
    );
  }
}
