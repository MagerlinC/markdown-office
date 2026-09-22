import { dirname, join, isAbsolute } from "jsr:@std/path";

const MAX_DEPTH = 16;
const INCLUDE_RE = /^\s*!include\s+(.+)$/;

/**
 * Expand `!include <path>` directives in a markdown file recursively.
 * Returns the fully expanded content as a string, and the set of all
 * files that were included (for watch mode).
 */
export async function expandIncludes(
  filePath: string,
  depth = 0,
): Promise<{ content: string; includedFiles: string[] }> {
  if (depth > MAX_DEPTH) {
    throw new Error(
      `Include nesting too deep at ${filePath} (circular !include?)`,
    );
  }

  const text = await Deno.readTextFile(filePath);
  const dir = dirname(filePath);
  const lines = text.split("\n");
  const result: string[] = [];
  const includedFiles: string[] = [];

  for (const line of lines) {
    const match = line.match(INCLUDE_RE);
    if (match) {
      let target = match[1].trim();
      if (!isAbsolute(target)) {
        target = join(dir, target);
      }

      try {
        await Deno.stat(target);
      } catch {
        throw new Error(
          `!include target not found: ${target} (referenced from ${filePath})`,
        );
      }

      includedFiles.push(target);
      const nested = await expandIncludes(target, depth + 1);
      result.push(nested.content);
      result.push(""); // keep chapters from running into each other
      includedFiles.push(...nested.includedFiles);
    } else {
      result.push(line);
    }
  }

  return { content: result.join("\n"), includedFiles };
}
