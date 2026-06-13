import { Navigate, useLocation } from 'react-router-dom'
import { getToken } from '../api/client'
import type { ReactNode } from 'react'

// RequireAuth blocks rendering of protected routes when no admin token is
// present. Token validity (and the ADMINISTRATOR role) is enforced server-side;
// the axios interceptor bounces back to /login if the token is rejected.
export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation()
  if (!getToken()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}
