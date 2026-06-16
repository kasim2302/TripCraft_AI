import api from './api';

const getItineraries = async () => {
  const response = await api.get('/itinerary');
  return response.data;
};

const getItineraryById = async (id) => {
  const response = await api.get(`/itinerary/${id}`);
  return response.data;
};

const getPublicSharedItinerary = async (shareId) => {
  const response = await api.get(`/itinerary/share/${shareId}`);
  return response.data;
};

const uploadBooking = async (formData, onUploadProgress) => {
  const response = await api.post('/bookings/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
  return response.data;
};

const generateItineraryFromBooking = async (bookingData) => {
  const response = await api.post('/bookings/generate-itinerary', bookingData);
  return response.data;
};

const deleteBooking = async (id) => {
  const response = await api.delete(`/bookings/${id}`);
  return response.data;
};

const itineraryService = {
  getItineraries,
  getItineraryById,
  getPublicSharedItinerary,
  uploadBooking,
  generateItineraryFromBooking,
  deleteBooking,
};

export default itineraryService;
