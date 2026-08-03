import type { Request, Response } from "express";
import { SummaryLanguage, VideoStatus } from "@transcribemind/contracts";
import { DomainError } from "../../../../shared/kernel/domain-error.js";
import type { UploadVideoUseCase } from "../../application/upload-video.use-case.js";
import type { UploadVideoFromUrlUseCase } from "../../application/upload-video-from-url.use-case.js";
import type { GetVideoUseCase } from "../../application/get-video.use-case.js";
import type { ListVideosUseCase } from "../../application/list-videos.use-case.js";
import type { RetryVideoUseCase } from "../../application/retry-video.use-case.js";
import type { UpdateVideoTitleUseCase } from "../../application/update-video-title.use-case.js";
import type { DeleteVideoUseCase } from "../../application/delete-video.use-case.js";
import type { StreamVideoUseCase } from "../../application/stream-video.use-case.js";
import type { AskAboutVideoUseCase } from "../../application/ask-about-video.use-case.js";
import type { FreeUpVideoSpaceUseCase } from "../../application/free-up-video-space.use-case.js";
import type { ChatMessage } from "../../domain/ports/video-chat.port.js";

const VIDEO_STATUSES = new Set<string>(Object.values(VideoStatus));
const SUMMARY_LANGUAGES = new Set<string>(Object.values(SummaryLanguage));

function parseSummaryLanguage(value: unknown): SummaryLanguage | undefined {
  return typeof value === "string" && SUMMARY_LANGUAGES.has(value) ? (value as SummaryLanguage) : undefined;
}

function parseChatHistory(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is ChatMessage =>
      typeof entry === "object" &&
      entry !== null &&
      (entry.role === "user" || entry.role === "assistant") &&
      typeof entry.content === "string",
  );
}

export class VideosController {
  constructor(
    private readonly uploadVideoUseCase: UploadVideoUseCase,
    private readonly uploadVideoFromUrlUseCase: UploadVideoFromUrlUseCase,
    private readonly getVideoUseCase: GetVideoUseCase,
    private readonly listVideosUseCase: ListVideosUseCase,
    private readonly retryVideoUseCase: RetryVideoUseCase,
    private readonly updateVideoTitleUseCase: UpdateVideoTitleUseCase,
    private readonly deleteVideoUseCase: DeleteVideoUseCase,
    private readonly streamVideoUseCase: StreamVideoUseCase,
    private readonly askAboutVideoUseCase: AskAboutVideoUseCase,
    private readonly freeUpVideoSpaceUseCase: FreeUpVideoSpaceUseCase,
  ) {}

  upload = async (req: Request, res: Response): Promise<void> => {
    const file = req.file;
    if (!file) {
      throw new DomainError("No file provided", "VALIDATION_ERROR", 400);
    }

    const body = req.body as { summaryLanguage?: string; title?: string };
    const video = await this.uploadVideoUseCase.execute({
      userId: req.userId!,
      title: body.title,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      fileBuffer: file.buffer,
      summaryLanguage: parseSummaryLanguage(body.summaryLanguage),
    });

    // 202 Accepted: the client must poll GET /:id or listen on the socket
    // for the rest of the pipeline, processing happens asynchronously.
    res.status(202).json({ id: video.id, status: video.status });
  };

  uploadFromUrl = async (req: Request, res: Response): Promise<void> => {
    const { url, summaryLanguage, title } = req.body as { url?: string; summaryLanguage?: string; title?: string };
    if (!url || typeof url !== "string") {
      throw new DomainError("Se requiere una URL", "VALIDATION_ERROR", 400);
    }

    const video = await this.uploadVideoFromUrlUseCase.execute({
      userId: req.userId!,
      title,
      url,
      summaryLanguage: parseSummaryLanguage(summaryLanguage),
    });

    res.status(202).json({ id: video.id, status: video.status });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const video = await this.getVideoUseCase.execute({
      videoId: req.params.id!,
      requesterId: req.userId!,
    });

    res.status(200).json(video);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const statusParam = req.query.status as string | undefined;
    const status = statusParam && VIDEO_STATUSES.has(statusParam) ? (statusParam as VideoStatus) : undefined;
    const search = (req.query.search as string | undefined) || undefined;

    const videos = await this.listVideosUseCase.execute({
      userId: req.userId!,
      status,
      search,
    });

    res.status(200).json(videos);
  };

  retry = async (req: Request, res: Response): Promise<void> => {
    await this.retryVideoUseCase.execute({
      videoId: req.params.id!,
      requesterId: req.userId!,
    });

    res.status(202).json({ id: req.params.id, status: VideoStatus.QUEUED });
  };

  updateTitle = async (req: Request, res: Response): Promise<void> => {
    const { title } = req.body as { title?: string };
    if (typeof title !== "string") {
      throw new DomainError("Se requiere un título", "VALIDATION_ERROR", 400);
    }

    const video = await this.updateVideoTitleUseCase.execute({
      videoId: req.params.id!,
      requesterId: req.userId!,
      title,
    });

    res.status(200).json(video);
  };

  streamVideo = async (req: Request, res: Response): Promise<void> => {
    const range = req.headers.range;
    const object = await this.streamVideoUseCase.execute({
      videoId: req.params.id!,
      requesterId: req.userId!,
      range: typeof range === "string" ? range : undefined,
    });

    res.status(object.statusCode);
    res.setHeader("Content-Type", object.contentType);
    res.setHeader("Content-Length", object.contentLength);
    res.setHeader("Accept-Ranges", "bytes");
    if (object.contentRange) {
      res.setHeader("Content-Range", object.contentRange);
    }

    // Without this, an error on the S3 body stream (bad range, dropped
    // connection, etc.) is an unhandled 'error' event — Node treats that as
    // fatal and kills the whole process, not just this one request.
    object.body.on("error", () => {
      if (res.headersSent) {
        res.destroy();
      } else {
        res.sendStatus(500);
      }
    });
    object.body.pipe(res);
  };

  ask = async (req: Request, res: Response): Promise<void> => {
    const { question, history } = req.body as { question?: string; history?: unknown };
    if (typeof question !== "string") {
      throw new DomainError("Se requiere una pregunta", "VALIDATION_ERROR", 400);
    }

    const answer = await this.askAboutVideoUseCase.execute({
      videoId: req.params.id!,
      requesterId: req.userId!,
      question,
      history: parseChatHistory(history),
    });

    res.status(200).json({ answer });
  };

  freeUpSpace = async (req: Request, res: Response): Promise<void> => {
    await this.freeUpVideoSpaceUseCase.execute({
      videoId: req.params.id!,
      requesterId: req.userId!,
    });

    res.status(204).send();
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    await this.deleteVideoUseCase.execute({
      videoId: req.params.id!,
      requesterId: req.userId!,
    });

    res.status(204).send();
  };
}
