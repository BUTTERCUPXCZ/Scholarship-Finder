// Ensure fix runs before any libraries that may access React's hooks at module init time.
import "./fixUseLayoutEffect.ts"
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'



// Optimized QueryClient configuration for better performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 10 minutes by default to reduce API calls
      staleTime: 1000 * 60 * 10,
      // Keep cached data for 30 minutes after last use
      gcTime: 1000 * 60 * 30,
      // Reduce retries to prevent excessive loading
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      // Don't refetch on window focus by default
      refetchOnWindowFocus: false,
      // Don't auto-refetch on reconnect to prevent loading loops
      refetchOnReconnect: false,
      // Disable background refetching by default
      refetchInterval: false,
      // Network mode: online only by default
      networkMode: 'online',
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      // Network mode for mutations
      networkMode: 'online',
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
