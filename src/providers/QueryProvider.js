import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Configure QueryClient with defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry failed requests
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Cache configuration
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      
      // Network mode
      networkMode: 'online',
      
      // Refetch configuration
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
      
      // Error handling
      useErrorBoundary: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      networkMode: 'online',
    },
  },
});

export { queryClient };

export default function QueryProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

