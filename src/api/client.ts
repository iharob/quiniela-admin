import axios from 'axios'

const TOKEN_KEY = 'quiniela_admin_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export const api = axios.create({ baseURL })

// Attach the admin bearer token to every request.
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401/403 the session is invalid or lacks admin rights: drop the token and
// bounce to the login screen. The auth endpoints themselves are exempt so a
// failed login shows its own error instead of a redirect loop.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const url: string = error?.config?.url ?? ''
    const isAuthCall = url.includes('/admin/auth/')
    if ((status === 401 || status === 403) && !isAuthCall) {
      clearToken()
      if (window.location.pathname !== '/admin/login') {
        window.location.assign('/admin/login')
      }
    }
    return Promise.reject(error)
  },
)

// extractError pulls the API's { message } error body, falling back to the
// axios message.
export function extractError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? error.message
  }
  return error instanceof Error ? error.message : 'Error desconocido'
}
