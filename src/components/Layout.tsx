import { useState } from 'react'
import {
  AppBar,
  Avatar,
  Box,
  Button,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tab,
  Tabs,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import SettingsIcon from '@mui/icons-material/Settings'
import TuneIcon from '@mui/icons-material/Tune'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { clearToken, getToken } from '../api/client'
import { useSession } from '../api/hooks'
import { useColorMode } from '../colorMode'
import { SettingsDialog } from './SettingsDialog'

const TABS = [
  { label: 'Resumen', path: '/dashboard' },
  { label: 'Usuarios', path: '/users' },
  { label: 'Partidos', path: '/games' },
  { label: 'Resultados', path: '/results' },
  { label: 'Pagos', path: '/payments' },
  { label: 'Métodos de pago', path: '/payment-methods' },
] as const

const ROLE_LABELS: Readonly<Record<string, string>> = {
  ADMINISTRATOR: 'Administrador',
}

function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role
}

// initials derives up to two letters from the name, falling back to the email.
function initials(name: string, email: string): string {
  const source = name.trim()
  if (source) {
    return source
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? '')
      .join('')
      .toUpperCase()
  }
  return (email[0] ?? '?').toUpperCase()
}

export function Layout(): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: session } = useSession(Boolean(getToken()))
  const { mode, toggle } = useColorMode()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Highlight the tab matching the current top-level section.
  const current = TABS.findIndex((t) => location.pathname.startsWith(t.path))

  const onLogout = (): void => {
    clearToken()
    navigate('/login', { replace: true })
  }

  const onToggleTheme = (): void => {
    toggle()
    setAnchorEl(null)
  }

  return (
    // Fill the viewport and let the content region (not the page) scroll, so
    // tables keep their headers/toolbars on screen.
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <AppBar
        position="static"
        sx={{ flexShrink: 0, ...(mode === 'dark' ? { bgcolor: '#1e57b5' } : {}) }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Quiniela · Administración
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {session && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  pl: 0.75,
                  pr: 1.5,
                  py: 0.5,
                  borderRadius: 999,
                  transition: 'background-color 150ms ease',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
                }}
              >
                <Avatar sx={{ width: 34, height: 34, bgcolor: 'secondary.main', fontSize: 14 }}>
                  {initials(session.name, session.email)}
                </Avatar>
                <Box sx={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {session.name || session.email}
                  </Typography>
                  {session.roles.length > 0 && (
                    <Typography variant="caption" sx={{ display: 'block', opacity: 0.85 }}>
                      {session.roles.map(roleLabel).join(', ')}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}

            <Tooltip title="Ajustes">
              <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
              <MenuItem onClick={onToggleTheme}>
                <ListItemIcon>
                  {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
                </ListItemIcon>
                <ListItemText>{mode === 'dark' ? 'Tema claro' : 'Tema oscuro'}</ListItemText>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setSettingsOpen(true)
                  setAnchorEl(null)
                }}
              >
                <ListItemIcon>
                  <TuneIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Ajustes</ListItemText>
              </MenuItem>
            </Menu>
            {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}

            <Button color="inherit" startIcon={<LogoutIcon />} onClick={onLogout}>
              Salir
            </Button>
          </Box>
        </Toolbar>
        <Tabs
          value={current === -1 ? false : current}
          textColor="inherit"
          indicatorColor="secondary"
          sx={{ bgcolor: mode === 'dark' ? '#163f86' : 'primary.dark' }}
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
