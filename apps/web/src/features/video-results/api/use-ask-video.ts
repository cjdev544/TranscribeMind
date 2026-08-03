import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client.js";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function useAskVideo(videoId: string) {
  return useMutation({
    mutationFn: async ({ question, history }: { question: string; history: ChatMessage[] }) => {
      const { data } = await apiClient.post<{ answer: string }>(`/api/videos/${videoId}/ask`, {
        question,
        history,
      });
      return data.answer;
    },
  });
}
