export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const apiUrl = (path) => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
};
