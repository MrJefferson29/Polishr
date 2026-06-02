import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const followHost = async (hostId) => {
  const response = await axios.post(`${API_BASE_URL}/follows/${hostId}`, {}, { headers: authHeaders() });
  return response.data;
};

export const unfollowHost = async (hostId) => {
  const response = await axios.delete(`${API_BASE_URL}/follows/${hostId}`, { headers: authHeaders() });
  return response.data;
};

export const getFollowing = async () => {
  const response = await axios.get(`${API_BASE_URL}/follows/following`, { headers: authHeaders() });
  return response.data;
};

export const checkIfFollowing = async (hostId) => {
  const response = await axios.get(`${API_BASE_URL}/follows/${hostId}/check`, { headers: authHeaders() });
  return response.data;
};
