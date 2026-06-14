import { AppBar, Box, Button, Tab, Tabs, Toolbar, Typography } from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { clearToken, getToken } from '../api/client'
import { useSession } from '../api/hooks'

const TABS = [
  { label: 'Usuarios', path: '/users' },
  { label: 'Partidos', path: '/games' },
  { label: 'Métodos de pago', path: '/payment-methods' },
] as const

const ROLE_LABELS: Readonly<Record<string, string>> = {
  ADMINISTRATOR: 'Administrador',
}

function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role
}

export function Layout(): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: session } = useSession(Boolean(getToken()))

  // Highlight the tab matching the current top-level section.
  const current = TABS.findIndex((t) => location.pathname.startsWith(t.path))

  const onLogout = (): void => {
    clearToken()
    navigate('/login', { replace: true })
  }

  return (
    // Fill the viewport and let the content region (not the page) scroll, so
    // tables keep their headers/toolbars on screen.
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'grey.50' }}>
      <AppBar position="static" sx={{ flexShrink: 0 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Quiniela · Administración
          </Typography>
          {session && (
            <Box sx={{ mr: 2, textAlign: 'right', lineHeight: 1.2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {session.name || session.email}
              </Typography>
              {session.roles.length > 0 && (
                <Typography variant="caption" sx={{ display: 'block', opacity: 0.85 }}>
                  {session.roles.map(roleLabel).join(', ')}
                </Typography>
              )}
            </Box>
          )}
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={onLogout}>
            Salir
          </Button>
        </Toolbar>
        <Tabs
          value={current === -1 ? false : current}
          textColor="inherit"
          indicatorColor="secondary"
          sx={{ bgcolor: 'primary.dark' }}
        >
          {TABS.map((t) => (
            <Tab key={t.path} label={t.label} onClick={() => navigate(t.path)} />
          ))}
        </Tabs>
      </AppBar>
      <Box
        component="main"
        sx={{ flex: 1, minHeight: 0, p: 3, display: 'flex', flexDirection: 'column' }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}
