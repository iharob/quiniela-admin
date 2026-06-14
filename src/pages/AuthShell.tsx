import { Box, Card, CardContent, Typography } from '@mui/material'
import type { ReactNode } from 'react'

// AuthShell is the centered card used by every unauthenticated page.
export function AuthShell({
  title,
  children,
}: {
  readonly title: string
  readonly children: ReactNode
}): JSX.Element {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            {title}
          </Typography>
          {children}
        </CardContent>
      </Card>
    </Box>
  )
}
