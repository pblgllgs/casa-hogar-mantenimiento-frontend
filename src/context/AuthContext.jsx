import { createContext, useContext, useState, useEffect } from 'react'
import * as authApi from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (data) => {
    const response = await authApi.login(data)
    const result = response.data
    const token = result.data?.token || result.data?.accessToken || result.token || result.accessToken
    const refreshToken = result.data?.refreshToken || result.refreshToken
    const userData = result.data?.user || result.data || result.user || result

    if (token) {
      localStorage.setItem('token', token)
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    }
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return result
  }

  const register = async (data) => {
    const response = await authApi.register(data)
    return response.data
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
