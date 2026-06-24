import { useEffect, useRef, useState } from 'react'
import { Alert, Box, Button, CircularProgress, Stack } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import DownloadIcon from '@mui/icons-material/Download'
import { api, extractError } from '../api/client'
import { SectionTitle } from '../components/SectionTitle'

// ResultsPdfPage renders the real-results tournament PDF served by the
// backend at GET /admin/results/pdf. The PDF is regenerated from the live
// games table on every request, so "Actualizar" always shows the latest
// scores, standings, and provisional bracket. We fetch it as a blob (so the
// bearer token is attached by the axios interceptor) and display it inline
// in an iframe via an object URL.
export function ResultsPdfPage(): JSX.Element {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // Hold the live object URL in a ref so cleanup can revoke it without the
  // effect depending on (and re-running for) every URL change.
  const urlRef = useRef('')

  const setObjectUrl = (next: string): void => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = next
    setUrl(next)
  }

  const load = async (): Promise<void> => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/admin/results/pdf', { responseType: 'blob' })
      setObjectUrl(URL.createObjectURL(res.data as Blob))
    } catch (err) {
      setError(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    return () => setObjectUrl('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onDownload = (): void => {
    if (!url) return
    const link = document.createElement('a')
    link.href = url
    link.download = 'resultados.pdf'
    link.click()
  }

  return (
    <Stack spacing={2} sx={{ height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <SectionTitle>Resultados (PDF)</SectionTitle>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<RefreshIcon />} onClick={() => void load()} disabled={loading}>
            Actualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={onDownload}
            disabled={!url}
          >
            Descargar
          </Button>
        </Stack>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {loading && !url ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : url ? (
        <Box
          component="iframe"
          title="Resultados"
          src={url}
          sx={{ flex: 1, minHeight: 0, width: '100%', border: 0, borderRadius: 1, bgcolor: 'background.paper' }}
        />
      ) : null}
    </Stack>
  )
}
