import { describe, expect, it, vi } from "vitest";
import { VideoStatus } from "@transcribemind/contracts";

const { workerMock } = vi.hoisted(() => {
  class WorkerMock {
    processor: (job: unknown) => Promise<void>;
    handlers = new Map<string, (...args: unknown[]) => void>();
    constructor(_name: string, processor: (job: unknown) => Promise<void>) {
      this.processor = processor;
    }
    on = vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      this.handlers.set(event, handler);
    });
  }
  return { workerMock: WorkerMock };
});

vi.mock("bullmq", () => ({ Worker: workerMock }));

const { createSummaryWorker } = await import("./bullmq-summary-worker.js");

function build() {
  const generateSummaryUseCase = { execute: vi.fn() };
  const statusPublisher = { publish: vi.fn() };
  const videoRepository = { markFailed: vi.fn() };
  const logger = { error: vi.fn() };
  const worker = createSummaryWorker(
    {} as never,
    generateSummaryUseCase as never,
    statusPublisher as never,
    videoRepository as never,
    logger as never,
  ) as unknown as InstanceType<typeof workerMock>;
  return { worker, generateSummaryUseCase, statusPublisher, videoRepository, logger };
}

describe("createSummaryWorker", () => {
  it("processes a job by running the use case with the job data", async () => {
    const { worker, generateSummaryUseCase } = build();

    await worker.processor({ data: { videoId: "v1" } });

    expect(generateSummaryUseCase.execute).toHaveBeenCalledWith({ videoId: "v1" });
  });

  it("marks the video failed and publishes FAILED once retries are exhausted", async () => {
    const { worker, videoRepository, statusPublisher, logger } = build();
    const job = { id: "j1", data: { videoId: "v1", userId: "u1" }, attemptsMade: 5, opts: { attempts: 5 } };

    await worker.handlers.get("failed")?.(job, new Error("rate limit exceeded"));

    expect(logger.error).toHaveBeenCalled();
    expect(videoRepository.markFailed).toHaveBeenCalledWith("v1", expect.stringContaining("saturado"));
    expect(statusPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({ videoId: "v1", userId: "u1", status: VideoStatus.FAILED })
    );
  });

  it("does not mark the video failed while retries remain", async () => {
    const { worker, videoRepository, statusPublisher } = build();
    const job = { id: "j1", data: { videoId: "v1", userId: "u1" }, attemptsMade: 1, opts: { attempts: 5 } };

    await worker.handlers.get("failed")?.(job, new Error("transient"));

    expect(videoRepository.markFailed).not.toHaveBeenCalled();
    expect(statusPublisher.publish).not.toHaveBeenCalled();
  });

  it("ignores a failed event with no job", async () => {
    const { worker, logger } = build();

    await expect(worker.handlers.get("failed")?.(undefined, new Error("x"))).resolves.toBeUndefined();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("maps a context-length error to a friendly message", async () => {
    const { worker, videoRepository } = build();
    const job = { id: "j1", data: { videoId: "v1", userId: "u1" }, attemptsMade: 1, opts: { attempts: 1 } };

    await worker.handlers.get("failed")?.(job, new Error("maximum context length exceeded"));

    expect(videoRepository.markFailed).toHaveBeenCalledWith("v1", expect.stringContaining("demasiado larga"));
  });
});
