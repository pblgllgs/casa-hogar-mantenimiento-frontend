import api from './axios'

export const getAll = (params) => api.get('/inventory/items', { params })

export const create = (data) => api.post('/inventory/items', data)

export const update = (id, data) => api.put(`/inventory/items/${id}`, data)

export const remove = (id) => api.delete(`/inventory/items/${id}`)

export const createMovement = (data) => api.post('/inventory/movements', data)

export const getMovements = (params) => api.get('/inventory/movements', { params })
