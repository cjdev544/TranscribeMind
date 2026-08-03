import { VideoStatus, type TranscriptionReadyJob } from "@transcribemind/contracts";
import type { SummaryProviderPort } from "../domain/ports/summary-provider.port.js";
import type { StatusPublisherPort } from "../domain/ports/status-publisher.port.js";
import type { VideoRepositoryPort } from "../domain/ports/video-repository.port.js";

export class GenerateSummaryUseCase {
  constructor(
    private readonly summaryProvider: SummaryProviderPort,
    private readonly videoRepository: VideoRepositoryPort,
    private readonly statusPublisher: StatusPublisherPort,
  ) {}

  async execute(input: TranscriptionReadyJob): Promise<void> {
    await this.statusPublisher.publish({
      videoId: input.videoId,
      userId: input.userId,
      status: VideoStatus.ANALYZING_AI,
      progress: 75,
    });

    const summary = await this.summaryProvider.summarize(input.segments, input.summaryLanguage);

    await this.videoRepository.saveAnalysis(input.videoId, summary);
    await this.statusPublisher.publish({
      videoId: input.videoId,
      userId: input.userId,
      status: VideoStatus.COMPLETED,
      progress: 100,
    });
  }
}
