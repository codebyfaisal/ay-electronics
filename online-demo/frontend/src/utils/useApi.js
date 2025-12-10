// src/utils/useApi.js
import { useState, useCallback } from 'react';
import apiClient from '../api/apiClient';
import { showError, showSuccess } from './toast';

const useApi = () => {
  const [loading, setLoading] = useState(false);

  const execute = useCallback(async (method, url, data = null,
    success = {
      server: false,
      message: 'Operation successful'
    }) => {
    setLoading(true);
    try {
      let response;

      switch (method.toUpperCase()) {
        case 'POST':
          response = await apiClient.post(url, data);
          break;
        case 'PUT':
          response = await apiClient.put(url, data);
          break;
        case 'DELETE':
          response = await apiClient.delete(url);
          break;
        default:
          throw new Error('Invalid API method specified.');
      }

      const message = success.server
        ? response?.data?.data.message
        : success.message;

      showSuccess(message);
      return response.data.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'An unexpected error occurred.';
      showError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    post: (url, data, msg) => execute('POST', url, data, msg),
    put: (url, data, msg) => execute('PUT', url, data, msg),
    del: (url, msg) => execute('DELETE', url, null, msg),
  };
};

export default useApi;
