import { describe, expect, it, vi } from "vitest";
import { VideoStatus } from "@transcribemind/contracts";
import { ListVideosUseCase } from "./list-videos.use-case.js";
import { mockVideoRepository, makeVideo } from "../../../test/mockVideoPorts.js";

describe("ListVideosUseCase", () => {
  it("delegates to the repository with the given filter", async () => {
    const videos = [makeVideo({ id: "v1" })];
    const videoRepository = mockVideoRepository({ listByUser: vi.fn().mockResolvedValue(videos) });
    const useCase = new ListVideosUseCase(videoRepository);

    const result = await useCase.execute({ userId: "u1", status: VideoStatus.COMPLETED, search: "clip" });

    expect(videoRepository.listByUser).toHaveBeenCalledWith({ userId: "u1", status: VideoStatus.COMPLETED, search: "clip" });
    expect(result).toBe(videos);
  });
});
