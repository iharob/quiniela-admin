import { useState } from 'react'
import { Alert, Box, Button, Link, Stack, TextField } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { api, extractError } from '../api/client'
import { AuthShell } from './AuthShell'

export function ForgotPasswordPage(): JSX.Element {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const { data } = await api.post<{ message: string }>('/admin/auth/forgot-password', { email })
      setMessage(data.message)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Recuperar contraseña">
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2}>
          {message && <Alert severity="success">{message}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Correo"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <Button type="submit" variant="contained" disabled={loading}>
            Enviar código
          </Button>
          <Link component={RouterLink} to="/reset-password" variant="body2">
            Ya tengo un código →
          </Link>
          <Link component={RouterLink} to="/login" variant="body2">
            Volver a iniciar sesión
          </Link>
        </Stack>
      </Box>
    </AuthShell>
  )
}
