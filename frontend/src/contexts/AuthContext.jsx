import { createContext, useContext, useState, useCallback } from 'react'
import api, { setAccessToken } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    setAccessToken(data.access_token)
    const me = await api.get('/auth/me')
    setUser(me.data)
  }, [])

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout') } catch {}
    setAccessToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
