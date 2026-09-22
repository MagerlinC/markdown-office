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

  "slides.html": `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>%%TITLE%%</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --brand: %%BRAND_COLOR%%;
    --brand-light: %%BRAND_COLOR%%1a;
    --slide-width: 100vw;
    --slide-height: 100vh;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: #111;
    color: #222;
    overflow: hidden;
    height: 100vh;
    width: 100vw;
  }

  /* ── Slide container ────────────────────────────────── */
  .deck {
    position: relative;
    width: 100vw;
    height: 100vh;
  }

  .slide {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 6vh 8vw;
    background: #fff;
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.5s ease, transform 0.5s ease;
    pointer-events: none;
    overflow-y: auto;
  }

  .slide.active {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
    z-index: 2;
  }

  .slide.prev {
    opacity: 0;
    transform: translateY(-12px);
  }

  .slide.next {
    opacity: 0;
    transform: translateY(24px);
  }

  /* ── Title slide ────────────────────────────────────── */
  .slide.title-slide {
    align-items: center;
    text-align: center;
    justify-content: center;
  }

  .title-slide .logo {
    max-height: 64px;
    max-width: 240px;
    margin-bottom: 12px;
  }

  .title-slide .company {
    font-size: 1.2rem;
    font-weight: 700;
    letter-spacing: 1.5px;
    margin-bottom: 2rem;
    color: #444;
  }

  .title-slide .company .hl { color: var(--brand); }

  .title-slide h1 {
    font-size: clamp(2rem, 5vw, 3.6rem);
    font-weight: 800;
    line-height: 1.15;
    margin-bottom: 0.6rem;
    color: #111;
  }

  .title-slide .subtitle {
    font-size: clamp(1rem, 2vw, 1.5rem);
    color: #666;
    font-weight: 400;
  }

  /* ── Section label (parent heading on sub-slides) ──── */
  .slide .section-label {
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--brand);
    margin-bottom: 0.6em;
    opacity: 0.7;
  }

  /* ── Content slides ─────────────────────────────────── */
  .slide h1 {
    font-size: clamp(1.6rem, 3.5vw, 2.6rem);
    font-weight: 700;
    color: var(--brand);
    margin-bottom: 0.15em;
    line-height: 1.2;
  }

  .slide h1::after {
    content: "";
    display: block;
    width: 60px;
    height: 3px;
    background: var(--brand);
    margin-top: 0.4em;
    margin-bottom: 0.6em;
    border-radius: 2px;
  }

  .slide h2 {
    font-size: clamp(1.1rem, 2.2vw, 1.6rem);
    font-weight: 600;
    color: #333;
    margin-top: 1.2em;
    margin-bottom: 0.5em;
  }

  .slide h3 {
    font-size: clamp(1rem, 1.8vw, 1.3rem);
    font-weight: 600;
    color: #444;
    margin-top: 1em;
    margin-bottom: 0.4em;
  }

  .slide p {
    font-size: clamp(0.95rem, 1.6vw, 1.2rem);
    line-height: 1.65;
    margin-bottom: 0.8em;
    color: #333;
  }

  .slide ul, .slide ol {
    font-size: clamp(0.95rem, 1.6vw, 1.2rem);
    line-height: 1.65;
    margin-bottom: 0.8em;
    padding-left: 1.5em;
    color: #333;
  }

  .slide li { margin-bottom: 0.3em; }

  .slide li::marker { color: var(--brand); }

  .slide pre {
    background: #f5f5f5;
    border-left: 3px solid var(--brand);
    border-radius: 6px;
    padding: 1em 1.2em;
    font-size: 0.9rem;
    overflow-x: auto;
    margin-bottom: 0.8em;
  }

  .slide code {
    font-family: "SF Mono", "Fira Code", "Cascadia Code", Consolas, monospace;
    font-size: 0.88em;
  }

  .slide p code, .slide li code {
    background: #f0f0f0;
    padding: 0.15em 0.4em;
    border-radius: 4px;
  }

  .slide table {
    border-collapse: collapse;
    margin-bottom: 0.8em;
    font-size: clamp(0.85rem, 1.4vw, 1.05rem);
  }

  .slide th, .slide td {
    border: 1px solid #ddd;
    padding: 0.5em 0.8em;
    text-align: left;
  }

  .slide th {
    background: var(--brand);
    color: #fff;
    font-weight: 600;
  }

  .slide tr:nth-child(even) { background: #f9f9f9; }

  .slide img {
    max-width: 100%;
    max-height: 50vh;
    border-radius: 6px;
  }

  .slide blockquote {
    border-left: 4px solid var(--brand);
    padding: 0.5em 1em;
    margin: 0.8em 0;
    background: var(--brand-light);
    border-radius: 0 6px 6px 0;
    color: #444;
    font-style: italic;
  }

  .slide a { color: var(--brand); }

  /* ── Progress bar ───────────────────────────────────── */
  .progress {
    position: fixed;
    bottom: 0;
    left: 0;
    height: 3px;
    background: var(--brand);
    transition: width 0.35s ease;
    z-index: 10;
  }

  /* ── Slide counter ──────────────────────────────────── */
  .counter {
    position: fixed;
    bottom: 12px;
    right: 20px;
    font-size: 0.8rem;
    color: #999;
    z-index: 10;
    font-variant-numeric: tabular-nums;
  }

  /* ── Print ──────────────────────────────────────────── */
  @media print {
    body { background: #fff; overflow: visible; }
    .deck { position: static; }
    .slide {
      position: relative;
      opacity: 1;
      transform: none;
      page-break-after: always;
      height: 100vh;
      pointer-events: auto;
    }
    .progress, .counter { display: none; }
  }
</style>
</head>
<body>
<div class="deck" id="deck">
  <!-- Title slide -->
  <div class="slide title-slide active">
    %%LOGO_HTML%%
    <div class="company">%%COMPANY_PREFIX%%<span class="hl">%%COMPANY_HIGHLIGHT%%</span></div>
    <h1>%%TITLE%%</h1>
    <div class="subtitle">%%SUBTITLE%%</div>
  </div>
  <!-- Content slides -->
  %%SLIDES_HTML%%
</div>
<div class="progress" id="progress"></div>
<div class="counter" id="counter"></div>
<script>
(function () {
  var slides = document.querySelectorAll(".slide");
  var progress = document.getElementById("progress");
  var counter = document.getElementById("counter");
  var cur = 0;
  var dir = 1; // 1 = forward, -1 = backward

  function show(n) {
    if (n < 0 || n >= slides.length || n === cur) return;
    dir = n > cur ? 1 : -1;
    // Remove all state classes from every slide
    for (var i = 0; i < slides.length; i++) {
      slides[i].classList.remove("active", "prev", "next");
    }
    // Outgoing slide
    slides[cur].classList.add(dir === 1 ? "prev" : "next");
    cur = n;
    // Incoming slide
    slides[cur].classList.add("active");
    progress.style.width = (slides.length > 1 ? (cur / (slides.length - 1)) * 100 : 0) + "%";
    counter.textContent = (cur + 1) + " / " + slides.length;
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      show(cur + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      show(cur - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      show(0);
    } else if (e.key === "End") {
      e.preventDefault();
      show(slides.length - 1);
    }
  });

  // Touch / swipe support
  var touchStartX = 0;
  document.addEventListener("touchstart", function (e) {
    touchStartX = e.changedTouches[0].screenX;
  });
  document.addEventListener("touchend", function (e) {
    var dx = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
  });

  // Click left/right halves (only plain clicks, not keyboard-triggered)
  document.addEventListener("click", function (e) {
    if (e.detail === 0) return; // skip synthetic / keyboard clicks
    if (e.clientX > window.innerWidth / 2) show(cur + 1);
    else show(cur - 1);
  });

  // Init — just set counter/progress, slide 0 already has "active" in HTML
  progress.style.width = "0%";
  counter.textContent = "1 / " + slides.length;
})();
</script>
</body>
</html>
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
