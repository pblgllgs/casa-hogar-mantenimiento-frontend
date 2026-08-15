import api from './axios'

export const getAll = (params) => api.get('/residents', { params })

export const getById = (id) => api.get(`/residents/${id}`)

export const create = (data) => api.post('/residents', data)

export const update = (id, data) => api.put(`/residents/${id}`, data)

export const remove = (id) => api.delete(`/residents/${id}`)
