import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    // No gcTime override: setQueryData-only entries (never observed by a
    // useQuery) would otherwise be garbage-collected almost immediately,
    // vanishing from the cache before a test can assert on them.
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function createWrapper(queryClient: QueryClient = createQueryClient()) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}
