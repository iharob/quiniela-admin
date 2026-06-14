import { createTheme, type Theme } from '@mui/material/styles'
import type { PaletteMode } from '@mui/material'

// createAppTheme builds the light or dark theme. Light keeps the original
// black primary / blue accent; dark promotes the blue to primary (a black
// primary is unreadable on a dark surface) and uses MUI's dark backgrounds.
export function createAppTheme(mode: PaletteMode): Theme {
  const isDark = mode === 'dark'
  return createTheme({
    palette: {
      mode,
      primary: { main: isDark ? '#2979ff' : '#000000', contrastText: '#ffffff' },
      secondary: { main: isDark ? '#82b1ff' : '#2979ff' },
    },
    shape: { borderRadius: 8 },
  })
}
