// src/utils/axiosInstance.js
import axios from 'axios';
import { openAlertBox } from './toast';

const apiUrl = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
    baseURL: apiUrl,
    timeout: 30000, // 30 seconds
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request Interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accesstoken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor with proper error handling
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Try to refresh token
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const { data } = await axios.post(`${apiUrl}/auth/refresh-token`, {
                        refreshToken
                    });

                    if (data.success) {
                        localStorage.setItem('accesstoken', data.data.accessToken);
                        originalRequest.headers['Authorization'] = `Bearer ${data.data.accessToken}`;
                        return axiosInstance(originalRequest);
                    }
                }
            } catch (refreshError) {
                // Refresh failed - logout user
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        // Handle network errors
        if (!error.response) {
            openAlertBox('Error', 'Network error. Please check your connection.');
            return Promise.reject(error);
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;