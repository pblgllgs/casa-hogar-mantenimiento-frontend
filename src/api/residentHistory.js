import api from './axios'

export const getByResidentAndDate = (residentId, date) => api.get(`/residents/${residentId}/history`, { params: { date } })

export const save = (residentId, data) => api.post(`/residents/${residentId}/history`, data)

export const remove = (residentId, id) => api.delete(`/residents/${residentId}/history/${id}`)
