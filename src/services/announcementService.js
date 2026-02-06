// src/services/announcementService.js
import { getData, postData, deleteData } from '../utils/apiUtils';
import { toast } from 'react-hot-toast';

class AnnouncementService {
  // Get all announcements with filters
  async getAnnouncements(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.category) params.append('category', filters.category);
    if (filters.hostelId) params.append('hostelId', filters.hostelId);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.pinned !== undefined) params.append('pinned', filters.pinned);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/announcements?${queryString}` : '/announcements';
    
    return await getData(endpoint);
  }

  // Get single announcement
  async getAnnouncementById(announcementId) {
    return await getData(`/announcements/${announcementId}`);
  }

  // Add comment to announcement
  async addComment(announcementId, commentText) {
    const result = await postData(`/announcements/${announcementId}/comments`, { 
      text: commentText 
    });
    
    if (result.success) {
      toast.success('Comment added successfully');
    }
    
    return result;
  }

  // Get comments for announcement
  async getComments(announcementId) {
    return await getData(`/announcements/${announcementId}/comments`);
  }

  // Toggle reaction on announcement
  async toggleReaction(announcementId, reactionType) {
    return await postData(`/announcements/${announcementId}/reactions`, { 
      type: reactionType 
    });
  }

  // Get reactions for announcement
  async getReactions(announcementId) {
    return await getData(`/announcements/${announcementId}/reactions`);
  }

  // Mark announcement as read
  async markAsRead(announcementId) {
    return await postData(`/announcements/${announcementId}/read`, {});
  }
}

const announcementService = new AnnouncementService();
export default announcementService;