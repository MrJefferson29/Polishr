import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export { API_BASE_URL };

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  verifyResetToken: (token) => api.get(`/auth/verify-reset-token/${token}`),
  googleAuthUrl: () => `${API_BASE_URL}/auth/google`,
};

export const usersAPI = {
  getMyProfile: () => api.get('/users/me'),
  updateProfile: (userId, data) => api.put(`/users/${userId}`, data),
  uploadProfileImage: (userId, formData) =>
    api.put(`/users/${userId}/profile-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getUserStats: () => api.get('/users/stats'),
};

export const salonsAPI = {
  getAll: (params = {}) => api.get('/salons', { params }),
  getById: (id) => api.get(`/salons/${id}`),
  getMySalon: () => api.get('/salons/my-salon'),
  getPopular: () => api.get('/salons/popular'),
  getNearby: (lat, lng, radius = 25) =>
    api.get('/salons/nearby', { params: { lat, lng, radius } }),
  create: (formData) =>
    api.post('/salons', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) =>
    api.put(`/salons/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deactivate: (salonId, data) => api.post(`/salons/${salonId}/deactivate`, data),
  activate: (salonId) => api.post(`/salons/${salonId}/activate`),
};

export const appointmentsAPI = {
  getUserAppointments: () => api.get('/appointments'),
  getHostAppointments: () => api.get('/appointments/host'),
  create: (data) => api.post('/appointments', data),
  cancel: (id) => api.delete(`/appointments/${id}`),
  verifyPayment: (sessionId) => api.get(`/appointments/verify-payment/${sessionId}`),
  checkAvailability: (salonId, startTime, duration) =>
    api.get(`/appointments/check-availability/${salonId}/${startTime}/${duration}`),
  getSalonBookedSlots: (salonId) => api.get(`/appointments/salon/${salonId}/booked-slots`),
  cancelPayment: (sessionId) => api.post(`/appointments/cancel-payment/${sessionId}`),
};

export const followsAPI = {
  follow: (hostId) => api.post(`/follows/${hostId}`),
  unfollow: (hostId) => api.delete(`/follows/${hostId}`),
  getFollowing: () => api.get('/follows/following'),
  checkFollowing: (hostId) => api.get(`/follows/${hostId}/check`),
};

export const postsAPI = {
  getFeed: () => api.get('/posts/feed'),
  getByHost: (hostId) => api.get(`/posts/host/${hostId}`),
  getMyPosts: () => api.get('/posts/my-posts'),
  create: (formData) =>
    api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/posts/${id}`, data),
  delete: (id) => api.delete(`/posts/${id}`),
};

export const reviewsAPI = {
  createReview: (data) => api.post('/reviews', data),
  getSalonReviews: (salonId) => api.get(`/reviews/salon/${salonId}`),
  getUserReviews: (userId) => api.get(`/reviews/user/${userId}`),
  updateReview: (id, data) => api.put(`/reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
  addHostResponse: (id, data) => api.post(`/reviews/${id}/response`, data),
  markHelpful: (id) => api.post(`/reviews/${id}/helpful`),
};

export const hostApplicationsAPI = {
  submit: (data) => api.post('/host-applications', data),
  getMy: () => api.get('/host-applications/me'),
  list: (status) => api.get('/host-applications', { params: status ? { status } : {} }),
  approve: (id, data) => api.put(`/host-applications/${id}/approve`, data),
  decline: (id, adminNote) => api.put(`/host-applications/${id}/decline`, { adminNote }),
};

export const notificationsAPI = {
  getUserNotifications: (userId) => api.get(`/notifications/user/${userId}`),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: (userId) => api.put(`/notifications/user/${userId}/read-all`),
  getUnreadCount: (userId) => api.get(`/notifications/user/${userId}/unread-count`),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  deleteAllNotifications: (userId) => api.delete(`/notifications/user/${userId}/all`),
};

export const paymentsAPI = {
  adminGetAllPayments: () => api.get('/payments/admin/all'),
  adminSyncPayoutStatuses: () => api.post('/payments/admin/sync-payout-statuses'),
};

export const chatAPI = {
  createRoom: (data) => api.post('/chat/room', data),
  getMessages: (roomId) => api.get(`/chat/messages/${roomId}`),
  sendMessage: (formData) =>
    api.post('/chat/message', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getRooms: () => api.get('/chat/rooms'),
};

export const listingsAPI = {
  getAllListings: salonsAPI.getAll,
  getListingById: salonsAPI.getById,
};

export const bookingsAPI = {
  getUserBookings: appointmentsAPI.getUserAppointments,
  getHostBookings: appointmentsAPI.getHostAppointments,
  createBooking: appointmentsAPI.create,
  cancelBooking: appointmentsAPI.cancel,
  verifyPayment: appointmentsAPI.verifyPayment,
};

export default api;
