import api from './axios'

export const getAll = (params) => api.get('/hr/shift-logs', { params })

export const create = (data) => api.post('/hr/shift-logs', data)

export const update = (id, data) => api.put(`/hr/shift-logs/${id}`, data)

export const remove = (id) => api.delete(`/hr/shift-logs/${id}`)