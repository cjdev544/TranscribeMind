import { describe, expect, it, vi } from "vitest";

const { sendMock, putObjectCommandMock, deleteObjectCommandMock, getObjectCommandMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  putObjectCommandMock: vi.fn((input: unknown) => ({ input })),
  deleteObjectCommandMock: vi.fn((input: unknown) => ({ input })),
  getObjectCommandMock: vi.fn((input: unknown) => ({ input })),
}));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send = sendMock;
  },
  PutObjectCommand: putObjectCommandMock,
  DeleteObjectCommand: deleteObjectCommandMock,
  GetObjectCommand: getObjectCommandMock,
}));

const { S3ObjectStorageAdapter } = await import("./s3-object-storage.adapter.js");

const config = {
  bucket: "test-bucket",
  endpoint: "https://s3.test.example.com",
  region: "us-east-1",
  accessKeyId: "key",
  secretAccessKey: "secret",
  forcePathStyle: true,
};

describe("S3ObjectStorageAdapter", () => {
  it("upload sends a PutObjectCommand with the bucket, key, body, and content type", async () => {
    sendMock.mockResolvedValue({});
    const adapter = new S3ObjectStorageAdapter(config);

    await adapter.upload({ key: "videos/v1.mp4", body: Buffer.from("x"), contentType: "video/mp4" });

    expect(putObjectCommandMock).toHaveBeenCalledWith(
      expect.objectContaining({ Bucket: "test-bucket", Key: "videos/v1.mp4", ContentType: "video/mp4" })
    );
    expect(sendMock).toHaveBeenCalled();
  });

  it("delete sends a DeleteObjectCommand with the bucket and key", async () => {
    sendMock.mockResolvedValue({});
    const adapter = new S3ObjectStorageAdapter(config);

    await adapter.delete("videos/v1.mp4");

    expect(deleteObjectCommandMock).toHaveBeenCalledWith({ Bucket: "test-bucket", Key: "videos/v1.mp4" });
  });

  it("download maps a full-object response to statusCode 200 with no contentRange", async () => {
    sendMock.mockResolvedValue({ Body: "stream", ContentType: "video/mp4", ContentLength: 100 });
    const adapter = new S3ObjectStorageAdapter(config);

    const result = await adapter.download({ key: "videos/v1.mp4" });

    expect(result.statusCode).toBe(200);
    expect(result.contentType).toBe("video/mp4");
    expect(result.contentLength).toBe(100);
  });

  it("download maps a ranged response to statusCode 206 with the contentRange", async () => {
    sendMock.mockResolvedValue({ Body: "stream", ContentRange: "bytes 0-9/100", ContentLength: 10 });
    const adapter = new S3ObjectStorageAdapter(config);

    const result = await adapter.download({ key: "videos/v1.mp4", range: "bytes=0-9" });

    expect(getObjectCommandMock).toHaveBeenCalledWith(
      expect.objectContaining({ Range: "bytes=0-9" })
    );
    expect(result.statusCode).toBe(206);
    expect(result.contentRange).toBe("bytes 0-9/100");
  });

  it("defaults contentType and contentLength when the response omits them", async () => {
    sendMock.mockResolvedValue({ Body: "stream" });
    const adapter = new S3ObjectStorageAdapter(config);

    const result = await adapter.download({ key: "videos/v1.mp4" });

    expect(result.contentType).toBe("application/octet-stream");
    expect(result.contentLength).toBe(0);
  });
});
