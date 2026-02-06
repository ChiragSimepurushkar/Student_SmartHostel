// src/pages/student/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, CheckCircle, Plus, Loader, TrendingUp } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { IssueCard } from '../../components/issues/IssueCard';
import { AnnouncementCard } from '../../components/announcements/AnnouncementCard';
import { IssueDetailModal } from '../../components/issues/IssueDetailModal';
import { DetailModal } from '../../components/ui/DetailModal';
import issueService from '../../services/issueService';
import announcementService from '../../services/announcementService';
import socketService from '../../utils/socketService';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
  });
  const [recentIssues, setRecentIssues] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const studentName = user.fullName || 'Student';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    loadDashboardData();
    
    // Initialize Socket.IO connection
    socketService.connect();

    // Setup Socket listeners for real-time updates
    socketService.on('new_issue', handleNewIssue);
    socketService.on('issue_updated', handleIssueUpdate);
    socketService.on('status_changed', handleStatusChange);
    socketService.on('new_announcement', handleNewAnnouncement);

    // Cleanup on unmount
    return () => {
      socketService.off('new_issue', handleNewIssue);
      socketService.off('issue_updated', handleIssueUpdate);
      socketService.off('status_changed', handleStatusChange);
      socketService.off('new_announcement', handleNewAnnouncement);
    };
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch user's issues
      const issuesRes = await issueService.getIssues({
        reporterId: user._id,
        limit: 5,
        page: 1,
      });

      // Fetch announcements
      const announcementsRes = await announcementService.getAnnouncements({
        limit: 3,
        page: 1,
      });

      if (issuesRes.success) {
        const issues = issuesRes.data.issues || [];
        
        // Calculate stats
        const total = issues.length;
        const resolved = issues.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length;
        const pending = total - resolved;

        setStats({ total, pending, resolved });
        setRecentIssues(issues);
      }

      if (announcementsRes.success) {
        setAnnouncements(announcementsRes.data.announcements || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time event handlers
  const handleNewIssue = (data) => {
    console.log('New issue received:', data);
    loadDashboardData(); // Reload data
  };

  const handleIssueUpdate = (data) => {
    console.log('Issue updated:', data);
    loadDashboardData();
  };

  const handleStatusChange = (data) => {
    console.log('Status changed:', data);
    loadDashboardData();
  };

  const handleNewAnnouncement = (data) => {
    console.log('New announcement:', data);
    loadDashboardData();
  };

  const handleIssueCardClick = (issue) => {
    setSelectedIssueId(issue._id || issue.id);
    setIsIssueModalOpen(true);
  };

  const handleAnnouncementClick = (announcement) => {
    setSelectedAnnouncement({
      id: announcement._id,
      title: announcement.title,
      category: announcement.category,
      date: new Date(announcement.createdAt).toLocaleDateString(),
      author: announcement.createdBy?.fullName || 'Admin',
      description: announcement.content,
      isPinned: announcement.isPinned,
    });
    setIsAnnouncementModalOpen(true);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {getGreeting()}, {studentName}! 👋
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Here's what's happening today.</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatsCard
          title="Total Issues"
          value={stats.total}
          icon={FileText}
          color="#3B82F6"
          onClick={() => navigate('/issues')}
        />
        <StatsCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          color="#F59E0B"
          onClick={() => navigate('/issues')}
        />
        <StatsCard
          title="Resolved"
          value={stats.resolved}
          icon={CheckCircle}
          color="#10B981"
          onClick={() => navigate('/issues')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Issues List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Recent Issues</h2>
            <button
              onClick={() => navigate('/issues')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentIssues.length > 0 ? (
              recentIssues.map((issue) => (
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
                  onClick={() => handleIssueCardClick(issue)}
                />
              ))
            ) : (
              <div className="col-span-2 text-center py-8 bg-white rounded-xl border border-dashed border-gray-300">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No recent issues found.</p>
                <button
                  onClick={() => navigate('/issues/new')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Report an Issue
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Announcements</h2>
          <div className="space-y-3">
            {announcements.length > 0 ? (
              announcements.map((ann) => (
                <AnnouncementCard
                  key={ann._id}
                  data={{
                    id: ann._id,
                    title: ann.title,
                    category: ann.category || 'GENERAL',
                    date: new Date(ann.createdAt).toLocaleDateString(),
                    description: ann.content,
                    isPinned: ann.isPinned,
                  }}
                  onClick={() => handleAnnouncementClick(ann)}
                />
              ))
            ) : (
              <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-300">
                <span className="text-4xl block mb-2">📢</span>
                <p className="text-gray-500 text-sm">No new updates.</p>
              </div>
            )}
          </div>
          {announcements.length > 0 && (
            <button
              onClick={() => navigate('/announcements')}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2"
            >
              View All Announcements →
            </button>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => navigate('/issues/new')}
        className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:scale-105 active:scale-95 flex items-center justify-center transition-all z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modals */}
      <IssueDetailModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        issueId={selectedIssueId}
        onUpdate={loadDashboardData}
      />

      <DetailModal
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
        title="Announcement"
        data={selectedAnnouncement}
      />
    </DashboardLayout>
  );
};