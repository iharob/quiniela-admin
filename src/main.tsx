import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { ColorModeProvider } from './colorMode'
import { SmallScreenGate } from './components/SmallScreenGate'
import { App } from './App'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* ColorModeProvider owns the theme (light/dark) + CssBaseline. */}
      <ColorModeProvider>
        <SmallScreenGate>
          {/* basename keeps every route under iaales.lat/admin. */}
          <BrowserRouter basename="/admin">
            <App />
          </BrowserRouter>
        </SmallScreenGate>
      </ColorModeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
