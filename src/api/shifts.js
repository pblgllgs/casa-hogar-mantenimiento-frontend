import api from './axios'

export const getAll = (params) => api.get('/hr/shifts', { params })

export const create = (data) => api.post('/hr/shifts', data)

export const update = (id, data) => api.put(`/hr/shifts/${id}`, data)

export const remove = (id) => api.delete(`/hr/shifts/${id}`)

export const assignStaff = (shiftId, staffId, startDate) => {
  const params = startDate ? { startDate } : {}
  return api.post(`/hr/shifts/${shiftId}/assign/${staffId}`, null, { params })
}

export const removeStaff = (staffId, shiftId) => api.delete('/hr/shifts/assign', { params: { staffId, shiftId } })

export const getAssignments = () => api.get('/hr/shifts/assignments')
