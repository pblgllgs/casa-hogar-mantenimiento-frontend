import api from './axios'

export const getDashboard = () => api.get('/reports/dashboard')

export const getMaintenanceSummary = () => api.get('/reports/maintenance-summary')

export const getInventoryAlerts = () => api.get('/reports/inventory-alerts')

export const getWorkOrdersByStatus = () => api.get('/reports/work-orders-by-status')

export const getWorkOrdersByPriority = () => api.get('/reports/work-orders-by-priority')

export const getAssetsReport = () => api.get('/reports/assets-pdf', { responseType: 'blob' })

export const getInventoryReport = () => api.get('/reports/inventory-pdf', { responseType: 'blob' })

export const getResidentsReport = () => api.get('/reports/residents-pdf', { responseType: 'blob' })

export const getStaffReport = () => api.get('/reports/staff-pdf', { responseType: 'blob' })

export const getShiftsReport = () => api.get('/reports/shifts-pdf', { responseType: 'blob' })
