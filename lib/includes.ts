import { dirname, join, isAbsolute } from "jsr:@std/path";

const MAX_DEPTH = 16;
const INCLUDE_RE = /^\s*!include\s+(.+)$/;
/** Opening/closing line of a fenced code block: ``` or ~~~ (3+), up to 3 spaces indent */
const FENCE_RE = /^ {0,3}(`{3,}|~{3,})(.*)$/;

/**
 * Wrap HTML in a pandoc raw HTML block (```{=html}), with a fence longer
 * than any backtick run inside it.
 */
function rawHtmlBlock(html: string): string {
  const longest = Math.max(0, ...(html.match(/`+/g) ?? []).map((m) => m.length));
  const fence = "`".repeat(Math.max(3, longest + 1));
  return `${fence}{=html}\n${html.replace(/\n+$/, "")}\n${fence}`;
}

/**
 * Expand `!include <path>` directives in a markdown file recursively.
 * `.html` files are included as raw HTML blocks rather than markdown.
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

  // `!include` lines inside fenced code blocks are examples, not directives
  let fence: string | null = null;

  for (const line of lines) {
    const fenceMatch = line.match(FENCE_RE);
    if (fence) {
      // A fence closes on the same character, at least as long, with no info string
      if (
        fenceMatch && fenceMatch[1][0] === fence[0] &&
        fenceMatch[1].length >= fence.length && fenceMatch[2].trim() === ""
      ) {
        fence = null;
      }
      result.push(line);
      continue;
    }
    if (fenceMatch && !(fenceMatch[1][0] === "`" && fenceMatch[2].includes("`"))) {
      fence = fenceMatch[1];
      result.push(line);
      continue;
    }

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

      if (/\.html?$/i.test(target)) {
        // HTML files are included verbatim as a raw HTML block
        result.push(rawHtmlBlock(await Deno.readTextFile(target)));
        result.push("");
        continue;
      }

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
