import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import type { PaletteMode } from '@mui/material'
import { createAppTheme } from './theme'

const STORAGE_KEY = 'quiniela_admin_theme'

interface ColorModeContextValue {
  readonly mode: PaletteMode
  readonly toggle: () => void
}

const ColorModeContext = createContext<ColorModeContextValue>({
  mode: 'light',
  toggle: () => {},
})

export function useColorMode(): ColorModeContextValue {
  return useContext(ColorModeContext)
}

function initialMode(): PaletteMode {
  return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
}

// ColorModeProvider owns the theme: it tracks the light/dark mode (persisted in
// localStorage), exposes a toggle, and renders ThemeProvider + CssBaseline so
// the whole app re-themes when the mode flips.
export function ColorModeProvider({ children }: { readonly children: ReactNode }): JSX.Element {
  const [mode, setMode] = useState<PaletteMode>(initialMode)

  const value = useMemo<ColorModeContextValue>(
    () => ({
      mode,
      toggle: (): void =>
        setMode((prev) => {
          const next: PaletteMode = prev === 'dark' ? 'light' : 'dark'
          localStorage.setItem(STORAGE_KEY, next)
          return next
        }),
    }),
    [mode],
  )

  const theme = useMemo(() => createAppTheme(mode), [mode])

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}
