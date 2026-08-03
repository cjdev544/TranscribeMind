import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SummaryLanguage } from "@transcribemind/contracts";
import { apiClient } from "../../../shared/lib/api-client.js";
import type { UploadVideoResult } from "./use-upload-video.js";

export interface UploadVideoFromUrlInput {
  url: string;
  title?: string;
  summaryLanguage: SummaryLanguage;
}

export function useUploadVideoFromUrl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ url, title, summaryLanguage }: UploadVideoFromUrlInput) => {
      const { data } = await apiClient.post<UploadVideoResult>("/api/videos/upload-url", {
        url,
        summaryLanguage,
        title: title?.trim() || undefined,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}
