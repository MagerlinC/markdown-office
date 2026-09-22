import { dirname, join, basename, resolve } from "jsr:@std/path";
import { loadConfig } from "./config.ts";
import { extractFrontmatter } from "./frontmatter.ts";
import { expandIncludes } from "./includes.ts";
import { resolveTemplateContent } from "./templates.ts";
import type { RenderOptions, RenderResult } from "./render.ts";

const LOGO_NAMES = ["logo.png", "logo.svg"];

/** Find logo and return as a data URI, or empty string if not found. */
async function logoDataUri(rootDir: string): Promise<string> {
  const globalDir = globalConfigDir();
  for (const dir of [rootDir, globalDir]) {
    for (const name of LOGO_NAMES) {
      const path = join(dir, name);
      try {
        const bytes = await Deno.readFile(path);
        const mime = name.endsWith(".svg") ? "image/svg+xml" : "image/png";
        const b64 = btoa(String.fromCharCode(...bytes));
        return `data:${mime};base64,${b64}`;
      } catch {
        // try next
      }
    }
  }
  return "";
}

function globalConfigDir(): string {
  if (Deno.build.os === "windows") {
    return join(Deno.env.get("APPDATA") ?? join(Deno.env.get("USERPROFILE") ?? "", "AppData", "Roaming"), "mdo");
  }
  return join(Deno.env.get("XDG_CONFIG_HOME") ?? join(Deno.env.get("HOME") ?? "", ".config"), "mdo");
}

/** Convert markdown to HTML using pandoc. */
async function markdownToHtml(markdown: string): Promise<string> {
  const cmd = new Deno.Command("pandoc", {
    args: ["--from=markdown+lists_without_preceding_blankline", "--to=html"],
    stdin: "piped",
    stdout: "piped",
    stderr: "inherit",
  });

  const proc = cmd.spawn();
  const writer = proc.stdin.getWriter();
  await writer.write(new TextEncoder().encode(markdown));
  await writer.close();
  const { stdout, success } = await proc.output();

  if (!success) {
    throw new Error("pandoc failed converting markdown to HTML");
  }

  return new TextDecoder().decode(stdout);
}

/**
 * Split HTML into individual slides.
 *
 * Split points (each starts a new slide):
 *  - <h1>  — top-level heading (primary section)
 *  - <h2>  — sub-heading within a section (carries the parent <h1> as a label)
 *  - <hr /> — explicit break marker (the `---` in markdown)
 *
 * Content before the first <h1> is discarded (it belongs to the title slide).
 */
function splitIntoSlides(html: string): string[] {
  // First split at <h1> boundaries into sections
  const h1Parts = html.split(/(?=<h1[\s>])/);
  const slides: string[] = [];

  for (const h1Part of h1Parts) {
    const trimmed = h1Part.trim();
    if (!trimmed) continue;
    // Skip content before first <h1> (already in title slide)
    if (!trimmed.startsWith("<h1")) continue;

    // Extract the <h1> element to use as a label on sub-slides
    const h1Match = trimmed.match(/^(<h1[^>]*>[\s\S]*?<\/h1>)/);
    const h1Tag = h1Match ? h1Match[1] : "";
    const afterH1 = h1Match ? trimmed.slice(h1Match[0].length) : trimmed;

    // Check if this section has <h2> or <hr> sub-splits
    const hasSubSplits = /<h2[\s>]|<hr\s*\/?>/.test(afterH1);

    if (!hasSubSplits) {
      // No sub-splits — keep as a single slide
      slides.push(trimmed);
      continue;
    }

    // Split the content after <h1> at <h2> and <hr> boundaries
    const subParts = afterH1.split(/(?=<h2[\s>])|<hr\s*\/?>/);
    let isFirst = true;

    for (const sub of subParts) {
      const subTrimmed = sub.trim();
      if (!subTrimmed) continue;

      if (isFirst) {
        // First chunk: include the <h1> heading with any content between it and the first <h2>/<hr>
        slides.push(h1Tag + "\n" + subTrimmed);
        isFirst = false;
      } else if (subTrimmed.startsWith("<h2")) {
        // <h2> sub-slide: show the parent <h1> as a small section label
        const sectionLabel = h1Tag
          .replace(/<h1/, '<p class="section-label"')
          .replace(/<\/h1>/, "</p>");
        slides.push(sectionLabel + "\n" + subTrimmed);
      } else {
        // <hr> break: continuation slide, carry the <h1> as label
        const sectionLabel = h1Tag
          .replace(/<h1/, '<p class="section-label"')
          .replace(/<\/h1>/, "</p>");
        slides.push(sectionLabel + "\n" + subTrimmed);
      }
    }
  }

  return slides;
}

