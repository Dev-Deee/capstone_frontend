/** @type {import('tailwindcss').Config} */

// Light/dark theming: every gray and accent shade below reads a CSS variable
// (defined in app/palette.css), so `.dark` on <html> re-themes the whole app
// without per-component dark: classes. Backgrounds/borders/rings use
// --<family>-<shade>; text uses --t-<family>-<shade> (dark mode needs light
// tints to darken for surfaces but dark text to lighten).
const FAMILIES = ["gray", "blue", "red", "green", "amber", "yellow", "orange"];
const SHADES = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
const scale = (prefix, family) =>
  Object.fromEntries(SHADES.map((s) => [s, `rgb(var(--${prefix}${family}-${s}) / <alpha-value>)`]));
const palette = (prefix) => Object.fromEntries(FAMILIES.map((f) => [f, scale(prefix, f)]));

module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ...palette(""),
        // Card / panel background: white in light, raised charcoal in dark.
        // (Plain `white` stays white — for text on accents and the navy sidebar's overlays.)
        surface: "rgb(var(--surface) / <alpha-value>)",
        page: "rgb(var(--page) / <alpha-value>)",
      },
      textColor: palette("t-"),
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
