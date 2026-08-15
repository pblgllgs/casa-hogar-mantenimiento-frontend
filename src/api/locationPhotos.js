import api from './axios'

export const getAll = () => api.get('/location-photos')

export const create = (data) => api.post('/location-photos', data)

export const update = (id, data) => api.put(`/location-photos/${id}`, data)

export const remove = (id) => api.delete(`/location-photos/${id}`)
