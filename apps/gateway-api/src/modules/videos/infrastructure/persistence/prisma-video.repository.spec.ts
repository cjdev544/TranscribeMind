import { describe, expect, it, vi } from "vitest";
import { SummaryLanguage } from "@transcribemind/contracts";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    video: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@transcribemind/database", () => ({
  prisma: prismaMock,
  VideoStatus: { QUEUED: "QUEUED", COMPLETED: "COMPLETED", FAILED: "FAILED" },
}));

const { PrismaVideoRepository } = await import("./prisma-video.repository.js");

describe("PrismaVideoRepository", () => {
  it("create passes through the given fields, defaulting a missing title to null", async () => {
    prismaMock.video.create.mockResolvedValue({});
    const repository = new PrismaVideoRepository();

    await repository.create({ userId: "u1", originalFilename: "clip.mp4", s3Key: "k1", summaryLanguage: SummaryLanguage.ES });

    expect(prismaMock.video.create).toHaveBeenCalledWith({
      data: { userId: "u1", title: null, originalFilename: "clip.mp4", s3Key: "k1", summaryLanguage: SummaryLanguage.ES },
    });
  });

  it("findById queries by id", async () => {
    prismaMock.video.findUnique.mockResolvedValue(null);
    const repository = new PrismaVideoRepository();

    expect(await repository.findById("v1")).toBeNull();
    expect(prismaMock.video.findUnique).toHaveBeenCalledWith({ where: { id: "v1" } });
  });

  it("listByUser filters by userId, status, and a case-insensitive search across title/filename", async () => {
    prismaMock.video.findMany.mockResolvedValue([]);
    const repository = new PrismaVideoRepository();

    await repository.listByUser({ userId: "u1", status: "COMPLETED" as never, search: "clip" });

    expect(prismaMock.video.findMany).toHaveBeenCalledWith({
      where: {
        userId: "u1",
        status: "COMPLETED",
        OR: [
          { title: { contains: "clip", mode: "insensitive" } },
          { originalFilename: { contains: "clip", mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
  });

  it("listByUser omits the OR clause when there is no search term", async () => {
    prismaMock.video.findMany.mockResolvedValue([]);
    const repository = new PrismaVideoRepository();

    await repository.listByUser({ userId: "u1" });

    expect(prismaMock.video.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ OR: undefined }) })
    );
  });

  it("resetForRetry resets status, progress, and error", async () => {
    const repository = new PrismaVideoRepository();

    await repository.resetForRetry("v1");

    expect(prismaMock.video.update).toHaveBeenCalledWith({
      where: { id: "v1" },
      data: { status: "QUEUED", progress: 0, error: null },
    });
  });

  it("updateTitle updates only the title", async () => {
    const repository = new PrismaVideoRepository();

    await repository.updateTitle("v1", "Nuevo título");

    expect(prismaMock.video.update).toHaveBeenCalledWith({ where: { id: "v1" }, data: { title: "Nuevo título" } });
  });

  it("delete removes the row by id", async () => {
    const repository = new PrismaVideoRepository();

    await repository.delete("v1");

    expect(prismaMock.video.delete).toHaveBeenCalledWith({ where: { id: "v1" } });
  });

  it("finalizeUpload updates the filename and s3Key", async () => {
    prismaMock.video.update.mockResolvedValue({});
    const repository = new PrismaVideoRepository();

    await repository.finalizeUpload("v1", { originalFilename: "final.mp4", s3Key: "k2" });

    expect(prismaMock.video.update).toHaveBeenCalledWith({
      where: { id: "v1" },
      data: { originalFilename: "final.mp4", s3Key: "k2" },
    });
  });

  it("markFailed sets status to FAILED with the error message", async () => {
    const repository = new PrismaVideoRepository();

    await repository.markFailed("v1", "boom");

    expect(prismaMock.video.update).toHaveBeenCalledWith({ where: { id: "v1" }, data: { status: "FAILED", error: "boom" } });
  });

  it("markFileDeleted sets fileDeletedAt to a Date", async () => {
    const repository = new PrismaVideoRepository();

    await repository.markFileDeleted("v1");

    const call = prismaMock.video.update.mock.calls.at(-1)![0];
    expect(call.where).toEqual({ id: "v1" });
    expect(call.data.fileDeletedAt).toBeInstanceOf(Date);
  });

  it("listCompletedBefore filters completed, not-yet-deleted videos before the cutoff", async () => {
    prismaMock.video.findMany.mockResolvedValue([]);
    const repository = new PrismaVideoRepository();
    const cutoff = new Date("2026-01-01");

    await repository.listCompletedBefore(cutoff);

    expect(prismaMock.video.findMany).toHaveBeenCalledWith({
      where: { status: "COMPLETED", fileDeletedAt: null, completedAt: { lt: cutoff } },
    });
  });
});
