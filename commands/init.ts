import { join } from "jsr:@std/path";

const DEFAULT_CONFIG = `{
  "company_name_prefix": "Your",
  "company_name_highlight": "Company",
  "brand_color": "#2563EB",
  "confidentiality_label": "Confidential"
}
`;

const SAMPLE_DOC = `---
doc-title: "My Document"
doc-subtitle: "Subtitle"
toc: true
---

# Introduction

Start writing here.
`;

export interface InitArgs {
  global: boolean;
}

/** Platform-appropriate global config directory. */
function globalConfigDir(): string {
  if (Deno.build.os === "windows") {
    return join(Deno.env.get("APPDATA") ?? join(Deno.env.get("USERPROFILE") ?? "", "AppData", "Roaming"), "mdo");
  }
  return join(Deno.env.get("XDG_CONFIG_HOME") ?? join(Deno.env.get("HOME") ?? "", ".config"), "mdo");
}

async function writeIfMissing(path: string, content: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    console.log(`  exists: ${path}`);
    return false;
  } catch {
    await Deno.writeTextFile(path, content);
    console.log(`  created: ${path}`);
    return true;
  }
}

export async function initCommand(args: InitArgs): Promise<void> {
  const targetDir = args.global ? globalConfigDir() : Deno.cwd();

  console.log(`Initializing mdo in ${targetDir}`);
  await Deno.mkdir(targetDir, { recursive: true });

  await writeIfMissing(join(targetDir, "mdo-config.json"), DEFAULT_CONFIG);

  if (!args.global) {
    await writeIfMissing(join(targetDir, "example.md"), SAMPLE_DOC);
  }

  console.log("");
  if (args.global) {
    console.log("Global config created. Add a logo.png or logo.svg to the same directory.");
  } else {
    console.log("Project initialized. Add a logo.png or logo.svg, then run:");
    console.log("  mdo pdf example.md");
  }
}
