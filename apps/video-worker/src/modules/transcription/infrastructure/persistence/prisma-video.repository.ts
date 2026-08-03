import { prisma } from "@transcribemind/database";
import { VideoStatus, type TranscriptSegment } from "@transcribemind/contracts";
import type { VideoRecord, VideoStatusRepositoryPort } from "../../domain/ports/video-status-repository.port.js";

export class PrismaVideoRepository implements VideoStatusRepositoryPort {
  async findById(videoId: string): Promise<VideoRecord | null> {
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) return null;
    return { id: video.id, userId: video.userId, s3Key: video.s3Key, status: video.status as VideoStatus };
  }

  async updateStatus(videoId: string, status: VideoStatus, progress: number): Promise<void> {
    await prisma.video.update({ where: { id: videoId }, data: { status, progress } });
  }

  async saveDuration(videoId: string, durationSeconds: number): Promise<void> {
    await prisma.video.update({ where: { id: videoId }, data: { durationSeconds } });
  }

  async saveTranscript(videoId: string, transcript: string, segments: TranscriptSegment[]): Promise<void> {
    await prisma.video.update({
      where: { id: videoId },
      data: { transcript, transcriptSegments: segments },
    });
  }

  async markFailed(videoId: string, error: string): Promise<void> {
    await prisma.video.update({
      where: { id: videoId },
      data: { status: VideoStatus.FAILED, error },
    });
  }
}
