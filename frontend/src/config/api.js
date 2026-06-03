export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://polishr.onrender.com';

export const apiUrl = (path) => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
};
