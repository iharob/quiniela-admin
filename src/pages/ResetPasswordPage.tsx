import { useState } from 'react'
import { Alert, Box, Button, Link, Stack, TextField } from '@mui/material'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { api, extractError, setToken } from '../api/client'
import { AuthShell } from './AuthShell'

export function ResetPasswordPage(): JSX.Element {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post<{ token: string }>('/admin/auth/reset-password', {
        email,
        code,
        new_password: newPassword,
      })
      setToken(data.token)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Establecer nueva contraseña">
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Correo"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <TextField label="Código" value={code} onChange={(e) => setCode(e.target.value)} required />
          <TextField
            label="Nueva contraseña"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            helperText="Mínimo 8 caracteres"
          />
          <Button type="submit" variant="contained" disabled={loading}>
            Guardar y entrar
          </Button>
          <Link component={RouterLink} to="/login" variant="body2">
            Volver a iniciar sesión
          </Link>
        </Stack>
      </Box>
    </AuthShell>
  )
}
