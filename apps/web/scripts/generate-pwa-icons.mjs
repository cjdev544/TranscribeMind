// One-off asset generation: rasterizes the SVG app icon into the PNG sizes
// a Web App Manifest needs (browsers don't accept SVG-only icon lists
// reliably across platforms yet). Not part of the build — run manually
// whenever the icon design changes.
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const targets = [
  { src: "favicon.svg", out: "icon-192.png", size: 192 },
  { src: "favicon.svg", out: "icon-512.png", size: 512 },
  { src: "favicon.svg", out: "apple-touch-icon.png", size: 180 },
  { src: "icon-maskable.svg", out: "icon-maskable-512.png", size: 512 },
];

for (const { src, out, size } of targets) {
  const svg = readFileSync(join(publicDir, src));
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(join(publicDir, out));
  console.log(`Generated ${out} (${size}x${size})`);
}
