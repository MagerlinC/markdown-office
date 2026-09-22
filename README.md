<p align="center">
  <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none">
    <!-- Back page (PDF) -->
    <rect x="38" y="14" width="68" height="88" rx="6" fill="#2563EB" opacity="0.12" stroke="#2563EB" stroke-width="2"/>
    <rect x="48" y="40" width="40" height="3" rx="1.5" fill="#2563EB" opacity="0.5"/>
    <rect x="48" y="50" width="34" height="3" rx="1.5" fill="#2563EB" opacity="0.35"/>
    <rect x="48" y="60" width="38" height="3" rx="1.5" fill="#2563EB" opacity="0.35"/>
    <rect x="48" y="70" width="28" height="3" rx="1.5" fill="#2563EB" opacity="0.25"/>
    <!-- Front page (Markdown) -->
    <rect x="14" y="18" width="68" height="88" rx="6" fill="white" stroke="#334155" stroke-width="2"/>
    <!-- MD hash symbol -->
    <text x="30" y="52" font-family="monospace" font-weight="bold" font-size="22" fill="#334155">#</text>
    <!-- MD content lines -->
    <rect x="44" y="40" width="28" height="3.5" rx="1.5" fill="#334155" opacity="0.7"/>
    <rect x="28" y="56" width="44" height="2.5" rx="1.25" fill="#94a3b8"/>
    <rect x="28" y="64" width="38" height="2.5" rx="1.25" fill="#94a3b8"/>
    <rect x="28" y="72" width="42" height="2.5" rx="1.25" fill="#94a3b8"/>
    <rect x="28" y="80" width="30" height="2.5" rx="1.25" fill="#94a3b8"/>
    <!-- Arrow -->
    <path d="M62 94 L74 94" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M71 90 L76 94 L71 98" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <!-- Corner fold on front page -->
    <path d="M70 18 L82 18 L82 30 Z" fill="#e2e8f0" stroke="#334155" stroke-width="1.5" stroke-linejoin="round"/>
  </svg>
</p>

<h1 align="center">mdo</h1>
<p align="center"><strong>Markdown Document Office</strong> — turn Markdown into branded PDFs from the terminal</p>
<p align="center">
  <code>pandoc</code> + <code>typst</code> under the hood · YAML front matter in, polished PDF out
</p>

---

A CLI tool that converts Markdown files into branded PDFs using `pandoc` and `typst`. Documents only need a YAML front matter block with a title and subtitle — branding, logo, and styling are applied automatically.

## Installation

```bash
curl -fsSL https://raw.githubusercontent.com/MagerlinC/markdown-office/main/install.sh | bash
```

This will:
1. Check for `pandoc` and `typst`, offering to install them if missing
2. Download the latest `mdo` binary for your platform
3. Install it to `~/.local/bin`

### From source (for development)

Requires [Deno](https://deno.land):

```bash
deno task mdo pdf path/to/file.md
```

To compile a binary locally:

```bash
deno task compile
```

## Usage

```bash
mdo pdf <file-or-dir> [options]    # convert markdown to PDF
mdo init [--global]                # scaffold config and sample files
mdo update                         # update to the latest version
mdo --version                      # print version
```

### PDF options

| Flag | Description |
|---|---|
| `--watch`, `-w` | Re-render on file changes and open the PDF |
| `--open` | Open the PDF after rendering |
| `--output`, `-o` | Output PDF path (default: `<input>.pdf`) |
| `--root` | Document root for mdo-config.json and logo (default: cwd) |

When given a directory, `mdo pdf` merges all `.md` files in that directory (sorted alphabetically) into a single PDF.

### Examples

```bash
mdo init                              # create mdo-config.json in current dir
mdo init --global                     # create global config in ~/.config/mdo/
mdo pdf report.md                     # render a single file
mdo pdf report.md --open              # render and open the PDF
mdo pdf report.md --watch             # render, open, and re-render on changes
mdo pdf report.md --output build/out.pdf
mdo pdf reports/                      # merge all .md files in dir into one PDF
mdo pdf report.md --root /path/to/repo
mdo update                            # update to the latest release
```

## Configuration

`mdo` looks for `mdo-config.json` and a logo file in the following order:

1. **Project root** — the directory you run `mdo` from (or specify with `--root`)
2. **Global config** — `~/.config/mdo/` (or `$XDG_CONFIG_HOME/mdo/`)

The first match wins. `mdo` prints which config file it's using on each run.

To set up a global default (used when no project-level config exists):

```bash
mdo init --global
# Then add a logo.png or logo.svg to ~/.config/mdo/
```

### mdo-config.json

```json
{
  "company_name_prefix": "Your",
  "company_name_highlight": "Company",
  "brand_color": "#2563EB",
  "confidentiality_label": "Confidential"
}
```

The company name is rendered as `<prefix><highlight>` with the highlight portion colored using `brand_color`.

### Logo

Place a `logo.png` or `logo.svg` alongside your `mdo-config.json` (project root or global config dir). `logo.png` takes priority over `logo.svg`.

### YAML front matter

Each markdown file needs a front matter block:

```yaml
---
doc-title: "Your Document Title"
doc-subtitle: "Optional subtitle"
toc: true
---
```

| Field | Required | Description |
|---|---|---|
| `doc-title` | Yes | Document title on the frontpage |
| `doc-subtitle` | No | Subtitle below the title |
| `toc` | No | Set to `true` to include a table of contents |

### Multi-file documents

Documents can pull in other files with `!include`:

```markdown
---
doc-title: "My Report"
doc-subtitle: "2026"
toc: true
---

!include chapters/01-intro.md
!include chapters/02-analysis.md
```

Paths are relative to the including file. Includes are expanded recursively (up to 16 levels deep) before pandoc processes anything, so cross-chapter links work as if everything were in a single file.

## Template resolution

`mdo` ships with default templates for the frontpage layout and typst styling. These can be overridden per-project by placing files with the same name in the document root:

| Template | Purpose |
|---|---|
| `frontpage.typ` | Frontpage layout with placeholder tokens |
| `typst-header.typ` | Typst `#show` and `#set` rules for headings, lists, tables |

**Resolution order:** document root first, then the bundled defaults compiled into the binary. If a file exists in the document root, it takes priority.

### Frontpage placeholders

Custom `frontpage.typ` templates can use these tokens, which are substituted at build time:

| Placeholder | Source |
|---|---|
| `%%COMPANY_PREFIX%%` | `mdo-config.json` |
| `%%COMPANY_HIGHLIGHT%%` | `mdo-config.json` |
| `%%BRAND_COLOR%%` | `mdo-config.json` |
| `%%CONFIDENTIALITY%%` | `mdo-config.json` |
| `%%LOGO_PATH%%` | Resolved absolute path to logo file |
| `%%TITLE%%` | Document front matter |
| `%%SUBTITLE%%` | Document front matter |
