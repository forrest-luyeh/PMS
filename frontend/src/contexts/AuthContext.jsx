import { createContext, useContext, useState, useCallback } from 'react'
import api, { setAccessToken } from '../lib/api'

const AuthContext = createContext(null)

/** Decode JWT payload without verifying signature (client-side only). */
function decodeToken(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return {}
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [hotelCtx, setHotelCtx] = useState(null)   // { hotel_id, brand_id, tenant_id }

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    const claims = decodeToken(data.access_token)
    setAccessToken(data.access_token, claims.hotel_id)
    setHotelCtx({ hotel_id: claims.hotel_id, brand_id: claims.brand_id, tenant_id: claims.tenant_id })
    const me = await api.get('/auth/me')
    setUser(me.data)
  }, [])

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout') } catch {}
    setAccessToken(null, null)
    setUser(null)
    setHotelCtx(null)
  }, [])

  /** Switch hotel context (for TENANT_ADMIN / BRAND_ADMIN). */
  const switchHotel = useCallback(async (hotelId) => {
    const { data } = await api.post(`/admin/switch-hotel?hotel_id=${hotelId}`)
    const claims = decodeToken(data.access_token)
    setAccessToken(data.access_token, claims.hotel_id)
    setHotelCtx({ hotel_id: claims.hotel_id, brand_id: claims.brand_id, tenant_id: claims.tenant_id })
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, switchHotel, hotelCtx }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
