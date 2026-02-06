// src/pages/announcements/AnnouncementList.jsx
import React, { useState, useEffect } from 'react';
import { Search, Filter, Loader, XCircle, Check, MessageCircle, ThumbsUp } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { AnnouncementCard } from '../../components/announcements/AnnouncementCard';
import announcementService from '../../services/announcementService';
import socketService from '../../utils/socketService';
import { toast } from 'react-hot-toast';

export const AnnouncementList = () => {
  const [filter, setFilter] = useState('All');
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Modal state
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [comments, setComments] = useState([]);
  const [reactions, setReactions] = useState({});
  const [newComment, setNewComment] = useState('');

  const categories = ['All', 'EMERGENCY', 'MAINTENANCE', 'EVENT', 'FOOD', 'GENERAL'];

  useEffect(() => {
    loadAnnouncements();

    // Socket listeners
    socketService.on('new_announcement', handleNewAnnouncement);

    return () => {
      socketService.off('new_announcement', handleNewAnnouncement);
    };
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const result = await announcementService.getAnnouncements();

      if (result.success) {
        setAnnouncements(result.data.announcements || []);
      }
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewAnnouncement = (data) => {
    console.log('New announcement received:', data);
    loadAnnouncements();
  };

  const handleCardClick = async (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowDetailModal(true);

    // Load comments and reactions
    const [commentsRes, reactionsRes] = await Promise.all([
      announcementService.getComments(announcement._id),
      announcementService.getReactions(announcement._id),
    ]);

    if (commentsRes.success) {
      setComments(commentsRes.data.comments || []);
    }

    if (reactionsRes.success) {
      setReactions(reactionsRes.data.reactions || {});
    }

    // Mark as read
    await announcementService.markAsRead(announcement._id);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const result = await announcementService.addComment(
      selectedAnnouncement._id,
      newComment
    );

    if (result.success) {
      setNewComment('');
      // Reload comments
      const commentsRes = await announcementService.getComments(selectedAnnouncement._id);
      if (commentsRes.success) {
        setComments(commentsRes.data.comments || []);
      }
    }
  };

  const handleReaction = async (type) => {
    const result = await announcementService.toggleReaction(
      selectedAnnouncement._id,
      type
    );

    if (result.success) {
      // Reload reactions
      const reactionsRes = await announcementService.getReactions(selectedAnnouncement._id);
      if (reactionsRes.success) {
        setReactions(reactionsRes.data.reactions || {});
      }
    }
  };

  const handleFilterSelect = (category) => {
    setFilter(category);
    setIsDropdownOpen(false);
  };

  const filteredAnnouncements = announcements.filter((item) => {
    const itemCat = item.category?.toUpperCase() || 'GENERAL';
    const filterCat = filter.toUpperCase();
    const matchesCategory = filter === 'All' || itemCat === filterCat;

    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      item.title.toLowerCase().includes(searchLower) ||
      item.content.toLowerCase().includes(searchLower);

    return matchesCategory && matchesSearch;
  });

  // Sort by pinned first, then by date
  const sortedAnnouncements = filteredAnnouncements.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
            <p className="text-gray-500">Stay updated with the latest news from the hostel.</p>
          </div>

          <div className="flex gap-3 w-full md:w-auto relative">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search updates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow focus:shadow-sm"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center px-4 py-2 border rounded-lg text-sm font-medium transition-colors w-full md:w-auto justify-between gap-2 ${
                  isDropdownOpen || filter !== 'All'
                    ? 'bg-blue-50 border-blue-200 text-blue-600'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <span>{filter === 'All' ? 'Filter' : filter}</span>
                </div>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Select Category
                  </div>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleFilterSelect(cat)}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-gray-50 transition-colors ${
                        filter === cat ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {cat}
                      {filter === cat && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {isDropdownOpen && (
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setIsDropdownOpen(false)}
          />
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedAnnouncements.length > 0 ? (
              sortedAnnouncements.map((item) => (
                <AnnouncementCard
                  key={item._id}
                  data={{
                    id: item._id,
                    title: item.title,
                    category: item.category || 'GENERAL',
                    date: new Date(item.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    }),
                    description: item.content,
                    isPinned: item.isPinned,
                  }}
                  onClick={() => handleCardClick(item)}
                />
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                <div className="bg-gray-50 p-4 rounded-full mb-3">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No results found</h3>
                <p className="text-gray-500 text-sm mt-1">
                  We couldn't find anything matching your search.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilter('All');
                  }}
                  className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  <XCircle className="w-4 h-4" /> Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Announcement Detail Modal */}
      {showDetailModal && selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Announcement</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              {/* Badges */}
              <div className="flex gap-2 mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                  {selectedAnnouncement.category}
                </span>
                {selectedAnnouncement.isPinned && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                    📌 Pinned
                  </span>
                )}
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {selectedAnnouncement.title}
              </h3>

              <p className="text-sm text-gray-500 mb-6">
                Posted on {new Date(selectedAnnouncement.createdAt).toLocaleDateString()} by{' '}
                {selectedAnnouncement.createdBy?.fullName || 'Admin'}
              </p>

              <div className="prose max-w-none mb-6">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selectedAnnouncement.content}
                </p>
              </div>

              {/* Reactions */}
              <div className="mb-6 flex gap-3">
                <button
                  onClick={() => handleReaction('LIKE')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-sm font-medium">{reactions.LIKE || 0}</span>
                </button>
              </div>

              {/* Comments */}
              <div>
                <h4 className="font-bold text-gray-900 mb-4 text-sm flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Comments ({comments.length})
                </h4>

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
                          <p className="text-sm text-gray-700">{comment.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-100 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};