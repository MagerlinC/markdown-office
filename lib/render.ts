import { dirname, join, basename, resolve } from "jsr:@std/path";
import { loadConfig } from "./config.ts";
import { extractFrontmatter } from "./frontmatter.ts";
import { buildFrontpage } from "./frontpage.ts";
import { expandIncludes } from "./includes.ts";
import { resolveTemplate } from "./templates.ts";

export interface RenderOptions {
  input: string;
  output?: string;
  rootDir: string;
  cliDir: string;
}

export interface RenderResult {
  outputPath: string;
  sourceCount: number;
  /** All files involved (for watch mode) */
  watchFiles: string[];
}

export async function renderPdf(options: RenderOptions): Promise<RenderResult> {
  const { rootDir, cliDir } = options;
  const input = resolve(options.input);

  // ── Resolve input sources ───────────────────────────────────────────
  let sources: string[];
  let resourceDir: string;
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
    resourceDir = dirname(input);
    defaultOutput = join(resourceDir, `${basename(resourceDir)}.pdf`);
  } else {
    sources = [input];
    resourceDir = dirname(input);
    defaultOutput = input.replace(/\.md$/, ".pdf");
  }

  const outputPath = options.output ?? defaultOutput;

  // ── Load branding config ────────────────────────────────────────────
  const config = await loadConfig(rootDir);

  // ── Resolve templates ───────────────────────────────────────────────
  const typstHeaderPath = await resolveTemplate("typst-header.typ", cliDir, rootDir);

  // ── Expand includes ─────────────────────────────────────────────────
  const tmpDir = await Deno.makeTempDir();
  const watchFiles = [...sources];

  try {
    const expandedPaths: string[] = [];

    for (const src of sources) {
      const text = await Deno.readTextFile(src);
      if (/^\s*!include\s/m.test(text)) {
        const { content, includedFiles } = await expandIncludes(src);
        const dest = join(tmpDir, basename(src));
        await Deno.writeTextFile(dest, content);
        expandedPaths.push(dest);
        watchFiles.push(...includedFiles);
      } else {
        expandedPaths.push(src);
      }
    }

    // ── Extract front matter ────────────────────────────────────────────
    const primaryContent = await Deno.readTextFile(expandedPaths[0]);
    const meta = extractFrontmatter(primaryContent);

    // ── Build frontpage ─────────────────────────────────────────────────
    const frontpageContent = await buildFrontpage(cliDir, rootDir, config, meta);
    const frontpagePath = join(tmpDir, "frontpage.typ");
    await Deno.writeTextFile(frontpagePath, frontpageContent);

    // ── Invoke pandoc ───────────────────────────────────────────────────
    const pandocArgs = [
      ...expandedPaths,
      "--from=markdown+lists_without_preceding_blankline",
      "--pdf-engine=typst",
      `--pdf-engine-opt=--root=/`,
      `--resource-path=${resourceDir}:${rootDir}`,
      `--include-in-header=${typstHeaderPath}`,
      `--include-before-body=${frontpagePath}`,
      `-V`, `mainfont=Arial`,
      `-V`, `fontsize=11pt`,
      `-V`, `margin-top=1.5in`,
      `-V`, `margin-bottom=1.25in`,
      `-V`, `margin-left=1.25in`,
      `-V`, `margin-right=1.25in`,
      `-V`, `linestretch=1.1`,
      `-V`, `section-numbering=1.`,
      `-V`, `page-numbering=1 / 1`,
    ];

    if (meta.toc) {
      pandocArgs.push("--toc", "--toc-depth=3");
    }

    pandocArgs.push("-o", outputPath);

    const cmd = new Deno.Command("pandoc", {
      args: pandocArgs,
      stdout: "inherit",
      stderr: "inherit",
    });

    const result = await cmd.output();
    if (!result.success) {
      throw new Error(`pandoc exited with code ${result.code}`);
    }

    return {
      outputPath,
      sourceCount: sources.length,
      watchFiles: [...new Set(watchFiles)],
    };
  } finally {
    await Deno.remove(tmpDir, { recursive: true }).catch(() => {});
  }
}
