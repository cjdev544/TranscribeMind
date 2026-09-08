import { describe, expect, it, vi } from "vitest";

const { addMock } = vi.hoisted(() => ({ addMock: vi.fn() }));

vi.mock("bullmq", () => ({
  Queue: class {
    add = addMock;
  },
}));

const { BullMqTranscriptionReadyProducer } = await import("./bullmq-transcription-ready-producer.js");

describe("BullMqTranscriptionReadyProducer", () => {
  it("enqueues the job with a deterministic id and the default job options", async () => {
    const producer = new BullMqTranscriptionReadyProducer({} as never);
    const job = { videoId: "v1", userId: "u1", transcript: "hola", segments: [], summaryLanguage: "es" as const };

    await producer.enqueue(job);

    expect(addMock).toHaveBeenCalledWith(
      "transcription-ready",
      job,
      expect.objectContaining({ jobId: "transcription-ready-v1", attempts: 5 })
    );
  });
});
