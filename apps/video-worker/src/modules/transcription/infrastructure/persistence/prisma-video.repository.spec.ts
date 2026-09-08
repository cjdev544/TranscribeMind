import { describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: { video: { findUnique: vi.fn(), update: vi.fn() } },
}));

vi.mock("@transcribemind/database", () => ({ prisma: prismaMock }));

const { PrismaVideoRepository } = await import("./prisma-video.repository.js");

describe("PrismaVideoRepository (video-worker)", () => {
  it("findById maps a found record to a VideoRecord", async () => {
    prismaMock.video.findUnique.mockResolvedValue({ id: "v1", userId: "u1", s3Key: "k1", status: "QUEUED" });
    const repository = new PrismaVideoRepository();

    const video = await repository.findById("v1");

    expect(video).toEqual({ id: "v1", userId: "u1", s3Key: "k1", status: "QUEUED" });
  });

  it("findById returns null when no record is found", async () => {
    prismaMock.video.findUnique.mockResolvedValue(null);
    const repository = new PrismaVideoRepository();

    expect(await repository.findById("missing")).toBeNull();
  });

  it("updateStatus writes status and progress", async () => {
    const repository = new PrismaVideoRepository();

    await repository.updateStatus("v1", "TRANSCRIBING" as never, 30);

    expect(prismaMock.video.update).toHaveBeenCalledWith({ where: { id: "v1" }, data: { status: "TRANSCRIBING", progress: 30 } });
  });

  it("saveDuration writes durationSeconds", async () => {
    const repository = new PrismaVideoRepository();

    await repository.saveDuration("v1", 120);

    expect(prismaMock.video.update).toHaveBeenCalledWith({ where: { id: "v1" }, data: { durationSeconds: 120 } });
  });

  it("saveTranscript writes transcript and segments", async () => {
    const repository = new PrismaVideoRepository();
    const segments = [{ start: 0, end: 1, text: "hola" }];

    await repository.saveTranscript("v1", "hola", segments);

    expect(prismaMock.video.update).toHaveBeenCalledWith({
      where: { id: "v1" },
      data: { transcript: "hola", transcriptSegments: segments },
    });
  });

  it("markFailed sets status FAILED with the error message", async () => {
    const repository = new PrismaVideoRepository();

    await repository.markFailed("v1", "boom");

    expect(prismaMock.video.update).toHaveBeenCalledWith({ where: { id: "v1" }, data: { status: "FAILED", error: "boom" } });
  });
});
