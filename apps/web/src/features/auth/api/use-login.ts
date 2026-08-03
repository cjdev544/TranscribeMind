import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client.js";
import type { CurrentUser } from "./use-me.js";

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const { data } = await apiClient.post<CurrentUser>("/api/auth/login", input);
      return data;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "me"], user);
    },
  });
}
