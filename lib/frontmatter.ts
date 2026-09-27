export interface DocMeta {
  title: string;
  subtitle: string;
  toc: boolean;
  /** Slides: label in the cover slide's header */
  coverLabel: string;
  /** Slides: bottom-left / bottom-right text on the cover slide */
  coverLeft: string;
  coverRight: string;
  /** Slides: reveal list items one at a time by default */
  incremental: boolean;
}

/**
 * Extract YAML front matter values from markdown content.
 * Expects a `---` delimited block at the start of the file.
 */
export function extractFrontmatter(content: string): DocMeta {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    return {
      title: "",
      subtitle: "",
      toc: false,
      coverLabel: "",
      coverLeft: "",
      coverRight: "",
      incremental: false,
    };
  }

  const yaml = match[1];

  const getValue = (key: string): string => {
    const line = yaml.split("\n").find((l) => l.startsWith(`${key}:`));
    if (!line) return "";
    const value = line.slice(key.length + 1).trim();
    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      return value.slice(1, -1);
    }
    return value;
  };

  return {
    title: getValue("doc-title"),
    subtitle: getValue("doc-subtitle"),
    toc: getValue("toc") === "true",
    coverLabel: getValue("cover-label"),
    coverLeft: getValue("cover-left"),
    coverRight: getValue("cover-right"),
    incremental: getValue("incremental") === "true",
  };
}
