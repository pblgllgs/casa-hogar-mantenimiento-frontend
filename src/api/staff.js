import api from './axios'

export const getAll = (params) => api.get('/hr/staff', { params })

export const getById = (id) => api.get(`/hr/staff/${id}`)

export const create = (data) => api.post('/hr/staff', data)

export const update = (id, data) => api.put(`/hr/staff/${id}`, data)

export const remove = (id) => api.delete(`/hr/staff/${id}`)
