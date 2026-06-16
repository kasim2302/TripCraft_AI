import api from './api';

const getTrips = async () => {
  const response = await api.get('/trips');
  return response.data;
};

const getTripById = async (id) => {
  const response = await api.get(`/trips/${id}`);
  return response.data;
};

const createTrip = async (tripData) => {
  const response = await api.post('/trips', tripData);
  return response.data;
};

const updateTrip = async (id, tripData) => {
  const response = await api.put(`/trips/${id}`, tripData);
  return response.data;
};

const deleteTrip = async (id) => {
  const response = await api.delete(`/trips/${id}`);
  return response.data;
};

const togglePackingItem = async (id, itemId) => {
  const response = await api.put(`/trips/${id}/packing/${itemId}`);
  return response.data;
};

const addBudgetItem = async (id, itemData) => {
  const response = await api.post(`/trips/${id}/budget`, itemData);
  return response.data;
};

const deleteBudgetItem = async (id, itemId) => {
  const response = await api.delete(`/trips/${id}/budget/${itemId}`);
  return response.data;
};

const tripService = {
  getTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  togglePackingItem,
  addBudgetItem,
  deleteBudgetItem,
};

export default tripService;
