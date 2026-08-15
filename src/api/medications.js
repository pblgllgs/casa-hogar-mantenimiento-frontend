import api from './axios';

export const getMedicationsByResident = async (residentId) => {
  const response = await api.get(`/medications/resident/${residentId}`);
  return response.data;
};

export const createMedication = async (data) => {
  const response = await api.post('/medications', data);
  return response.data;
};

export const updateMedication = async (id, data) => {
  const response = await api.put(`/medications/${id}`, data);
  return response.data;
};

export const deleteMedication = async (id) => {
  await api.delete(`/medications/${id}`);
};
