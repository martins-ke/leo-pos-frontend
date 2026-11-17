import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 10_000,
    },
  },
});

/**
 * Invalidates cached dashboard summaries, recent sales, and product stock levels.
 * Call this after creating sales, adjusting stock, or recording expenses.
 */
export function invalidateDashboardData() {
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  queryClient.invalidateQueries({ queryKey: ['sales'] });
  queryClient.invalidateQueries({ queryKey: ['products'] });
}
