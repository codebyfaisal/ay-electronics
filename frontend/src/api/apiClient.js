// src/api/apiClient.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('auth_token');

    if (token)
      config.headers['Authorization'] = `Bearer ${token}`;

    return config;
  },
  (error) => Promise.reject(error)

);

export default apiClient;
