import api from './axios'

export const getAll = (params) => api.get('/maintenance/work-orders', { params })

export const getById = (id) => api.get(`/maintenance/work-orders/${id}`)

export const create = (data) => api.post('/maintenance/work-orders', data)

export const update = (id, data) => api.put(`/maintenance/work-orders/${id}`, data)

export const remove = (id) => api.delete(`/maintenance/work-orders/${id}`)

export const changeStatus = (id, status) =>
  api.patch(`/maintenance/work-orders/${id}/status`, null, { params: { status } })

export const getComments = (id) => api.get(`/maintenance/work-orders/${id}/comments`)

export const addComment = (id, data) => api.post(`/maintenance/work-orders/${id}/comments`, data)
