import { getData, putData, deleteData } from '../utils/apiUtils';

/**
 * User Service
 * Service for user management (admin only)
 */

export const userService = {
  /**
   * Get all users
   */
  async getAllUsers(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = queryParams ? `/users?${queryParams}` : '/users';
      const response = await getData(endpoint);
      return response;
    } catch (error) {
      console.error('Get all users error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch users'
      };
    }
  },

  /**
   * Get single user by ID
   */
  async getUserById(id) {
    try {
      const response = await getData(`/users/${id}`);
      return response;
    } catch (error) {
      console.error('Get user error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch user'
      };
    }
  },

  /**
   * Update user
   */
  async updateUser(id, userData) {
    try {
      const response = await putData(`/users/${id}`, userData);
      return response;
    } catch (error) {
      console.error('Update user error:', error);
      return {
        success: false,
        message: error.message || 'Failed to update user'
      };
    }
  },

  /**
   * Delete user
   */
  async deleteUser(id) {
    try {
      const response = await deleteData(`/users/${id}`);
      return response;
    } catch (error) {
      console.error('Delete user error:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete user'
      };
    }
  },

  /**
   * Get user statistics (admin only)
   */
  async getUserStats() {
    try {
      const response = await getData('/users/stats');
      return response;
    } catch (error) {
      console.error('Get user stats error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch statistics'
      };
    }
  },
};

export default userService;
