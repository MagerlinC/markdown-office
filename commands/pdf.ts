import { renderPdf } from "../lib/render.ts";

export interface PdfArgs {
  input: string;
  output?: string;
  watch: boolean;
  rootDir: string;
}

export async function pdfCommand(args: PdfArgs): Promise<void> {
  // ── One-shot render ─────────────────────────────────────────────────
  const result = await renderPdf({
    input: args.input,
    output: args.output,
    rootDir: args.rootDir,
  });

  console.log(
    `Generated: ${result.outputPath} (from ${result.sourceCount} source file(s))`,
  );

  if (!args.watch) return;

  // ── Watch mode ──────────────────────────────────────────────────────
  console.log("Watching for changes... (Ctrl+C to stop)");

  const watchPaths = [...new Set(result.watchFiles.map((f) => f))];
  const watcher = Deno.watchFs(watchPaths);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  for await (const event of watcher) {
    // Only react to modifications of .md files
    const hasMdChange = event.paths.some((p) => p.endsWith(".md"));
    if (!hasMdChange) continue;

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      console.log(`\nChange detected, rebuilding...`);
      try {
        const r = await renderPdf({
          input: args.input,
          output: args.output,
          rootDir: args.rootDir,
        });
        console.log(
          `Generated: ${r.outputPath} (from ${r.sourceCount} source file(s))`,
        );
      } catch (e) {
        console.error(`Build failed: ${(e as Error).message}`);
      }
    }, 300);
  }
}
