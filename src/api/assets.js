import api from './axios'

export const getAll = (params) => api.get('/assets', { params })

export const create = (data) => api.post('/assets', data)

export const update = (id, data) => api.put(`/assets/${id}`, data)

export const remove = (id) => api.delete(`/assets/${id}`)

export const getAllLocations = (params) => api.get('/assets/locations', { params })

export const createLocation = (data) => api.post('/assets/locations', data)

export const updateLocation = (id, data) => api.put(`/assets/locations/${id}`, data)

export const deleteLocation = (id) => api.delete(`/assets/locations/${id}`)
