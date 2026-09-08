import { describe, expect, it, vi } from "vitest";

const { getJobMock, addMock, removeMock } = vi.hoisted(() => ({
  getJobMock: vi.fn(),
  addMock: vi.fn(),
  removeMock: vi.fn(),
}));

vi.mock("bullmq", () => ({
  Queue: class {
    getJob = getJobMock;
    add = addMock;
  },
}));

const { BullMqJobQueueAdapter } = await import("./bullmq-job-queue.adapter.js");

const job = { videoId: "v1", userId: "u1", s3Key: "k1", summaryLanguage: "es" as const };

describe("BullMqJobQueueAdapter", () => {
  it("enqueues the job with a deterministic id and the default job options", async () => {
    getJobMock.mockResolvedValue(null);
    const adapter = new BullMqJobQueueAdapter({} as never);

    await adapter.enqueueVideoProcessing(job);

    expect(addMock).toHaveBeenCalledWith(
      "video-processing",
      job,
      expect.objectContaining({ jobId: "video-processing-v1", attempts: 5 })
    );
  });

  it("removes a stale terminal job with the same id before re-enqueuing", async () => {
    const remove = removeMock;
    getJobMock.mockResolvedValue({ remove });
    const adapter = new BullMqJobQueueAdapter({} as never);

    await adapter.enqueueVideoProcessing(job);

    expect(remove).toHaveBeenCalled();
    expect(addMock).toHaveBeenCalled();
  });
});
