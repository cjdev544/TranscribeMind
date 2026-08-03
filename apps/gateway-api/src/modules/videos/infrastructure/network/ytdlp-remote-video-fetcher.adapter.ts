import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import youtubeDl from "youtube-dl-exec";
import type { Flags } from "youtube-dl-exec";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import type { Logger } from "@transcribemind/logger";
import { DomainError } from "../../../../shared/kernel/domain-error.js";
import type {
  FetchedRemoteVideo,
  RemoteVideoFetchProgressListener,
  RemoteVideoFetcherPort,
} from "../../domain/ports/remote-video-fetcher.port.js";

// Matches yt-dlp's "--newline" progress lines, e.g.
// "[download]  42.9% of  250.00MiB at    1.20MiB/s ETA 00:30"
const PROGRESS_LINE_PATTERN = /\[download]\s+([\d.]+)%/;

/**
 * yt-dlp's stderr is meant for developers (stack traces, retry counts, raw
 * socket errno names) and is worthless to a user deciding what to do next.
 * The raw text is still captured by the caller's logger.error() for
 * debugging — this only controls what ends up in the user-facing message.
 */
function humanizeYtDlpError(stderr: string): string {
  if (/name or service not known|enotfound|getaddrinfo|network is unreachable/i.test(stderr)) {
    return "Hubo un problema de red al descargar el video. Intenta de nuevo en unos momentos.";
  }
  if (/video unavailable|no longer available|has been removed/i.test(stderr)) {
    return "Ese video ya no está disponible en YouTube (puede haber sido eliminado).";
  }
  if (/private video|age.restricted/i.test(stderr)) {
    return "Ese video es privado o tiene restricción de edad, así que no se puede descargar.";
  }
  if (/sign in to confirm you.?re not a bot/i.test(stderr)) {
    return "YouTube bloqueó momentáneamente la descarga por verificación anti-bot. Intenta de nuevo en unos minutos, o usa un enlace directo al archivo de video en su lugar.";
  }
  if (/not available in your country|blocked it (on|in)|copyright/i.test(stderr)) {
    return "Ese video no está disponible por restricciones de región o derechos de autor.";
  }
  if (/http error 429|too many requests/i.test(stderr)) {
    return "YouTube está limitando las descargas en este momento. Intenta de nuevo en unos minutos.";
  }
  if (/unsupported url|is not a valid url/i.test(stderr)) {
    return "Ese enlace no es un video de YouTube válido.";
  }
  return "No se pudo descargar el video desde ese enlace. Verifica que sea correcto y público, e inténtalo de nuevo.";
}

const MAX_BYTES = 2 * 1024 * 1024 * 1024; // 2GB, same ceiling as the direct multipart upload
const DOWNLOAD_TIMEOUT_MS = 15 * 60 * 1000; // yt-dlp must download + mux audio/video, slower than a plain fetch

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mkv: "video/x-matroska",
  mov: "video/quicktime",
};

/**
 * YouTube never serves a video file from a plain GET, so it can't go through
 * FetchRemoteVideoAdapter. yt-dlp resolves the page into an actual media
 * stream. Restricted to known YouTube hostnames only — unlike the generic
 * fetcher, yt-dlp's extractor surface is too broad to safely point at an
 * arbitrary user-supplied host (SSRF risk), so this adapter must never be
 * used outside of an allowlisted domain.
 */
const YOUTUBE_HOSTNAMES = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
]);

