import { describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({ prismaMock: { video: { update: vi.fn() } } }));

vi.mock("@transcribemind/database", () => ({ prisma: prismaMock }));

const { PrismaVideoRepository } = await import("./prisma-video.repository.js");

describe("PrismaVideoRepository (ai-summary-service)", () => {
  it("saveAnalysis marks the video COMPLETED with the analysis and a completedAt timestamp", async () => {
    const repository = new PrismaVideoRepository();
    const analysis = { executiveSummary: "x", keyPoints: [], keywords: [] };

    await repository.saveAnalysis("v1", analysis);

    const call = prismaMock.video.update.mock.calls.at(-1)![0];
    expect(call.where).toEqual({ id: "v1" });
    expect(call.data.analysis).toBe(analysis);
    expect(call.data.status).toBe("COMPLETED");
    expect(call.data.progress).toBe(100);
    expect(call.data.completedAt).toBeInstanceOf(Date);
  });

  it("markFailed sets status FAILED with the error message", async () => {
    const repository = new PrismaVideoRepository();

    await repository.markFailed("v1", "boom");

    expect(prismaMock.video.update).toHaveBeenCalledWith({ where: { id: "v1" }, data: { status: "FAILED", error: "boom" } });
  });
});
