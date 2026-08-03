import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client.js";

export function useRetryVideo(videoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.post(`/api/videos/${videoId}/retry`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video", videoId] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}
