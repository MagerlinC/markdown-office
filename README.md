# mdo — markdown document office

A CLI tool that converts Markdown files into branded PDFs using `pandoc` and `typst`. Documents only need a YAML front matter block with a title and subtitle — branding, logo, and styling are applied automatically.

## Installation

```bash
curl -fsSL https://raw.githubusercontent.com/MagerlinC/markdown-office/main/install.sh | bash
```

This will:
1. Check for `pandoc` and `typst`, offering to install them if missing
2. Download the latest `mdo` binary for your platform
3. Install it to `/usr/local/bin`

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
mdo pdf <file-or-dir> [options]
mdo update
mdo --version
```

### Options

| Flag | Description |
|---|---|
| `--watch`, `-w` | Re-render automatically on file changes |
| `--output`, `-o` | Output PDF path (default: `<input>.pdf`) |
| `--root` | Document root for mdo-config.json and logo (default: cwd) |
| `--version`, `-v` | Print version |

### Examples

```bash
mdo pdf report.md
mdo pdf report.md --watch
mdo pdf report.md --output build/report.pdf
mdo pdf reports/                          # builds all .md files in directory
mdo pdf report.md --root /path/to/repo    # use config from another directory
mdo update                                # update to the latest release
```

## Document setup

### Required files in document root

A document root (the directory you run `mdo` from, or specify with `--root`) needs:

| File | Purpose |
|---|---|
| `mdo-config.json` | Branding values (company name, colors, etc.) |
| `logo.png` or `logo.svg` | Logo displayed on the frontpage |

### mdo-config.json

```json
{
  "company_name_prefix": "Pine",
  "company_name_highlight": "Grove AI",
  "brand_color": "#257E34",
  "confidentiality_label": "Confidential"
}
```

The company name is rendered as `<prefix><highlight>` with the highlight portion colored using `brand_color`.

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

**Resolution order:** document root first, then `cli/templates/` defaults. If a file exists in the document root, it takes priority over the bundled version.

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