export async function renderSlides(options: RenderOptions): Promise<RenderResult> {
  const { rootDir } = options;
  const input = resolve(options.input);

  // ── Resolve input sources ───────────────────────────────────────────
  let sources: string[];
  let defaultOutput: string;

  const stat = await Deno.stat(input);
  if (stat.isDirectory) {
    const entries: string[] = [];
    for await (const entry of Deno.readDir(input)) {
      if (entry.isFile && entry.name.endsWith(".md")) {
        entries.push(join(input, entry.name));
      }
    }
    entries.sort();
    if (entries.length === 0) {
      throw new Error(`No .md files found in ${input}`);
    }
    sources = entries;
    defaultOutput = join(dirname(input), `${basename(input)}.html`);
  } else {
    sources = [input];
    defaultOutput = input.replace(/\.md$/, ".html");
  }

  const outputPath = options.output ?? defaultOutput;

  // ── Load branding config ────────────────────────────────────────────
  const { config, source: configSource } = await loadConfig(rootDir);
  console.log(`Using config: ${configSource}`);

  const watchFiles = [...sources];

  // ── Expand includes ────────────────────────────────────────────────
  const expandedContents: string[] = [];

  for (const src of sources) {
    const text = await Deno.readTextFile(src);
    if (/^\s*!include\s/m.test(text)) {
      const { content, includedFiles } = await expandIncludes(src);
      expandedContents.push(content);
      watchFiles.push(...includedFiles);
    } else {
      expandedContents.push(text);
    }
  }

  // ── Extract front matter from primary source ──────────────────────
  const meta = extractFrontmatter(expandedContents[0]);

  // ── Strip front matter and merge all content ──────────────────────
  const stripped = expandedContents.map((c) =>
    c.replace(/^---\n[\s\S]*?\n---\n?/, "")
  );
  const fullMarkdown = stripped.join("\n\n");

  // ── Convert markdown to HTML via pandoc ───────────────────────────
  const fullHtml = await markdownToHtml(fullMarkdown);

  // ── Split into slides at <h1> boundaries ──────────────────────────
  const slideContents = splitIntoSlides(fullHtml);
  const slidesHtml = slideContents
    .map((content) => `  <div class="slide">\n    ${content}\n  </div>`)
    .join("\n");

  // ── Logo ──────────────────────────────────────────────────────────
  const dataUri = await logoDataUri(rootDir);
  const logoHtml = dataUri
    ? `<img class="logo" src="${dataUri}" alt="Logo">`
    : "";

  // ── Build final HTML from template ────────────────────────────────
  let template = await resolveTemplateContent("slides.html", rootDir);

  const replacements: Record<string, string> = {
    "%%BRAND_COLOR%%": config.brand_color,
    "%%TITLE%%": meta.title,
    "%%SUBTITLE%%": meta.subtitle,
    "%%COMPANY_PREFIX%%": config.company_name_prefix,
    "%%COMPANY_HIGHLIGHT%%": config.company_name_highlight,
    "%%LOGO_HTML%%": logoHtml,
    "%%SLIDES_HTML%%": slidesHtml,
  };

  for (const [placeholder, value] of Object.entries(replacements)) {
    template = template.replaceAll(placeholder, value);
  }

  await Deno.writeTextFile(outputPath, template);

  return {
    outputPath,
    sourceCount: sources.length,
    watchFiles: [...new Set(watchFiles)],
  };
}
