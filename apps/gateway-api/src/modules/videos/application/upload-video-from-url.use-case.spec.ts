import { describe, expect, it, vi } from "vitest";
import { VideoStatus } from "@transcribemind/contracts";
import { UploadVideoFromUrlUseCase } from "./upload-video-from-url.use-case.js";
import type { UploadVideoUseCase } from "./upload-video.use-case.js";
import { mockVideoRepository, mockStatusPublisher, mockRemoteVideoFetcher, mockLogger, makeVideo } from "../../../test/mockVideoPorts.js";
import type { FetchedRemoteVideo } from "../domain/ports/remote-video-fetcher.port.js";

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

describe("UploadVideoFromUrlUseCase", () => {
  it("returns a placeholder video immediately", async () => {
    const placeholder = makeVideo({ id: "v-placeholder", originalFilename: "Descargando video..." });
    const videoRepository = mockVideoRepository({ create: vi.fn().mockResolvedValue(placeholder) });
    const remoteVideoFetcher = mockRemoteVideoFetcher({
      fetch: vi.fn(() => new Promise<FetchedRemoteVideo>(() => {})),
    });
    const uploadVideoUseCase = { execute: vi.fn() } as unknown as UploadVideoUseCase;
    const useCase = new UploadVideoFromUrlUseCase(remoteVideoFetcher, uploadVideoUseCase, videoRepository, mockStatusPublisher(), mockLogger());

    const result = await useCase.execute({ userId: "u1", url: "https://example.com/video" });

    expect(result).toBe(placeholder);
    expect(videoRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u1", originalFilename: "Descargando video..." })
    );
  });

  it("finalizes the placeholder via UploadVideoUseCase once the remote fetch succeeds", async () => {
    const placeholder = makeVideo({ id: "v-placeholder" });
    const videoRepository = mockVideoRepository({ create: vi.fn().mockResolvedValue(placeholder) });
    const remoteVideoFetcher = mockRemoteVideoFetcher({
      fetch: vi.fn().mockResolvedValue({ filename: "downloaded.mp4", contentType: "video/mp4", buffer: Buffer.from("x") }),
    });
    const uploadVideoUseCase = { execute: vi.fn().mockResolvedValue(placeholder) } as unknown as UploadVideoUseCase;
    const useCase = new UploadVideoFromUrlUseCase(remoteVideoFetcher, uploadVideoUseCase, videoRepository, mockStatusPublisher(), mockLogger());

    await useCase.execute({ userId: "u1", url: "https://example.com/video" });
    await flushMicrotasks();

    expect(uploadVideoUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u1", originalFilename: "downloaded.mp4", existingVideoId: "v-placeholder" })
    );
  });

  it("publishes QUEUED progress events as the fetcher reports them", async () => {
    const placeholder = makeVideo({ id: "v-placeholder" });
    const videoRepository = mockVideoRepository({ create: vi.fn().mockResolvedValue(placeholder) });
    const statusPublisher = mockStatusPublisher();
    const remoteVideoFetcher = mockRemoteVideoFetcher({
      fetch: vi.fn().mockImplementation(async (_url: string, onProgress?: (percent: number) => void) => {
        onProgress?.(42);
        return { filename: "downloaded.mp4", contentType: "video/mp4", buffer: Buffer.from("x") };
      }),
    });
    const uploadVideoUseCase = { execute: vi.fn().mockResolvedValue(placeholder) } as unknown as UploadVideoUseCase;
    const useCase = new UploadVideoFromUrlUseCase(remoteVideoFetcher, uploadVideoUseCase, videoRepository, statusPublisher, mockLogger());

    await useCase.execute({ userId: "u1", url: "https://example.com/video" });
    await flushMicrotasks();

    expect(statusPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({ videoId: "v-placeholder", status: VideoStatus.QUEUED, progress: 42 })
    );
  });

  it("marks the video failed and publishes FAILED when the download throws", async () => {
    const placeholder = makeVideo({ id: "v-placeholder" });
    const videoRepository = mockVideoRepository({ create: vi.fn().mockResolvedValue(placeholder) });
    const statusPublisher = mockStatusPublisher();
    const remoteVideoFetcher = mockRemoteVideoFetcher({ fetch: vi.fn().mockRejectedValue(new Error("network down")) });
    const uploadVideoUseCase = { execute: vi.fn() } as unknown as UploadVideoUseCase;
    const useCase = new UploadVideoFromUrlUseCase(remoteVideoFetcher, uploadVideoUseCase, videoRepository, statusPublisher, mockLogger());

    await useCase.execute({ userId: "u1", url: "https://example.com/video" });
    await flushMicrotasks();

    expect(videoRepository.markFailed).toHaveBeenCalledWith("v-placeholder", "No se pudo descargar el video desde la URL");
    expect(statusPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({ videoId: "v-placeholder", status: VideoStatus.FAILED })
    );
  });
});
