import api from './api';

const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

const register = async (name, email, password) => {
  const response = await api.post('/auth/register', { name, email, password });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

const logout = () => {
  localStorage.removeItem('token');
};

const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

const changePassword = async (currentPassword, newPassword) => {
  const response = await api.put('/auth/change-password', { currentPassword, newPassword });
  return response.data;
};

const verifyOTP = async (email, otp) => {
  const response = await api.post('/auth/verify-otp', { email, otp });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

const resendOTP = async (email) => {
  const response = await api.post('/auth/resend-otp', { email });
  return response.data;
};

const authService = {
  login,
  register,
  logout,
  getCurrentUser,
  changePassword,
  verifyOTP,
  resendOTP,
};

export default authService;
