import {
  AppBar,
  Box,
  Button,
  Container,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { clearToken, getToken } from '../api/client'
import { useSession } from '../api/hooks'

const TABS = [
  { label: 'Usuarios', path: '/users' },
  { label: 'Partidos', path: '/games' },
  { label: 'Métodos de pago', path: '/payment-methods' },
]

export function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: session } = useSession(Boolean(getToken()))

  // Highlight the tab matching the current top-level section.
  const current = TABS.findIndex((t) => location.pathname.startsWith(t.path))

  const onLogout = () => {
    clearToken()
    navigate('/login', { replace: true })
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Quiniela · Administración
          </Typography>
          {session && (
            <Typography variant="body2" sx={{ mr: 2 }}>
              {session.name || session.email}
            </Typography>
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
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Outlet />
      </Container>
    </Box>
  )
}
