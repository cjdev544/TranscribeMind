import { lookup as dnsLookup } from "node:dns/promises";
import { isIP } from "node:net";
import { DomainError } from "../../../../shared/kernel/domain-error.js";
import type {
  FetchedRemoteVideo,
  RemoteVideoFetchProgressListener,
  RemoteVideoFetcherPort,
} from "../../domain/ports/remote-video-fetcher.port.js";

const MAX_BYTES = 2 * 1024 * 1024 * 1024; // 2GB, same ceiling as the direct multipart upload
const REQUEST_TIMEOUT_MS = 5 * 60 * 1000; // remote hosts can be slow; generous but bounded
const MAX_REDIRECTS = 5;
const ACCEPTED_CONTENT_TYPES = ["video/", "application/octet-stream"];

/**
 * Server-Side Request Forgery guard: a user-supplied URL must never let this
 * server reach internal/private network addresses (e.g. cloud metadata
 * endpoints at 169.254.169.254, or other services on the deployment's own
 * VPC). Every hostname — including each hop of a redirect chain — is
 * resolved and checked before any request is made to it.
 */
function isPrivateOrReservedIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const octets = ip.split(".").map(Number);
    const a = octets[0] ?? 0;
    const b = octets[1] ?? 0;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }

  if (isIP(ip) === 6) {
    const normalized = ip.toLowerCase();
    if (normalized === "::1") return true;
    if (normalized.startsWith("fe80:") || normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
    if (normalized.startsWith("::ffff:")) {
      return isPrivateOrReservedIp(normalized.slice("::ffff:".length));
    }
    return false;
  }

  return true; // unresolvable / unknown shape — fail closed
}

async function assertHostIsPublic(hostname: string): Promise<void> {
  const records = await dnsLookup(hostname, { all: true }).catch(() => {
    throw new DomainError("No se pudo resolver el host de la URL", "VALIDATION_ERROR", 400);
  });

  for (const record of records) {
    if (isPrivateOrReservedIp(record.address)) {
      throw new DomainError("La URL apunta a una red privada/no permitida", "VALIDATION_ERROR", 400);
    }
  }
}

function deriveFilename(url: URL, contentDisposition: string | null): string {
  if (contentDisposition) {
    const match = /filename="?([^";]+)"?/i.exec(contentDisposition);
    if (match?.[1]) return match[1];
  }
  const lastSegment = url.pathname.split("/").filter(Boolean).pop();
  return lastSegment || "video-from-url.mp4";
}

export class FetchRemoteVideoAdapter implements RemoteVideoFetcherPort {
  async fetch(rawUrl: string, onProgress?: RemoteVideoFetchProgressListener): Promise<FetchedRemoteVideo> {
    let currentUrl: URL;
    try {
      currentUrl = new URL(rawUrl);
    } catch {
      throw new DomainError("URL inválida", "VALIDATION_ERROR", 400);
    }

    let response: Response | null = null;

    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
      if (currentUrl.protocol !== "http:" && currentUrl.protocol !== "https:") {
        throw new DomainError("Solo se permiten URLs http(s)", "VALIDATION_ERROR", 400);
      }

      await assertHostIsPublic(currentUrl.hostname);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        response = await fetch(currentUrl, { redirect: "manual", signal: controller.signal });
      } catch {
        throw new DomainError("No se pudo descargar el video desde la URL", "VALIDATION_ERROR", 400);
      } finally {
        clearTimeout(timeout);
      }

      if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {
        currentUrl = new URL(response.headers.get("location")!, currentUrl);
        continue;
      }

      break;
    }

    if (!response || !response.ok) {
      throw new DomainError("La URL no devolvió un video válido", "VALIDATION_ERROR", 400);
    }

    const contentType = response.headers.get("content-type") ?? "application/octet-stream";
    if (!ACCEPTED_CONTENT_TYPES.some((accepted) => contentType.startsWith(accepted))) {
      throw new DomainError(
        `La URL no parece apuntar a un archivo de video (Content-Type: ${contentType})`,
        "VALIDATION_ERROR",
        400,
      );
    }

    const contentLength = Number(response.headers.get("content-length") ?? "0");
    if (contentLength > MAX_BYTES) {
      throw new DomainError("El video supera el tamaño máximo permitido (2GB)", "VALIDATION_ERROR", 413);
    }

    const buffer = await this.readBodyWithLimit(response, contentLength, onProgress);
    const filename = deriveFilename(currentUrl, response.headers.get("content-disposition"));

    return { filename, contentType, buffer };
  }

  private async readBodyWithLimit(
    response: Response,
    contentLength: number,
    onProgress?: RemoteVideoFetchProgressListener,
  ): Promise<Buffer> {
    if (!response.body) {
      throw new DomainError("La URL no devolvió contenido", "VALIDATION_ERROR", 400);
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    let lastReportedPercent = -1;

    for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
      totalBytes += chunk.byteLength;
      if (totalBytes > MAX_BYTES) {
        throw new DomainError("El video supera el tamaño máximo permitido (2GB)", "VALIDATION_ERROR", 413);
      }
      chunks.push(chunk);

      if (onProgress && contentLength > 0) {
        const percent = Math.min(99, Math.round((totalBytes / contentLength) * 100));
        if (percent !== lastReportedPercent) {
          lastReportedPercent = percent;
          onProgress(percent);
        }
      }
    }

    return Buffer.concat(chunks);
  }
}
