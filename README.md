<p align="center">
  <img src="assets/logo.svg" alt="mdo logo" width="120" height="120">
</p>

<h1 align="center">mdo</h1>
<p align="center"><strong>Markdown Document Office</strong> — turn Markdown into branded PDFs from the terminal</p>
<p align="center">
  <code>pandoc</code> + <code>typst</code> under the hood · YAML front matter in, polished PDF out
</p>

---

A CLI tool that converts Markdown files into branded PDFs using `pandoc` and `typst`. Documents only need a YAML front matter block with a title and subtitle — branding, logo, and styling are applied automatically.

Supports basic PDF generation as well as watch mode, letting you edit Markdown while seeing your changes live in PDF-form.

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
mdo pdf <file-or-dir> [options]       # convert markdown to PDF
mdo slides <file-or-dir> [options]    # convert markdown to HTML slides
mdo init [--global]                   # scaffold config and sample files
mdo update                            # update to the latest version
mdo --version                         # print version
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

## Slides

`mdo slides` converts Markdown into a self-contained HTML slide deck with branding, keyboard/touch navigation, and a progress bar.

### Slide options

| Flag | Description |
|---|---|
| `--watch`, `-w` | Re-render on file changes and open the presentation |
| `--open` | Open the presentation after rendering |
| `--output`, `-o` | Output HTML path (default: `<input>.html`) |
| `--root` | Document root for mdo-config.json and logo (default: cwd) |

### Slide structure

Slides are split at these boundaries in the converted HTML:

- **`# Heading 1`** — starts a new section slide
- **`## Heading 2`** — starts a sub-slide (the parent `# ` heading is shown as a section label)
- **`---`** (horizontal rule) — explicit slide break within a section

Content before the first `# ` heading is ignored — the title slide is generated automatically from the front matter and branding config.

```markdown
---
doc-title: "Quarterly Review"
doc-subtitle: "Q3 2026"
---

# Agenda
- Revenue
- Roadmap
- Hiring

# Revenue

## Revenue — EMEA
Regional breakdown here.

---
Follow-up notes on the same section.

# Roadmap
Upcoming milestones.
```

### Slide navigation

| Input | Action |
|---|---|
| Right / Down / Space | Next slide |
| Left / Up | Previous slide |
| Home / End | First / last slide |
| Click left half | Previous slide |
| Click right half | Next slide |
| Swipe left / right | Next / previous slide (touch) |
| Ctrl+P | Print all slides |

### Slide examples

```bash
mdo slides deck.md --open                     # render and open
mdo slides deck.md --watch                    # live-reload while editing
mdo slides presentations/                     # merge a directory of .md files
mdo slides deck.md --output build/slides.html
```

### Slide template override

Place a custom `slides.html` in your document root to override the built-in template. It supports the same `%%PLACEHOLDER%%` tokens as the PDF frontpage template, plus `%%SLIDES_HTML%%` for the generated slide content and `%%LOGO_HTML%%` for the logo `<img>` element.

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
