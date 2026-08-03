import { prisma, VideoStatus as PrismaVideoStatus } from "@transcribemind/database";
import type { SummaryLanguage } from "@transcribemind/contracts";
import type { ListVideosFilter, VideoRepositoryPort } from "../../domain/ports/video-repository.port.js";
import type { Video } from "../../domain/video.entity.js";

export class PrismaVideoRepository implements VideoRepositoryPort {
  async create(input: {
    userId: string;
    title?: string | null;
    originalFilename: string;
    s3Key: string;
    summaryLanguage: SummaryLanguage;
  }): Promise<Video> {
    return prisma.video.create({
      data: {
        userId: input.userId,
        title: input.title ?? null,
        originalFilename: input.originalFilename,
        s3Key: input.s3Key,
        summaryLanguage: input.summaryLanguage,
      },
    }) as Promise<Video>;
  }

  async findById(id: string): Promise<Video | null> {
    return prisma.video.findUnique({ where: { id } }) as Promise<Video | null>;
  }

  async listByUser(filter: ListVideosFilter): Promise<Video[]> {
    return prisma.video.findMany({
      where: {
        userId: filter.userId,
        status: filter.status as PrismaVideoStatus | undefined,
        OR: filter.search
          ? [
              { title: { contains: filter.search, mode: "insensitive" } },
              { originalFilename: { contains: filter.search, mode: "insensitive" } },
            ]
          : undefined,
      },
      orderBy: { createdAt: "desc" },
    }) as Promise<Video[]>;
  }

  async resetForRetry(id: string): Promise<void> {
    await prisma.video.update({
      where: { id },
      data: { status: PrismaVideoStatus.QUEUED, progress: 0, error: null },
    });
  }

  async updateTitle(id: string, title: string | null): Promise<void> {
    await prisma.video.update({ where: { id }, data: { title } });
  }

  async delete(id: string): Promise<void> {
    await prisma.video.delete({ where: { id } });
  }

  async finalizeUpload(id: string, input: { originalFilename: string; s3Key: string }): Promise<Video> {
    return prisma.video.update({
      where: { id },
      data: { originalFilename: input.originalFilename, s3Key: input.s3Key },
    }) as Promise<Video>;
  }

  async markFailed(id: string, error: string): Promise<void> {
    await prisma.video.update({
      where: { id },
      data: { status: PrismaVideoStatus.FAILED, error },
    });
  }

  async markFileDeleted(id: string): Promise<void> {
    await prisma.video.update({ where: { id }, data: { fileDeletedAt: new Date() } });
  }

  async listCompletedBefore(cutoff: Date): Promise<Video[]> {
    return prisma.video.findMany({
      where: { status: PrismaVideoStatus.COMPLETED, fileDeletedAt: null, completedAt: { lt: cutoff } },
    }) as Promise<Video[]>;
  }
}
