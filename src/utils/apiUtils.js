// src/utils/apiUtils.js
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  },
});



// Request interceptor - Add auth token to all requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accesstoken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });

          const { accessToken } = response.data.data;
          localStorage.setItem('accesstoken', accessToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          handleLogout();
          return Promise.reject(refreshError);
        }
      } else {
        handleLogout();
      }
    }

    return Promise.reject(error);
  }
);

// Handle logout
const handleLogout = () => {
  localStorage.clear();
  window.location.href = '/login';
};

// Extract error message from response
const extractErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// GET request
export const getData = async (endpoint, params = {}) => {
  try {
    const response = await axiosInstance.get(endpoint, {
      params,
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    // Safety check
    if (!response.data) {
      return {
        success: false,
        data: [],
        message: 'No response data',
      };
    }

    return {
      success: true,
      data: response.data.data ?? response.data,
      message: response.data.message,
    };
  } catch (error) {
    const message = extractErrorMessage(error);
    toast.error(message);

    return {
      success: false,
      error: message,
      data: [],
    };
  }
};


// POST request
export const postData = async (endpoint, data, config = {}) => {
  try {
    const response = await axiosInstance.post(endpoint, data, config);
    return {
      success: true,
      data: response.data.data || response.data,
      message: response.data.message,
    };
  } catch (error) {
    const message = extractErrorMessage(error);
    toast.error(message);
    return {
      success: false,
      error: message,
      data: null,
    };
  }
};

// PUT request
export const putData = async (endpoint, data) => {
  try {
    const response = await axiosInstance.put(endpoint, data);
    return {
      success: true,
      data: response.data.data || response.data,
      message: response.data.message,
    };
  } catch (error) {
    const message = extractErrorMessage(error);
    toast.error(message);
    return {
      success: false,
      error: message,
      data: null,
    };
  }
};

// PATCH request
export const patchData = async (endpoint, data) => {
  try {
    const response = await axiosInstance.patch(endpoint, data);
    return {
      success: true,
      data: response.data.data || response.data,
      message: response.data.message,
    };
  } catch (error) {
    const message = extractErrorMessage(error);
    toast.error(message);
    return {
      success: false,
      error: message,
      data: null,
    };
  }
};

// DELETE request
export const deleteData = async (endpoint) => {
  try {
    const response = await axiosInstance.delete(endpoint);
    return {
      success: true,
      data: response.data.data || response.data,
      message: response.data.message,
    };
  } catch (error) {
    const message = extractErrorMessage(error);
    toast.error(message);
    return {
      success: false,
      error: message,
      data: null,
    };
  }
};

// Upload file (multipart/form-data)
export const uploadFile = async (endpoint, formData, onProgress) => {
  try {
    const response = await axiosInstance.post(endpoint, formData, {
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    return {
      success: true,
      data: response.data.data || response.data,
      message: response.data.message,
    };
  } catch (error) {
    const message = extractErrorMessage(error);
    toast.error(message);

    return {
      success: false,
      error: message,
      data: null,
    };
  }
};


// Legacy compatibility
export const fetchDataFromApi = getData;
export const editData = putData;

export default axiosInstance;