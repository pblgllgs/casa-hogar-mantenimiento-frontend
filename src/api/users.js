import api from './axios'

export const listUsers = () => api.get('/auth/users')

export const updateUserRoles = (userId, roles) =>
  api.put(`/auth/users/${userId}/roles`, { roles })
