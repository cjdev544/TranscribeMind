import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client.js";
import type { Video } from "../../../shared/types/video.js";

export function useUpdateVideoTitle(videoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title: string) => {
      const { data } = await apiClient.patch<Video>(`/api/videos/${videoId}/title`, { title });
      return data;
    },
    onSuccess: (video) => {
      queryClient.setQueryData(["video", videoId], video);
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}
