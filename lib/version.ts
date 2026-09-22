// Injected at compile time via --define=VERSION=<tag>
// Falls back to "dev" when running from source with `deno run`.
declare const VERSION: string;

export const version: string = (() => {
  try {
    return VERSION;
  } catch {
    return "dev";
  }
})();
