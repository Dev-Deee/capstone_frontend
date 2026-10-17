// Light / dark theme. The choice is per browser (localStorage); with no choice
// saved, the operating system's setting decides. `.dark` on <html> switches
// the palette (app/palette.css) for the whole app.

export type Theme = "light" | "dark";
export const THEME_KEY = "cadence-theme";

// Runs inline in <head>, before first paint, so a dark-mode user never sees a
// white flash. Kept tiny and dependency-free; storage can throw (private mode).
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");` +
  `var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;` +
  `document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export function currentTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage unavailable — the choice still applies for this page view.
  }
}
