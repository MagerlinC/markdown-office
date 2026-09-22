import { resolve } from "jsr:@std/path";
import { pdfCommand } from "./commands/pdf.ts";
import { updateCommand } from "./lib/update.ts";
import { version } from "./lib/version.ts";

function printUsage(): void {
  console.log(`mdo — markdown document office (${version})

Usage:
  mdo pdf <file-or-dir> [options]    Convert markdown to PDF
  mdo update                         Update to the latest version

Options:
  --watch, -w      Re-render on file changes
  --output, -o     Output PDF path (default: <input>.pdf)
  --root           Document root for mdo-config.json and logo (default: cwd)
  --version, -v    Print version
  --help, -h       Print this help

Examples:
  mdo pdf report.md
  mdo pdf report.md --watch
  mdo pdf reports/ --output out.pdf`);
}

function parseArgs(args: string[]): void {
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printUsage();
    Deno.exit(0);
  }

  if (args[0] === "--version" || args[0] === "-v") {
    console.log(`mdo ${version}`);
    Deno.exit(0);
  }

  const command = args[0];

  if (command === "update") {
    updateCommand();
    return;
  }

  if (command === "pdf") {
    const rest = args.slice(1);
    let input: string | undefined;
    let output: string | undefined;
    let watch = false;
    let rootDir = Deno.cwd();

    for (let i = 0; i < rest.length; i++) {
      const arg = rest[i];
      if (arg === "--watch" || arg === "-w") {
        watch = true;
      } else if (arg === "--output" || arg === "-o") {
        output = rest[++i];
        if (!output) {
          console.error("Error: --output requires a path");
          Deno.exit(1);
        }
      } else if (arg === "--root") {
        rootDir = resolve(rest[++i]);
        if (!rootDir) {
          console.error("Error: --root requires a path");
          Deno.exit(1);
        }
      } else if (arg.startsWith("-")) {
        console.error(`Unknown option: ${arg}`);
        Deno.exit(1);
      } else {
        input = arg;
      }
    }

    if (!input) {
      console.error("Error: pdf command requires an input file or directory");
      printUsage();
      Deno.exit(1);
    }

    pdfCommand({ input, output, watch, rootDir });
  } else {
    console.error(`Unknown command: ${command}`);
    printUsage();
    Deno.exit(1);
  }
}

parseArgs(Deno.args);