export function isYoutubeUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    return YOUTUBE_HOSTNAMES.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export class YtDlpRemoteVideoFetcherAdapter implements RemoteVideoFetcherPort {
  constructor(private readonly logger: Logger) {}

  async fetch(rawUrl: string, onProgress?: RemoteVideoFetchProgressListener): Promise<FetchedRemoteVideo> {
    if (!isYoutubeUrl(rawUrl)) {
      throw new DomainError("URL de YouTube inválida", "VALIDATION_ERROR", 400);
    }

    const workDir = await mkdtemp(join(tmpdir(), "ytdlp-"));

    try {
      await this.runYtDlp(rawUrl, workDir, onProgress);

      const [downloadedFile] = await readdir(workDir);
      if (!downloadedFile) {
        throw new DomainError("No se pudo descargar el video de YouTube", "VALIDATION_ERROR", 400);
      }

      const filePath = join(workDir, downloadedFile);
      const buffer = await readFile(filePath);
      if (buffer.byteLength > MAX_BYTES) {
        throw new DomainError("El video supera el tamaño máximo permitido (2GB)", "VALIDATION_ERROR", 413);
      }

      const ext = downloadedFile.split(".").pop()?.toLowerCase() ?? "";
      const contentType = CONTENT_TYPE_BY_EXT[ext] ?? "application/octet-stream";

      return { filename: downloadedFile, contentType, buffer };
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  }

  private async runYtDlp(
    url: string,
    workDir: string,
    onProgress?: RemoteVideoFetchProgressListener,
  ): Promise<void> {
    // youtube-dl-exec bundles its own yt-dlp binary (downloaded at npm-install
    // time) and resolves the right executable name per platform, instead of
    // relying on a system-wide "yt-dlp" on PATH that may not exist.
    // The "web" client (yt-dlp's default) now requires a PO token to pass
    // YouTube's bot check, which fails hard from datacenter/VPS IPs with
    // "Sign in to confirm you're not a bot". The android/ios clients use a
    // different auth path that doesn't need one, at the cost of occasionally
    // missing the highest-resolution formats. youtube-dl-exec's Flags type
    // predates --extractor-args, hence the local type extension.
    const flags: Flags & { extractorArgs?: string } = {
      noPlaylist: true,
      maxFilesize: "2G",
      format: "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
      mergeOutputFormat: "mp4",
      ffmpegLocation: ffmpegInstaller.path,
      output: join(workDir, "%(id)s.%(ext)s"),
      newline: true,
      extractorArgs: "youtube:player_client=android,ios,web",
    };

    const subprocess = youtubeDl.exec(url, flags, { stdio: ["ignore", "pipe", "pipe"] });

    // yt-dlp downloads video and audio as two separate 0-100% passes (for
    // the bestvideo+bestaudio format) before muxing. There's no reliable way
    // to know the total pass count upfront, so each pass is reported as its
    // own 0-100 run rather than guessing at a combined percentage — still a
    // clear, monotonic-within-a-pass signal that real progress is happening.
    //
    // Deliberately NOT calling stdout.setEncoding() here: tinyspawn (used by
    // youtube-dl-exec) keeps its own listener on this same stream to buffer
    // raw Buffer chunks for its error message on a non-zero exit. Switching
    // the stream to string mode would turn those into strings too, and its
    // Buffer.concat() over them throws — crashing the whole process instead
    // of surfacing a DomainError — the first time yt-dlp actually fails.
    let lastReportedPercent = -1;
    let pendingLine = "";
    subprocess.stdout?.on("data", (chunk: Buffer) => {
      if (!onProgress) return;
      pendingLine += chunk.toString("utf8");
      const lines = pendingLine.split(/\r?\n/);
      pendingLine = lines.pop() ?? "";
      for (const line of lines) {
        const match = PROGRESS_LINE_PATTERN.exec(line);
        if (!match) continue;
        const percent = Math.round(Number(match[1]));
        if (percent !== lastReportedPercent) {
          lastReportedPercent = percent;
          onProgress(percent);
        }
      }
    });

    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      subprocess.kill("SIGKILL");
    }, DOWNLOAD_TIMEOUT_MS);

    try {
      await subprocess;
    } catch (error) {
      if (timedOut) {
        throw new DomainError("La descarga del video de YouTube tardó demasiado", "VALIDATION_ERROR", 408);
      }
      const stderr = (error as { stderr?: string }).stderr ?? (error as Error).message;
      // The friendly DomainError message below is what the user sees; this
      // is the only place the raw yt-dlp output (stack traces, errno names)
      // still gets recorded anywhere.
      this.logger.error({ stderr }, "yt-dlp download failed");
      throw new DomainError(humanizeYtDlpError(stderr), "VALIDATION_ERROR", 400);
    } finally {
      clearTimeout(timeout);
    }
  }
}
