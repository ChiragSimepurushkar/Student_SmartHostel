import { postData, getData, putData } from '../utils/apiUtils';

/**
 * Authentication Service
 * Centralized service for all authentication-related API calls
 */

export const authService = {
  /**
   * Register a new user
   */
  async register(userData) {
    try {
      const response = await postData('/auth/register', userData);
      return response;
    } catch (error) {
      console.error('Registration service error:', error);
      return {
        success: false,
        message: error.message || 'Registration failed'
      };
    }
  },

  /**
   * Login user
   */
  async login(credentials) {
    try {
      const response = await postData('/auth/login', credentials);
      
      if (response.success && response.data?.accessToken) {
        // Store token and user data
        localStorage.setItem('accesstoken', response.data.accessToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response;
    } catch (error) {
      console.error('Login service error:', error);
      return {
        success: false,
        message: error.message || 'Login failed'
      };
    }
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      const response = await postData('/auth/logout');
      
      // Clear local storage
      localStorage.removeItem('accesstoken');
      localStorage.removeItem('user');
      
      return response;
    } catch (error) {
      console.error('Logout service error:', error);
      
      // Clear local storage even if API call fails
      localStorage.removeItem('accesstoken');
      localStorage.removeItem('user');
      
      return {
        success: false,
        message: error.message || 'Logout failed'
      };
    }
  },

  /**
   * Get current user profile
   */
  async getProfile() {
    try {
      const response = await getData('/auth/me');
      
      if (response.success && response.data) {
        // Update stored user data
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      
      return response;
    } catch (error) {
      console.error('Get profile service error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch profile'
      };
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(profileData) {
    try {
      const response = await putData('/auth/profile', profileData);
      
      if (response.success && response.data) {
        // Update stored user data
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      
      return response;
    } catch (error) {
      console.error('Update profile service error:', error);
      return {
        success: false,
        message: error.message || 'Failed to update profile'
      };
    }
  },

  /**
   * Change password
   */
  async changePassword(passwordData) {
    try {
      const response = await putData('/auth/change-password', passwordData);
      return response;
    } catch (error) {
      console.error('Change password service error:', error);
      return {
        success: false,
        message: error.message || 'Failed to change password'
      };
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const token = localStorage.getItem('accesstoken');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  /**
   * Get current user from local storage
   */
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  /**
   * Get access token
   */
  getToken() {
    return localStorage.getItem('accesstoken');
  }
};

export default authService;
