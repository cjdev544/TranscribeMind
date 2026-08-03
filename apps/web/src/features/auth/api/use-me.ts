import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client.js";

export interface CurrentUser {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
}

export function useMe() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const { data } = await apiClient.get<CurrentUser>("/api/auth/me");
      return data;
    },
    retry: false,
  });
}
