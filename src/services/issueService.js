// src/services/issueService.js
import { getData, postData, putData, patchData, deleteData, uploadFile } from '../utils/apiUtils';
import { toast } from 'react-hot-toast';

class IssueService {
  // Get all issues with filters
  async getIssues(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.reporterId) params.append('reporterId', filters.reporterId);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.search) params.append('search', filters.search);
    if (filters.visibility) params.append('visibility', filters.visibility);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/issues?${queryString}` : '/issues';
    
    return await getData(endpoint);
  }

  // Get single issue by ID
  async getIssueById(issueId) {
    return await getData(`/issues/${issueId}`);
  }

  // Create new issue
  async createIssue(issueData, files = []) {
    const formData = new FormData();
    
    // Add issue fields
    Object.keys(issueData).forEach((key) => {
      if (issueData[key] !== undefined && issueData[key] !== null) {
        formData.append(key, issueData[key]);
      }
    });
    
    // Add files
    files.forEach((file) => {
      formData.append('media', file);
    });

    const result = await uploadFile('/issues', formData);
    
    if (result.success) {
      toast.success(result.message || 'Issue reported successfully!');
      
      // Check for AI analysis
      if (result.data?.aiAnalysis) {
        const analysis = result.data.aiAnalysis;
        if (analysis.suggestedCategory || analysis.suggestedPriority) {
          toast.info(
            `AI Suggestion: ${analysis.suggestedCategory || ''} - ${analysis.suggestedPriority || ''}`,
            { duration: 4000, icon: '🤖' }
          );
        }
      }

      // Check for duplicate detection
      if (result.data?.duplicateIssues && result.data.duplicateIssues.length > 0) {
        toast.warning(
          `Found ${result.data.duplicateIssues.length} similar issue(s)`,
          { duration: 5000, icon: '⚠️' }
        );
      }

      // Check for auto-assignment
      if (result.data?.autoAssigned) {
        toast.success(
          `Automatically assigned to ${result.data.assignedTo?.fullName || 'staff'}`,
          { icon: '✅' }
        );
      }
    }
    
    return result;
  }

  // Update issue
  async updateIssue(issueId, updateData) {
    const result = await putData(`/issues/${issueId}`, updateData);
    
    if (result.success) {
      toast.success(result.message || 'Issue updated successfully');
    }
    
    return result;
  }

  // Update issue status
  async updateStatus(issueId, status, remarks = '') {
    const result = await patchData(`/issues/${issueId}/status`, { status, remarks });
    
    if (result.success) {
      toast.success(result.message || `Status updated to ${status}`);
    }
    
    return result;
  }

  // Delete issue
  async deleteIssue(issueId) {
    const result = await deleteData(`/issues/${issueId}`);
    
    if (result.success) {
      toast.success(result.message || 'Issue deleted successfully');
    }
    
    return result;
  }

  // Add comment to issue
  async addComment(issueId, commentText) {
    const result = await postData(`/issues/${issueId}/comments`, { comment: commentText });
    
    if (result.success) {
      toast.success('Comment added successfully');
    }
    
    return result;
  }

  // Get comments for issue
  async getComments(issueId) {
    return await getData(`/issues/${issueId}/comments`);
  }

  // Toggle reaction on issue
  async toggleReaction(issueId, reactionType) {
    const result = await postData(`/issues/${issueId}/reactions`, { type: reactionType });
    
    return result;
  }

  // Get reactions for issue
  async getReactions(issueId) {
    return await getData(`/issues/${issueId}/reactions`);
  }

  // Link issues as duplicates
  async linkAsDuplicate(issueId, masterIssueId) {
    const result = await postData(`/issues/${issueId}/link-duplicate`, { masterIssueId });
    
    if (result.success) {
      toast.success('Issues linked as duplicates');
    }
    
    return result;
  }

  // Get duplicate issues
  async getDuplicates(issueId) {
    return await getData(`/issues/${issueId}/duplicates`);
  }

  // Merge duplicate issue
  async mergeIssue(issueId, targetIssueId) {
    const result = await postData(`/issues/${issueId}/merge`, { targetIssueId });
    
    if (result.success) {
      toast.success('Issues merged successfully');
    }
    
    return result;
  }

  // Get AI recommendations for staff assignment
  async getStaffRecommendations(issueId) {
    return await getData(`/issues/${issueId}/recommendations`);
  }

  // Assign issue with AI recommendation
  async assignWithRecommendation(issueId, staffId) {
    const result = await postData(`/issues/${issueId}/assign-recommended`, { staffId });
    
    if (result.success) {
      toast.success('Issue assigned successfully');
    }
    
    return result;
  }

  // Get issue statistics
  async getStatistics(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.hostelId) params.append('hostelId', filters.hostelId);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/issues/statistics?${queryString}` : '/issues/statistics';
    
    return await getData(endpoint);
  }

  // Upvote issue (for public issues)
  async upvoteIssue(issueId) {
    const result = await postData(`/issues/${issueId}/upvote`, {});
    
    if (result.success) {
      toast.success('Issue upvoted');
    }
    
    return result;
  }

  // Report issue as inappropriate
  async reportIssue(issueId, reason) {
    const result = await postData(`/issues/${issueId}/report`, { reason });
    
    if (result.success) {
      toast.success('Issue reported to administrators');
    }
    
    return result;
  }
}

const issueService = new IssueService();
export default issueService;