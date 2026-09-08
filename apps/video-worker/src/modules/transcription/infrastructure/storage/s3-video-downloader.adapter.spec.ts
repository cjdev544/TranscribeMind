import { describe, expect, it, vi } from "vitest";

const { sendMock, getObjectCommandMock, mkdirMock, createWriteStreamMock, pipelineMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  getObjectCommandMock: vi.fn((input: unknown) => ({ input })),
  mkdirMock: vi.fn().mockResolvedValue(undefined),
  createWriteStreamMock: vi.fn().mockReturnValue({}),
  pipelineMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send = sendMock;
  },
  GetObjectCommand: getObjectCommandMock,
}));
vi.mock("node:fs/promises", () => ({ mkdir: mkdirMock }));
vi.mock("node:fs", () => ({ createWriteStream: createWriteStreamMock }));
vi.mock("node:stream/promises", () => ({ pipeline: pipelineMock }));

const { S3VideoDownloaderAdapter } = await import("./s3-video-downloader.adapter.js");

const config = {
  bucket: "test-bucket",
  endpoint: "https://s3.test.example.com",
  region: "us-east-1",
  accessKeyId: "key",
  secretAccessKey: "secret",
  forcePathStyle: true,
};

describe("S3VideoDownloaderAdapter", () => {
  it("fetches the object by bucket and key, and streams it to a local file", async () => {
    sendMock.mockResolvedValue({ Body: "fake-stream" });
    const adapter = new S3VideoDownloaderAdapter(config);

    const result = await adapter.download("videos/u1/v1.mp4");

    expect(getObjectCommandMock).toHaveBeenCalledWith({ Bucket: "test-bucket", Key: "videos/u1/v1.mp4" });
    expect(mkdirMock).toHaveBeenCalled();
    expect(pipelineMock).toHaveBeenCalledWith("fake-stream", expect.anything());
    expect(result.filePath).toContain("videos_u1_v1.mp4");
  });
});
