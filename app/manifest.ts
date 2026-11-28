import type { MetadataRoute } from "next";

// Makes Cadence installable (Add to Home Screen / Install app). Served at /manifest.webmanifest.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/dashboard",
    name: "Cadence",
    short_name: "Cadence",
    description: "Attendance, coursework and updates for your institution.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "any",
    // The sidebar navy, as on the logo tile.
    theme_color: "#0c1f4a",
    background_color: "#0c1f4a",
    categories: ["education", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
