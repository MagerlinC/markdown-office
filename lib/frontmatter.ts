export interface DocMeta {
  title: string;
  subtitle: string;
  toc: boolean;
}

/**
 * Extract YAML front matter values from markdown content.
 * Expects a `---` delimited block at the start of the file.
 */
export function extractFrontmatter(content: string): DocMeta {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    return { title: "", subtitle: "", toc: false };
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
  };
}
