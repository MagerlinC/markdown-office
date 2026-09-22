import { join } from "jsr:@std/path";

// ── Embedded default templates ──────────────────────────────────────────
// These are compiled into the binary so they're available without external files.
// Users can override them by placing a file with the same name in the document root.

const EMBEDDED_TEMPLATES: Record<string, string> = {
  "frontpage.typ": `// Frontpage template — placeholders are substituted at build time.
//
// Available placeholders:
//   %%COMPANY_PREFIX%%        e.g. "Pine"
//   %%COMPANY_HIGHLIGHT%%     e.g. "Grove AI"
//   %%BRAND_COLOR%%           e.g. "#257E34"
//   %%CONFIDENTIALITY%%       e.g. "Confidential"
//   %%LOGO_PATH%%             absolute path to logo file
//   %%TITLE%%                 document title
//   %%SUBTITLE%%              document subtitle (may be empty)

#align(center)[
  #v(2fr)
  #box(height: 48pt, image("%%LOGO_PATH%%"))
  #v(4pt)
  #text(20pt, weight: "bold", tracking: 1pt)[
    %%COMPANY_PREFIX%%#text(fill: rgb("%%BRAND_COLOR%%"))[%%COMPANY_HIGHLIGHT%%]
  ]
  #v(6pt)
  #line(length: 40%, stroke: 0.5pt + luma(180))
  #v(24pt)
  #text(18pt, weight: "bold")[%%TITLE%%]
  #v(12pt)
  #text(12pt, fill: luma(80))[%%SUBTITLE%%]
  #v(2fr)
  #text(10pt, fill: luma(120))[%%COMPANY_PREFIX%%%%COMPANY_HIGHLIGHT%% · %%CONFIDENTIALITY%%]
]
#pagebreak()
`,

  "typst-header.typ": `// #show rules survive conf(), #set rules don't — keep only show rules here,
// everything else goes through pandoc variables

// Section heading styles
#show heading.where(level: 1): it => [
  #v(1.5em)
  #text(14pt, weight: "bold", it)
  #v(0.4em)
  #line(length: 100%, stroke: 0.4pt + luma(160))
  #v(0.3em)
]

#show heading.where(level: 2): it => [
  #v(1.2em)
  #text(12pt, weight: "semibold", it)
  #v(0.3em)
]

// Compact nested lists for contract clauses
#set enum(indent: 1.5em, body-indent: 0.5em, full: true)
#set list(indent: 1.5em, body-indent: 0.5em)

// Prefix enum items with section number and use full hierarchical numbering
#set enum(numbering: (..nums) => {
  let nums = nums.pos()
  context {
    let section = counter(heading).get().first()
    let full = (str(section),) + nums.map(str)
    full.join(".") + "."
  }
})

// Signature block table
#set table(
  stroke: 0.5pt + luma(160),
  inset: 8pt,
)
`,
};

/**
 * Resolve a template file. Checks the document root first (local override),
 * then falls back to the embedded default.
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
    // Fall through to embedded default
  }

  const embedded = EMBEDDED_TEMPLATES[filename];
  if (embedded) {
    return embedded;
  }

  throw new Error(
    `Template "${filename}" not found in ${rootDir} and no embedded default exists`,
  );
}

/**
 * Resolve a template to a file path. Checks the document root first,
 * then writes the embedded default to a temp directory.
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
    // Fall through to embedded default
  }

  const embedded = EMBEDDED_TEMPLATES[filename];
  if (embedded) {
    const tmpPath = join(tmpDir, filename);
    await Deno.writeTextFile(tmpPath, embedded);
    return tmpPath;
  }

  throw new Error(
    `Template "${filename}" not found in ${rootDir} and no embedded default exists`,
  );
}
