import { describe, expect, it, vi } from "vitest";
import { VideoStatus } from "@transcribemind/contracts";
import { GenerateSummaryUseCase } from "./generate-summary.use-case.js";
import type { SummaryProviderPort } from "../domain/ports/summary-provider.port.js";
import type { VideoRepositoryPort } from "../domain/ports/video-repository.port.js";
import type { StatusPublisherPort } from "../domain/ports/status-publisher.port.js";

const summary = { executiveSummary: "resumen", keyPoints: ["a"], keywords: ["k"] };
const input = {
  videoId: "v1",
  userId: "u1",
  transcript: "hola",
  segments: [{ start: 0, end: 1, text: "hola" }],
  summaryLanguage: "es" as const,
};

function build(overrides: { summaryProvider?: SummaryProviderPort; videoRepository?: VideoRepositoryPort; statusPublisher?: StatusPublisherPort } = {}) {
  const summaryProvider: SummaryProviderPort = overrides.summaryProvider ?? { summarize: vi.fn().mockResolvedValue(summary) };
  const videoRepository: VideoRepositoryPort = overrides.videoRepository ?? { saveAnalysis: vi.fn(), markFailed: vi.fn() };
  const statusPublisher: StatusPublisherPort = overrides.statusPublisher ?? { publish: vi.fn() };
  return { useCase: new GenerateSummaryUseCase(summaryProvider, videoRepository, statusPublisher), summaryProvider, videoRepository, statusPublisher };
}

describe("GenerateSummaryUseCase", () => {
  it("publishes ANALYZING_AI before summarizing", async () => {
    const { useCase, statusPublisher } = build();

    await useCase.execute(input);

    expect(statusPublisher.publish).toHaveBeenNthCalledWith(1, { videoId: "v1", userId: "u1", status: VideoStatus.ANALYZING_AI, progress: 75 });
  });

  it("summarizes the segments in the requested language", async () => {
    const summaryProvider: SummaryProviderPort = { summarize: vi.fn().mockResolvedValue(summary) };
    const { useCase } = build({ summaryProvider });

    await useCase.execute(input);

    expect(summaryProvider.summarize).toHaveBeenCalledWith(input.segments, "es");
  });

  it("saves the analysis and publishes COMPLETED afterward", async () => {
    const { useCase, videoRepository, statusPublisher } = build();

    await useCase.execute(input);

    expect(videoRepository.saveAnalysis).toHaveBeenCalledWith("v1", summary);
    expect(statusPublisher.publish).toHaveBeenNthCalledWith(2, { videoId: "v1", userId: "u1", status: VideoStatus.COMPLETED, progress: 100 });
  });
});
