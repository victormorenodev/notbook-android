import { QueryClient } from '@tanstack/react-query';

/**
 * Shared React Query client tuned for local-first SQLite operations.
 *
 * Configuration Rationale:
 * - staleTime (Infinity): Local DB data only changes on local mutations, preventing redundant queries.
 * - gcTime (1 hour): Keeps notes in memory for instant transitions between screens with zero flash.
 * - retry (false): Local disk errors are deterministic (not network blips); fail immediately.
 * - refetchOnWindowFocus (false): Saves mobile battery by avoiding DB re-queries on app focus.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: 1000 * 60 * 60,
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});
