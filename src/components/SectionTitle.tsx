import { Typography } from '@mui/material'
import type { ReactNode } from 'react'

// SectionTitle is the small, uppercase header used at the top of each page.
export function SectionTitle({ children }: { readonly children: ReactNode }): JSX.Element {
  return (
    <Typography
      variant="subtitle2"
      sx={{
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontWeight: 700,
        color: 'text.secondary',
        flexShrink: 0,
      }}
    >
      {children}
    </Typography>
  )
}
