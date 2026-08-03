// youtube-dl-exec's own postinstall hits api.github.com to resolve the
// latest release, which proved flaky/rate-limited during image builds.
// This instead follows GitHub's "latest release" redirect straight to the
// asset (objects.githubusercontent.com), which doesn't share that bottleneck.
import { mkdirSync, writeFileSync, chmodSync } from "node:fs";
import { dirname } from "node:path";

const DEST = "node_modules/youtube-dl-exec/bin/yt-dlp";
const URL = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp";
const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 5000;

async function main() {
  mkdirSync(dirname(DEST), { recursive: true });

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(URL, { redirect: "follow" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      writeFileSync(DEST, Buffer.from(await response.arrayBuffer()));
      chmodSync(DEST, 0o755);
      console.log(`yt-dlp downloaded to ${DEST}`);
      return;
    } catch (error) {
      console.error(`Attempt ${attempt}/${MAX_ATTEMPTS} failed: ${error.message}`);
      if (attempt === MAX_ATTEMPTS) process.exit(1);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

main();
