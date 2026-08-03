import { DomainError, NotFoundError, UnauthorizedError } from "../../../shared/kernel/domain-error.js";
import type { VideoRepositoryPort } from "../domain/ports/video-repository.port.js";
import type { ChatMessage, VideoChatPort } from "../domain/ports/video-chat.port.js";

const MAX_QUESTION_LENGTH = 1000;
// Bounds how much history a single request replays to the model — the chat
// is ephemeral (client-held, not persisted), so this is the only cap on
// context size/cost for a long-running conversation.
const MAX_HISTORY_MESSAGES = 20;

export interface AskAboutVideoInput {
  videoId: string;
  requesterId: string;
  question: string;
  history?: ChatMessage[];
}

export class AskAboutVideoUseCase {
  constructor(
    private readonly videoRepository: VideoRepositoryPort,
    private readonly videoChat: VideoChatPort,
  ) {}

  async execute(input: AskAboutVideoInput): Promise<string> {
    const video = await this.videoRepository.findById(input.videoId);
    if (!video) {
      throw new NotFoundError("Video not found");
    }
    if (video.userId !== input.requesterId) {
      throw new UnauthorizedError("You do not have access to this video");
    }

    const question = input.question.trim();
    if (!question) {
      throw new DomainError("La pregunta no puede estar vacía", "VALIDATION_ERROR", 400);
    }
    if (question.length > MAX_QUESTION_LENGTH) {
      throw new DomainError(`La pregunta no puede superar los ${MAX_QUESTION_LENGTH} caracteres`, "VALIDATION_ERROR", 400);
    }

    if (!video.transcriptSegments || video.transcriptSegments.length === 0) {
      throw new DomainError("Este video todavía no tiene una transcripción disponible", "VALIDATION_ERROR", 400);
    }

    return this.videoChat.ask({
      segments: video.transcriptSegments,
      language: video.summaryLanguage,
      question,
      history: (input.history ?? []).slice(-MAX_HISTORY_MESSAGES),
    });
  }
}
