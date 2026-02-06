// src/components/issues/IssueDetailModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, User, Tag, Clock, MessageCircle, ThumbsUp, Heart, CheckCircle, Send } from 'lucide-react';
import issueService from '../../services/issueService';
import { toast } from 'react-hot-toast';

export const IssueDetailModal = ({ isOpen, onClose, issueId, onUpdate }) => {
  const [issue, setIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [reactions, setReactions] = useState({});
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (isOpen && issueId) {
      loadIssueDetails();
    }
  }, [isOpen, issueId]);

  const loadIssueDetails = async () => {
    setLoading(true);

    try {
      const issueRes = await issueService.getIssueById(issueId);

      if (issueRes.success) {
        setIssue({
          ...issueRes.data.issue,
          media: issueRes.data.media || [],
        });

        setComments(issueRes.data.comments || []);
        setReactions(issueRes.data.reactions || []);
      }

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };


  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    const result = await issueService.addComment(issueId, newComment);

    if (result.success) {
      setNewComment('');
      loadIssueDetails(); // Reload to get new comment
    }

    setSubmittingComment(false);
  };

  const handleReaction = async (type) => {
    const result = await issueService.toggleReaction(issueId, type);

    if (result.success) {
      loadIssueDetails(); // Reload to update reactions
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      REPORTED: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      ASSIGNED: 'bg-blue-50 text-blue-700 border-blue-200',
      IN_PROGRESS: 'bg-purple-50 text-purple-700 border-purple-200',
      RESOLVED: 'bg-green-50 text-green-700 border-green-200',
      CLOSED: 'bg-gray-50 text-gray-700 border-gray-200',
      REJECTED: 'bg-red-50 text-red-700 border-red-200',
    };
    return colors[status] || colors.REPORTED;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: 'bg-blue-50 text-blue-700',
      MEDIUM: 'bg-yellow-50 text-yellow-700',
      HIGH: 'bg-orange-50 text-orange-700',
      EMERGENCY: 'bg-red-50 text-red-700',
    };
    return colors[priority] || colors.MEDIUM;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-900">Issue Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : issue ? (
            <>
              {/* Status and Priority Badges */}
              <div className="flex gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(issue.status)}`}>
                  {issue.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(issue.priority)}`}>
                  {issue.priority}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                  {issue.category}
                </span>
                {issue.visibility === 'PRIVATE' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                    🔒 Private
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{issue.title}</h3>

              {/* Media */}
              {issue.media.map((item, index) => (
                <img
                  key={index}
                  src={item.mediaUrl}
                  alt={`Issue media ${index + 1}`}
                  className="rounded-lg border border-gray-200 w-full h-48 object-cover"
                />
              ))}


              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-5 rounded-xl border border-gray-100 mb-6">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-blue-500 mt-1" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Reported</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {issue.reportedAt
                        ? new Date(issue.reportedAt).toLocaleDateString()
                        : 'N/A'}

                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-red-500 mt-1" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Location</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {issue.hostel?.name
                        ? `${issue.hostel.name}${issue.roomNumber ? ` - Room ${issue.roomNumber}` : ''}`
                        : 'Location not available'}

                    </p>
                  </div>
                </div>

                {issue.assignedTo && (
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-purple-500 mt-1" />
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Assigned To</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {issue.assignedTo.fullName}
                      </p>
                    </div>
                  </div>
                )}

                {issue.resolvedAt && (
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Resolved</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(issue.resolvedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-900 mb-2 text-sm">Description</h4>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {issue.description}
                </p>
              </div>

              {/* AI Analysis (if available) */}
              {issue.aiAnalysis && (
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-bold text-blue-900 mb-2 text-sm flex items-center gap-2">
                    🤖 AI Analysis
                  </h4>
                  <p className="text-blue-700 text-sm">
                    Confidence: {(issue.aiAnalysis.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              )}

              {/* Reactions */}
              <div className="mb-6">
                <div className="flex items-center gap-4">
                  <button onClick={() => handleReaction('thumbs_up')}>
                    <ThumbsUp />
                    <span>{reactions.thumbs_up || 0}</span>
                  </button>

                  <button onClick={() => handleReaction('fire')}>
                    <Heart />
                    <span>{reactions.fire || 0}</span>
                  </button>

                </div>
              </div>

              {/* Comments Section */}
              <div>
                <h4 className="font-bold text-gray-900 mb-4 text-sm flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Comments ({comments.length})
                </h4>

                {/* Comment List */}
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment._id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {comment.user?.fullName?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-gray-900">
                              {comment.user?.fullName || 'User'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{comment.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    disabled={submittingComment}
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !newComment.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 py-10">Issue not found</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end sticky bottom-0 z-10">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-100 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};