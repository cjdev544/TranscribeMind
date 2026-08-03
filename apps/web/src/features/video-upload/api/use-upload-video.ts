import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SummaryLanguage } from "@transcribemind/contracts";
import { apiClient } from "../../../shared/lib/api-client.js";

export interface UploadVideoResult {
  id: string;
  status: string;
}

export interface UploadVideoInput {
  file: File;
  title?: string;
  summaryLanguage: SummaryLanguage;
}

export function useUploadVideo(onProgress: (percent: number) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, title, summaryLanguage }: UploadVideoInput) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("summaryLanguage", summaryLanguage);
      if (title?.trim()) {
        formData.append("title", title.trim());
      }

      const { data } = await apiClient.post<UploadVideoResult>("/api/videos/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (event.total) {
            onProgress(Math.round((event.loaded / event.total) * 100));
          }
        },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}
