// src/pages/issues/MyIssues.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Loader, Filter, X } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { IssueCard } from '../../components/issues/IssueCard';
import { IssueDetailModal } from '../../components/issues/IssueDetailModal';
import { Button } from '../../components/ui/Button';
import issueService from '../../services/issueService';
import socketService from '../../utils/socketService';

export const MyIssues = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    priority: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const tabs = [
    { label: 'All', value: 'All' },
    { label: 'Pending', value: 'Pending' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Resolved', value: 'Resolved' },
    { label: 'Closed', value: 'Closed' },
  ];

  const categories = ['PLUMBING', 'ELECTRICAL', 'CLEANLINESS', 'INTERNET', 'FURNITURE', 'OTHER'];
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'];

  useEffect(() => {
    loadIssues();

    // Setup Socket.IO listeners
    socketService.on('issue_updated', handleIssueUpdate);
    socketService.on('status_changed', handleStatusChange);

    return () => {
      socketService.off('issue_updated', handleIssueUpdate);
      socketService.off('status_changed', handleStatusChange);
    };
  }, [activeTab, filters]);

  const loadIssues = async () => {
    setLoading(true);
    try {
      const queryFilters = {
        reporterId: user._id,
        ...filters,
      };

      // Map tab to status filter
      if (activeTab === 'Pending') {
        queryFilters.status = 'REPORTED';
      } else if (activeTab === 'In Progress') {
        queryFilters.status = 'IN_PROGRESS,ASSIGNED';
      } else if (activeTab === 'Resolved') {
        queryFilters.status = 'RESOLVED';
      } else if (activeTab === 'Closed') {
        queryFilters.status = 'CLOSED';
      }

      const result = await issueService.getIssues(queryFilters);

      if (result.success) {
        setIssues(result.data.issues || []);
      }
    } catch (error) {
      console.error('Failed to fetch issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueUpdate = (data) => {
    console.log('Issue updated:', data);
    loadIssues();
  };

  const handleStatusChange = (data) => {
    console.log('Status changed:', data);
    loadIssues();
  };

  const handleCardClick = (issue) => {
    setSelectedIssueId(issue._id || issue.id);
    setIsModalOpen(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      priority: '',
    });
    setSearchTerm('');
  };

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Issues</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track and manage your reported issues
          </p>
        </div>
        <Button onClick={() => navigate('/issues/new')} icon={Plus}>
          Report Issue
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            Filters
            {(filters.category || filters.priority) && (
              <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                {[filters.category, filters.priority].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">All Priorities</option>
                {priorities.map((pri) => (
                  <option key={pri} value={pri}>
                    {pri}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 mt-4">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.value
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Issues List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIssues.length > 0 ? (
            filteredIssues.map((issue) => (
              <IssueCard
                key={issue._id}
                issue={{
                  id: issue._id,
                  title: issue.title,
                  category: issue.category,
                  priority: issue.priority,
                  status: issue.status,
                  description: issue.description,
                  timeAgo: new Date(issue.reportedAt || issue.createdAt).toLocaleDateString(),
                }}
                onClick={() => handleCardClick(issue)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-10 bg-white rounded-xl border-2 border-dashed border-gray-200">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {searchTerm || filters.category || filters.priority
                  ? 'No issues found matching your criteria.'
                  : 'No issues reported yet.'}
              </p>
              {!searchTerm && !filters.category && !filters.priority && (
                <button
                  onClick={() => navigate('/issues/new')}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Report Your First Issue
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Issue Detail Modal */}
      <IssueDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        issueId={selectedIssueId}
        onUpdate={loadIssues}
      />
    </DashboardLayout>
  );
};