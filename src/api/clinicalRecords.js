import api from './axios'

export const getByResident = (residentId, params) => api.get(`/clinical-records/resident/${residentId}`, { params })

export const create = (data) => api.post('/clinical-records', data)

export const update = (id, data) => api.put(`/clinical-records/${id}`, data)

export const remove = (id) => api.delete(`/clinical-records/${id}`)

export const getAttachments = (clinicalRecordId) => api.get(`/clinical-records/attachments/record/${clinicalRecordId}`)

export const addAttachment = (data) => api.post('/clinical-records/attachments', data)

export const removeAttachment = (id) => api.delete(`/clinical-records/attachments/${id}`)