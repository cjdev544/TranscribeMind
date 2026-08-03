import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client.js";
import type { Video, VideoStatus } from "../../../shared/types/video.js";

export interface VideosFilter {
  status?: VideoStatus;
  search?: string;
}

export function useVideosQuery(filter: VideosFilter) {
  return useQuery({
    queryKey: ["videos", filter],
    queryFn: async () => {
      const { data } = await apiClient.get<Video[]>("/api/videos", { params: filter });
      return data;
    },
    refetchInterval: 15_000,
  });
}
