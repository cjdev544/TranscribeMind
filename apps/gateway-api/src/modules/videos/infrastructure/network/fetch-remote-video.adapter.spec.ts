import { afterEach, describe, expect, it, vi } from "vitest";

const { lookupMock } = vi.hoisted(() => ({ lookupMock: vi.fn() }));

vi.mock("node:dns/promises", () => ({ lookup: lookupMock }));

const { FetchRemoteVideoAdapter } = await import("./fetch-remote-video.adapter.js");

function fakeResponse(overrides: {
  status?: number;
  ok?: boolean;
  headers?: Record<string, string>;
  chunks?: Uint8Array[];
} = {}) {
  const headerMap = new Map(Object.entries(overrides.headers ?? {}));
  const chunks = overrides.chunks ?? [new TextEncoder().encode("video-bytes")];
  return {
    status: overrides.status ?? 200,
    ok: overrides.ok ?? true,
    headers: { get: (key: string) => headerMap.get(key.toLowerCase()) ?? null },
    body: {
      [Symbol.asyncIterator]: async function* () {
        for (const chunk of chunks) yield chunk;
      },
    },
  } as unknown as Response;
}

describe("FetchRemoteVideoAdapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("rejects a malformed URL", async () => {
    const adapter = new FetchRemoteVideoAdapter();

    await expect(adapter.fetch("not a url")).rejects.toThrow("URL inválida");
  });

  it("rejects a non-http(s) protocol", async () => {
    const adapter = new FetchRemoteVideoAdapter();

    await expect(adapter.fetch("ftp://example.com/video.mp4")).rejects.toThrow("Solo se permiten URLs http(s)");
  });

  it("rejects a URL whose host resolves to a private IP (SSRF guard)", async () => {
    lookupMock.mockResolvedValue([{ address: "169.254.169.254" }]);
    const adapter = new FetchRemoteVideoAdapter();

    await expect(adapter.fetch("https://internal.example.com/video.mp4")).rejects.toThrow(
      "La URL apunta a una red privada/no permitida"
    );
  });

  it("rejects a URL whose host cannot be resolved", async () => {
    lookupMock.mockRejectedValue(new Error("ENOTFOUND"));
    const adapter = new FetchRemoteVideoAdapter();

    await expect(adapter.fetch("https://nonexistent.example.com/video.mp4")).rejects.toThrow(
      "No se pudo resolver el host de la URL"
    );
  });

  it("downloads a valid video response", async () => {
    lookupMock.mockResolvedValue([{ address: "93.184.216.34" }]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(fakeResponse({ headers: { "content-type": "video/mp4", "content-length": "11" } }))
    );
    const adapter = new FetchRemoteVideoAdapter();

    const result = await adapter.fetch("https://example.com/videos/clip.mp4");

    expect(result.contentType).toBe("video/mp4");
    expect(result.filename).toBe("clip.mp4");
    expect(result.buffer.toString()).toBe("video-bytes");
  });

  it("derives the filename from a Content-Disposition header when present", async () => {
    lookupMock.mockResolvedValue([{ address: "93.184.216.34" }]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        fakeResponse({ headers: { "content-type": "video/mp4", "content-disposition": 'attachment; filename="real-name.mp4"' } })
      )
    );
    const adapter = new FetchRemoteVideoAdapter();

    const result = await adapter.fetch("https://example.com/download?id=123");

    expect(result.filename).toBe("real-name.mp4");
  });

  it("follows a redirect to the Location header", async () => {
    lookupMock.mockResolvedValue([{ address: "93.184.216.34" }]);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(fakeResponse({ status: 302, ok: false, headers: { location: "https://example.com/final.mp4" } }))
      .mockResolvedValueOnce(fakeResponse({ headers: { "content-type": "video/mp4" } }));
    vi.stubGlobal("fetch", fetchMock);
    const adapter = new FetchRemoteVideoAdapter();

    await adapter.fetch("https://example.com/redirect");

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects a response whose content-type is not a video", async () => {
    lookupMock.mockResolvedValue([{ address: "93.184.216.34" }]);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fakeResponse({ headers: { "content-type": "text/html" } })));
    const adapter = new FetchRemoteVideoAdapter();

    await expect(adapter.fetch("https://example.com/page.html")).rejects.toThrow(/no parece apuntar a un archivo de video/);
  });

  it("rejects a response advertising a size over the max limit", async () => {
    lookupMock.mockResolvedValue([{ address: "93.184.216.34" }]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        fakeResponse({ headers: { "content-type": "video/mp4", "content-length": String(3 * 1024 * 1024 * 1024) } })
      )
    );
    const adapter = new FetchRemoteVideoAdapter();

    await expect(adapter.fetch("https://example.com/huge.mp4")).rejects.toThrow(/tamaño máximo permitido/);
  });

  it("rejects a non-ok response with no successful redirect target", async () => {
    lookupMock.mockResolvedValue([{ address: "93.184.216.34" }]);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fakeResponse({ status: 404, ok: false })));
    const adapter = new FetchRemoteVideoAdapter();

    await expect(adapter.fetch("https://example.com/missing.mp4")).rejects.toThrow("La URL no devolvió un video válido");
  });

  it("reports download progress based on bytes read vs. content-length", async () => {
    lookupMock.mockResolvedValue([{ address: "93.184.216.34" }]);
    const chunks = [new Uint8Array(50), new Uint8Array(50)];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(fakeResponse({ headers: { "content-type": "video/mp4", "content-length": "100" }, chunks }))
    );
    const adapter = new FetchRemoteVideoAdapter();
    const onProgress = vi.fn();

    await adapter.fetch("https://example.com/clip.mp4", onProgress);

    expect(onProgress).toHaveBeenCalledWith(50);
    expect(onProgress).toHaveBeenCalledWith(99);
  });
});
