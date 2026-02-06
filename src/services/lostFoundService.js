// src/services/lostFoundService.js
import { getData, postData, putData, deleteData, uploadFile } from '../utils/apiUtils';
import { toast } from 'react-hot-toast';

class LostFoundService {
  // Get all lost/found items with filters
  async getItems(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.type) params.append('type', filters.type);
    if (filters.category) params.append('category', filters.category);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/lost-found?${queryString}` : '/lost-found';
    
    return await getData(endpoint);
  }

  // Get single item
  async getItemById(itemId) {
    return await getData(`/lost-found/${itemId}`);
  }

  // Create new lost/found item
  async createItem(itemData, file = null) {
    const formData = new FormData();
    
    // Add item fields
    Object.keys(itemData).forEach((key) => {
      if (itemData[key] !== undefined && itemData[key] !== null) {
        formData.append(key, itemData[key]);
      }
    });
    
    // Add image if provided
    if (file) {
      formData.append('image', file);
    }

    const result = await uploadFile('/lost-found', formData);
    
    if (result.success) {
      toast.success(result.message || 'Item reported successfully!');
    }
    
    return result;
  }

  // Update item
  async updateItem(itemId, updateData) {
    const result = await putData(`/lost-found/${itemId}`, updateData);
    
    if (result.success) {
      toast.success(result.message || 'Item updated successfully');
    }
    
    return result;
  }

  // Delete item
  async deleteItem(itemId) {
    const result = await deleteData(`/lost-found/${itemId}`);
    
    if (result.success) {
      toast.success(result.message || 'Item deleted successfully');
    }
    
    return result;
  }

  // Claim item
  async claimItem(itemId, claimDetails) {
    const result = await postData(`/lost-found/${itemId}/claim`, claimDetails);
    
    if (result.success) {
      toast.success('Claim request submitted successfully');
    }
    
    return result;
  }

  // Update claim status (for staff)
  async updateClaimStatus(itemId, claimId, status) {
    const result = await putData(`/lost-found/${itemId}/claim/${claimId}`, { status });
    
    if (result.success) {
      toast.success(`Claim ${status.toLowerCase()}`);
    }
    
    return result;
  }

  // Add comment
  async addComment(itemId, commentText) {
    const result = await postData(`/lost-found/${itemId}/comments`, { 
      text: commentText 
    });
    
    if (result.success) {
      toast.success('Comment added successfully');
    }
    
    return result;
  }

  // Get comments
  async getComments(itemId) {
    return await getData(`/lost-found/${itemId}/comments`);
  }
}

const lostFoundService = new LostFoundService();
export default lostFoundService;