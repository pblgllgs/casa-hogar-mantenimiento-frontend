import axios from 'axios'
import { API_BASE_URL } from '../config'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token && !config.skipAuth) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (
      error.response?.status === 401 &&
      !originalRequest?.skipTokenRefresh &&
      !originalRequest?._retry
    ) {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        originalRequest._retry = true
        try {
          const refreshResponse = await api.post(
            '/auth/refresh',
            { refreshToken },
            { skipAuth: true, skipTokenRefresh: true }
          )
          const refreshed = refreshResponse.data?.data
          localStorage.setItem('token', refreshed.accessToken)
          localStorage.setItem('refreshToken', refreshed.refreshToken)
          originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`
          return api(originalRequest)
        } catch {
          // The cleanup below redirects the user to login.
        }
      }
    }
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
