import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client.js";
import type { Video } from "../../../shared/types/video.js";
import { VideoStatusValues } from "../../../shared/types/video.js";

export function useVideoQuery(videoId: string) {
  return useQuery({
    queryKey: ["video", videoId],
    queryFn: async () => {
      const { data } = await apiClient.get<Video>(`/api/videos/${videoId}`);
      return data;
    },
    // While the pipeline is still running, the socket bridge patches this
    // cache entry in real time; this refetch is just a safety net in case a
    // socket event was missed (e.g. brief disconnect).
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      const isTerminal = status === VideoStatusValues.COMPLETED || status === VideoStatusValues.FAILED;
      return isTerminal ? false : 5_000;
    },
  });
}
