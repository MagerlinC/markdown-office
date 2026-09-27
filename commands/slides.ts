import { resolve } from "jsr:@std/path";
import { prepareSlidesProject, renderSlides } from "../lib/render-slides.ts";
import { astroDev, ensureAstroRuntime } from "../lib/astro.ts";

/** Open a file with the system default application. */
async function openFile(path: string): Promise<void> {
  const abs = resolve(path);
  const cmd = Deno.build.os === "darwin"
    ? new Deno.Command("open", { args: [abs] })
    : new Deno.Command("xdg-open", { args: [abs] });
  await cmd.output();
}

export interface SlidesArgs {
  input: string;
  output?: string;
  watch: boolean;
  open: boolean;
  rootDir: string;
}

export async function slidesCommand(args: SlidesArgs): Promise<void> {
  const renderOpts = {
    input: args.input,
    output: args.output,
    rootDir: args.rootDir,
  };

  if (!args.watch) {
    // ── One-shot render ───────────────────────────────────────────────
    const result = await renderSlides(renderOpts);

    console.log(
      `Generated: ${result.outputPath} (from ${result.sourceCount} source file(s))`,
    );

    if (args.open) {
      await openFile(result.outputPath);
    }
    return;
  }

  // ── Watch mode: Astro dev server with live reload ───────────────────
  await ensureAstroRuntime();
  const project = await prepareSlidesProject(renderOpts, "dev");
  console.log(`Astro project: ${project.projectDir}`);

  const server = astroDev(project.projectDir, project.assetDir, true);
  server.status.then(({ code }) => Deno.exit(code));

  console.log("Watching for changes... (Ctrl+C to stop)");

  const watchPaths = [...new Set(project.watchFiles)];
  const watcher = Deno.watchFs(watchPaths);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  for await (const event of watcher) {
    const hasChange = event.paths.some((p) => p.endsWith(".md") || p.endsWith(".css"));
    if (!hasChange) continue;

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      console.log(`\nChange detected, regenerating slides...`);
      try {
        await prepareSlidesProject(renderOpts, "dev");
      } catch (e) {
        console.error(`Build failed: ${(e as Error).message}`);
      }
    }, 300);
  }
}
