import { Box, Typography, useMediaQuery, useTheme } from '@mui/material'
import type { ReactNode } from 'react'

// SmallScreenGate blocks the (table-dense) admin app on narrow viewports,
// showing a message instead. The breakpoint is `md` (< 900px).
export function SmallScreenGate({ children }: { readonly children: ReactNode }): JSX.Element {
  const theme = useTheme()
  const tooSmall = useMediaQuery(theme.breakpoints.down('md'))

  if (tooSmall) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          p: 4,
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Esta aplicación no se puede visualizar en pantallas pequeñas.
        </Typography>
      </Box>
    )
  }

  return <>{children}</>
}
