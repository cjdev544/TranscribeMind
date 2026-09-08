import { describe, expect, it, vi } from "vitest";
import { SummaryLanguage } from "@transcribemind/contracts";
import { UploadVideoUseCase } from "./upload-video.use-case.js";
import { mockVideoRepository, mockObjectStorage, mockJobQueue, makeVideo, fakeMp4Buffer } from "../../../test/mockVideoPorts.js";

describe("UploadVideoUseCase", () => {
  it("uploads the file, creates the video row, and enqueues processing", async () => {
    const video = makeVideo({ id: "v1" });
    const videoRepository = mockVideoRepository({ create: vi.fn().mockResolvedValue(video) });
    const objectStorage = mockObjectStorage();
    const jobQueue = mockJobQueue();
    const useCase = new UploadVideoUseCase(videoRepository, objectStorage, jobQueue);

    const result = await useCase.execute({
      userId: "u1",
      originalFilename: "clip.mp4",
      mimeType: "video/mp4",
      fileBuffer: fakeMp4Buffer(),
    });

    expect(objectStorage.upload).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: "video/mp4", body: expect.any(Buffer) })
    );
    expect(videoRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u1", originalFilename: "clip.mp4", summaryLanguage: SummaryLanguage.ES })
    );
    expect(jobQueue.enqueueVideoProcessing).toHaveBeenCalledWith(
      expect.objectContaining({ videoId: "v1", userId: "u1" })
    );
    expect(result).toBe(video);
  });

  it("finalizes an existing placeholder video instead of creating a new one when existingVideoId is set", async () => {
    const videoRepository = mockVideoRepository();
    const useCase = new UploadVideoUseCase(videoRepository, mockObjectStorage(), mockJobQueue());

    await useCase.execute({
      userId: "u1",
      originalFilename: "clip.mp4",
      mimeType: "video/mp4",
      fileBuffer: fakeMp4Buffer(),
      existingVideoId: "v-placeholder",
    });

    expect(videoRepository.finalizeUpload).toHaveBeenCalledWith(
      "v-placeholder",
      expect.objectContaining({ originalFilename: "clip.mp4" })
    );
    expect(videoRepository.create).not.toHaveBeenCalled();
  });

  it("rejects an AppleDouble sidecar file with a specific message", async () => {
    const useCase = new UploadVideoUseCase(mockVideoRepository(), mockObjectStorage(), mockJobQueue());
    const appleDoubleBuffer = Buffer.from([0x00, 0x05, 0x16, 0x07, 0, 0]);

    await expect(
      useCase.execute({ userId: "u1", originalFilename: "._clip.mp4", mimeType: "video/mp4", fileBuffer: appleDoubleBuffer })
    ).rejects.toThrow(/metadatos de macOS/);
  });

  it("rejects a file that is not a recognized video container", async () => {
    const useCase = new UploadVideoUseCase(mockVideoRepository(), mockObjectStorage(), mockJobQueue());

    await expect(
      useCase.execute({ userId: "u1", originalFilename: "notes.txt", mimeType: "text/plain", fileBuffer: Buffer.from("hello") })
    ).rejects.toThrow(/no parece ser un archivo de video válido/);
  });

  it("does not upload or enqueue when the file signature check fails", async () => {
    const objectStorage = mockObjectStorage();
    const jobQueue = mockJobQueue();
    const useCase = new UploadVideoUseCase(mockVideoRepository(), objectStorage, jobQueue);

    await useCase
      .execute({ userId: "u1", originalFilename: "notes.txt", mimeType: "text/plain", fileBuffer: Buffer.from("hello") })
      .catch(() => undefined);

    expect(objectStorage.upload).not.toHaveBeenCalled();
    expect(jobQueue.enqueueVideoProcessing).not.toHaveBeenCalled();
  });
});
