import { describe, expect, it, vi } from "vitest";
import { SummaryLanguage, VideoStatus } from "@transcribemind/contracts";
import { VideosController } from "./videos.controller.js";
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
import { mockRequest, mockResponse } from "../../../../test/mockHttp.js";
import { makeVideo } from "../../../../test/mockVideoPorts.js";

function useCaseMock<T>(result: T) {
  return { execute: vi.fn().mockResolvedValue(result) };
}

function buildController(overrides: Record<string, unknown> = {}) {
  return new VideosController(
    (overrides.upload ?? useCaseMock(makeVideo())) as unknown as UploadVideoUseCase,
    (overrides.uploadFromUrl ?? useCaseMock(makeVideo())) as unknown as UploadVideoFromUrlUseCase,
    (overrides.getById ?? useCaseMock(makeVideo())) as unknown as GetVideoUseCase,
    (overrides.list ?? useCaseMock([])) as unknown as ListVideosUseCase,
    (overrides.retry ?? useCaseMock(undefined)) as unknown as RetryVideoUseCase,
    (overrides.updateTitle ?? useCaseMock(makeVideo())) as unknown as UpdateVideoTitleUseCase,
    (overrides.remove ?? useCaseMock(undefined)) as unknown as DeleteVideoUseCase,
    (overrides.stream ?? useCaseMock({ body: { on: vi.fn(), pipe: vi.fn() }, contentType: "video/mp4", contentLength: 10, statusCode: 200 })) as unknown as StreamVideoUseCase,
    (overrides.ask ?? useCaseMock("respuesta")) as unknown as AskAboutVideoUseCase,
    (overrides.freeUpSpace ?? useCaseMock(undefined)) as unknown as FreeUpVideoSpaceUseCase,
  );
}

describe("VideosController", () => {
  it("upload rejects when no file is present", async () => {
    const controller = buildController();
    const req = mockRequest({ userId: "u1", body: {} });

    await expect(controller.upload(req, mockResponse())).rejects.toThrow("No file provided");
  });

  it("upload passes the file fields through and returns 202", async () => {
    const upload = useCaseMock(makeVideo({ id: "v1", status: VideoStatus.QUEUED }));
    const controller = buildController({ upload });
    const req = mockRequest({
      userId: "u1",
      file: { originalname: "clip.mp4", mimetype: "video/mp4", buffer: Buffer.from("x") } as never,
      body: { title: "Mi video", summaryLanguage: "en" },
    });
    const res = mockResponse();

    await controller.upload(req, res);

    expect(upload.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u1", title: "Mi video", originalFilename: "clip.mp4", summaryLanguage: SummaryLanguage.EN })
    );
    expect(res.status).toHaveBeenCalledWith(202);
  });

  it("uploadFromUrl rejects a missing url", async () => {
    const controller = buildController();
    const req = mockRequest({ userId: "u1", body: {} });

    await expect(controller.uploadFromUrl(req, mockResponse())).rejects.toThrow("Se requiere una URL");
  });

  it("uploadFromUrl delegates to the use case and returns 202", async () => {
    const uploadFromUrl = useCaseMock(makeVideo());
    const controller = buildController({ uploadFromUrl });
    const req = mockRequest({ userId: "u1", body: { url: "https://example.com/v" } });
    const res = mockResponse();

    await controller.uploadFromUrl(req, res);

    expect(uploadFromUrl.execute).toHaveBeenCalledWith(expect.objectContaining({ userId: "u1", url: "https://example.com/v" }));
    expect(res.status).toHaveBeenCalledWith(202);
  });

  it("getById returns the video from the use case", async () => {
    const video = makeVideo({ id: "v1" });
    const controller = buildController({ getById: useCaseMock(video) });
    const req = mockRequest({ userId: "u1", params: { id: "v1" } });
    const res = mockResponse();

    await controller.getById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(video);
  });

  it("list ignores an unrecognized status query param", async () => {
    const list = useCaseMock([]);
    const controller = buildController({ list });
    const req = mockRequest({ userId: "u1", query: { status: "NOT_A_STATUS" } });

    await controller.list(req, mockResponse());

    expect(list.execute).toHaveBeenCalledWith({ userId: "u1", status: undefined, search: undefined });
  });

  it("list forwards a recognized status and search term", async () => {
    const list = useCaseMock([]);
    const controller = buildController({ list });
    const req = mockRequest({ userId: "u1", query: { status: "COMPLETED", search: "clip" } });

    await controller.list(req, mockResponse());

    expect(list.execute).toHaveBeenCalledWith({ userId: "u1", status: VideoStatus.COMPLETED, search: "clip" });
  });

  it("retry returns 202 with QUEUED status", async () => {
    const controller = buildController();
    const req = mockRequest({ userId: "u1", params: { id: "v1" } });
    const res = mockResponse();

    await controller.retry(req, res);

    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({ id: "v1", status: VideoStatus.QUEUED });
  });

  it("updateTitle rejects a non-string title", async () => {
    const controller = buildController();
    const req = mockRequest({ userId: "u1", params: { id: "v1" }, body: {} });

    await expect(controller.updateTitle(req, mockResponse())).rejects.toThrow("Se requiere un título");
  });

  it("ask rejects a non-string question", async () => {
    const controller = buildController();
    const req = mockRequest({ userId: "u1", params: { id: "v1" }, body: {} });

    await expect(controller.ask(req, mockResponse())).rejects.toThrow("Se requiere una pregunta");
  });

  it("ask returns the answer wrapped in an object", async () => {
    const controller = buildController({ ask: useCaseMock("42") });
    const req = mockRequest({ userId: "u1", params: { id: "v1" }, body: { question: "hola" } });
    const res = mockResponse();

    await controller.ask(req, res);

    expect(res.json).toHaveBeenCalledWith({ answer: "42" });
  });

  it("freeUpSpace returns 204", async () => {
    const controller = buildController();
    const req = mockRequest({ userId: "u1", params: { id: "v1" } });
    const res = mockResponse();

    await controller.freeUpSpace(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
  });

  it("remove returns 204", async () => {
    const controller = buildController();
    const req = mockRequest({ userId: "u1", params: { id: "v1" } });
    const res = mockResponse();

    await controller.remove(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
  });

  it("streamVideo sets the streaming headers and pipes the body", async () => {
    const pipe = vi.fn();
    const on = vi.fn();
    const stream = useCaseMock({ body: { on, pipe }, contentType: "video/mp4", contentLength: 10, statusCode: 206, contentRange: "bytes 0-9/10" });
    const controller = buildController({ stream });
    const req = mockRequest({ userId: "u1", params: { id: "v1" }, headers: { range: "bytes=0-9" } });
    const res = mockResponse();

    await controller.streamVideo(req, res);

    expect(res.status).toHaveBeenCalledWith(206);
    expect(res.setHeader).toHaveBeenCalledWith("Content-Range", "bytes 0-9/10");
    expect(pipe).toHaveBeenCalledWith(res);
  });
});
