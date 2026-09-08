import { describe, expect, it, vi } from "vitest";
import { AskAboutVideoUseCase } from "./ask-about-video.use-case.js";
import { mockVideoRepository, mockVideoChat, makeVideo } from "../../../test/mockVideoPorts.js";

const transcribedVideo = makeVideo({
  id: "v1",
  userId: "u1",
  transcriptSegments: [{ start: 0, end: 2, text: "hola" }],
});

describe("AskAboutVideoUseCase", () => {
  it("asks the video-chat port with the trimmed question and transcript segments", async () => {
    const videoRepository = mockVideoRepository({ findById: vi.fn().mockResolvedValue(transcribedVideo) });
    const videoChat = mockVideoChat({ ask: vi.fn().mockResolvedValue("respuesta") });
    const useCase = new AskAboutVideoUseCase(videoRepository, videoChat);

    const result = await useCase.execute({ videoId: "v1", requesterId: "u1", question: "  De que trata?  " });

    expect(videoChat.ask).toHaveBeenCalledWith(
      expect.objectContaining({ question: "De que trata?", segments: transcribedVideo.transcriptSegments })
    );
    expect(result).toBe("respuesta");
  });

  it("caps the replayed history to the most recent 20 messages", async () => {
    const videoRepository = mockVideoRepository({ findById: vi.fn().mockResolvedValue(transcribedVideo) });
    const videoChat = mockVideoChat();
    const useCase = new AskAboutVideoUseCase(videoRepository, videoChat);
    const history = Array.from({ length: 25 }, (_, i) => ({ role: "user" as const, content: `msg${i}` }));

    await useCase.execute({ videoId: "v1", requesterId: "u1", question: "hola", history });

    const sentHistory = vi.mocked(videoChat.ask).mock.calls[0]![0].history;
    expect(sentHistory).toHaveLength(20);
    expect(sentHistory[0]!.content).toBe("msg5");
  });

  it("throws NotFoundError when the video does not exist", async () => {
    const useCase = new AskAboutVideoUseCase(mockVideoRepository(), mockVideoChat());

    await expect(useCase.execute({ videoId: "missing", requesterId: "u1", question: "hola" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("throws UnauthorizedError for another user's video", async () => {
    const video = makeVideo({ id: "v1", userId: "owner" });
    const videoRepository = mockVideoRepository({ findById: vi.fn().mockResolvedValue(video) });
    const useCase = new AskAboutVideoUseCase(videoRepository, mockVideoChat());

    await expect(useCase.execute({ videoId: "v1", requesterId: "stranger", question: "hola" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("rejects an empty question", async () => {
    const videoRepository = mockVideoRepository({ findById: vi.fn().mockResolvedValue(transcribedVideo) });
    const useCase = new AskAboutVideoUseCase(videoRepository, mockVideoChat());

    await expect(useCase.execute({ videoId: "v1", requesterId: "u1", question: "   " })).rejects.toThrow(
      "La pregunta no puede estar vacía"
    );
  });

  it("rejects a question over the max length", async () => {
    const videoRepository = mockVideoRepository({ findById: vi.fn().mockResolvedValue(transcribedVideo) });
    const useCase = new AskAboutVideoUseCase(videoRepository, mockVideoChat());

    await expect(useCase.execute({ videoId: "v1", requesterId: "u1", question: "a".repeat(1001) })).rejects.toThrow(
      /no puede superar los 1000 caracteres/
    );
  });

  it("rejects when the video has no transcript yet", async () => {
    const video = makeVideo({ id: "v1", userId: "u1", transcriptSegments: null });
    const videoRepository = mockVideoRepository({ findById: vi.fn().mockResolvedValue(video) });
    const useCase = new AskAboutVideoUseCase(videoRepository, mockVideoChat());

    await expect(useCase.execute({ videoId: "v1", requesterId: "u1", question: "hola" })).rejects.toThrow(
      "Este video todavía no tiene una transcripción disponible"
    );
  });
});
