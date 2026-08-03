import { prisma } from "@transcribemind/database";
import { VideoStatus } from "@transcribemind/contracts";
import type { VideoRepositoryPort } from "../../domain/ports/video-repository.port.js";
import type { Summary } from "../../domain/summary.entity.js";

export class PrismaVideoRepository implements VideoRepositoryPort {
  async saveAnalysis(videoId: string, analysis: Summary): Promise<void> {
    await prisma.video.update({
      where: { id: videoId },
      data: { analysis, status: VideoStatus.COMPLETED, progress: 100, completedAt: new Date() },
    });
  }

  async markFailed(videoId: string, error: string): Promise<void> {
    await prisma.video.update({
      where: { id: videoId },
      data: { status: VideoStatus.FAILED, error },
    });
  }
}
