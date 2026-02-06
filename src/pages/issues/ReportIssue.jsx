// src/pages/issues/ReportIssue.jsx - FIXED VERSION
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Upload, Image as ImageIcon, Trash2, Loader, AlertTriangle, Sparkles, MapPin } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import issueService from '../../services/issueService';
import { getData } from '../../utils/apiUtils';
import { toast } from 'react-hot-toast';

export const ReportIssue = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [duplicateIssues, setDuplicateIssues] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [availableHostels, setAvailableHostels] = useState([]);
  const [availableBlocks, setAvailableBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loadingHostels, setLoadingHostels] = useState(true);

  // Get current user
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const hasAssignedHostel = !!(user.hostel?._id || user.hostel);
  const hasAssignedBlock = !!(user.block?._id || user.block);

  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    isPublic: true,
    hostel: user.hostel?._id || user.hostel || '',
    block: user.block?._id || user.block || '',
    roomNumber: user.roomNumber || '',
  });

  const categories = [
    { id: 'PLUMBING', name: 'Plumbing', icon: '🚰' },
    { id: 'ELECTRICAL', name: 'Electrical', icon: '⚡' },
    { id: 'CLEANLINESS', name: 'Cleanliness', icon: '🧹' },
    { id: 'INTERNET', name: 'Internet', icon: '📡' },
    { id: 'FURNITURE', name: 'Furniture', icon: '🪑' },
    { id: 'OTHER', name: 'Other', icon: '📦' },
  ];

  // Load hostels if user doesn't have one assigned
  useEffect(() => {
    if (!hasAssignedHostel) {
      loadHostels();
    }
  }, [hasAssignedHostel]);

  // Load blocks when hostel changes
  useEffect(() => {
    if (formData.hostel && !hasAssignedBlock) {
      loadBlocks(formData.hostel);
    }
  }, [formData.hostel]);

  const loadHostels = async () => {
    setLoadingHostels(true);

    try {
      const result = await getData('/hostels');

      if (result.success) {
        setAvailableHostels(result.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHostels(false);
    }
  };


  const loadBlocks = async (hostelId) => {
    setLoadingBlocks(true);
    try {
      const result = await getData(`/hostels/${hostelId}/blocks`);
      if (result.success) {
        setAvailableBlocks(result.data || []);
      }
    } catch (error) {
      console.error('Error loading blocks:', error);
      setAvailableBlocks([]);
    } finally {
      setLoadingBlocks(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (files.length + newFiles.length > 5) {
        toast.error('Maximum 5 files allowed');
        return;
      }
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.category) {
      toast.error('Please select a category');
      setIsLoading(false);
      return;
    }

    // Validate hostel
    const finalHostelId = formData.hostel || user.hostel?._id || user.hostel;
    if (!finalHostelId) {
      toast.error('Hostel information is required. Please select a hostel.');
      setIsLoading(false);
      return;
    }

    try {
      // Prepare data - only include valid IDs
      const issueDataToSubmit = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        isPublic: formData.isPublic,
        hostel: finalHostelId,
        roomNumber: formData.roomNumber || user.roomNumber,
      };

      // Only add block if it's selected and not empty
      const finalBlockId = formData.block || user.block?._id || user.block;
      if (finalBlockId && finalBlockId !== '') {
        issueDataToSubmit.block = finalBlockId;
      }

      const result = await issueService.createIssue(issueDataToSubmit, files);

      if (result.success) {
        // Check for AI suggestions
        if (result.data?.aiAnalysis) {
          setAiSuggestions(result.data.aiAnalysis);
        }

        // Check for duplicate issues
        if (result.data?.similarIssues && result.data.similarIssues.length > 0) {
          setDuplicateIssues(result.data.similarIssues);
          setShowDuplicateWarning(true);
          setIsLoading(false);
          return;
        }

        toast.success(result.message || 'Issue reported successfully!');
        navigate('/issues');
      }
    } catch (err) {
      console.error('Error reporting issue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceedWithDuplicates = async () => {
    setShowDuplicateWarning(false);
    toast.success('Issue reported successfully!');
    navigate('/issues');
  };

  const handleViewDuplicate = (issueId) => {
    navigate(`/issues/${issueId}`);
  };

  const handleHostelChange = (e) => {
    const hostelId = e.target.value;
    setFormData({
      ...formData,
      hostel: hostelId,
      block: '', // Reset block when hostel changes
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Report New Issue</h1>
            <p className="text-sm text-gray-500 mt-1">
              Describe the problem you're facing
            </p>
          </div>
          <button
            onClick={() => navigate('/issues')}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location Section - Show only if user doesn't have assigned hostel */}
            {!hasAssignedHostel && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Location Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">
                      Hostel <span className="text-red-500">*</span>
                    </label>
                    {loadingHostels ? (
                      <div className="text-xs text-gray-500">Loading hostels...</div>
                    ) : availableHostels.length > 0 ? (

                      <select
                        className="w-full p-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.hostel}
                        onChange={handleHostelChange}
                        required
                      >
                        <option value="">Select Hostel</option>
                        {availableHostels.map((h) => (
                          <option key={h._id} value={h._id}>
                            {h.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-xs text-red-500">
                        No hostels found. Please contact admin.
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">
                      Block (Optional)
                    </label>
                    {loadingBlocks ? (
                      <div className="text-xs text-gray-500 p-2">Loading blocks...</div>
                    ) : availableBlocks.length > 0 ? (
                      <select
                        className="w-full p-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.block}
                        onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                      >
                        <option value="">Select Block</option>
                        {availableBlocks.map((b) => (
                          <option key={b._id} value={b._id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    ) : formData.hostel ? (
                      <div className="text-xs text-gray-500 p-2">No blocks available</div>
                    ) : (
                      <div className="text-xs text-gray-400 p-2">Select hostel first</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Room Number */}
            {!user.roomNumber && (
              <Input
                label="Room Number (Optional)"
                placeholder="E.g., 201, A-301"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
              />
            )}

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.id })}
                    className={`p-4 rounded-lg border-2 text-center transition-all duration-200 ${formData.category === cat.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    <div className="text-2xl mb-1">{cat.icon}</div>
                    <div className="text-sm font-medium">{cat.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <Input
              label="Issue Title"
              placeholder="E.g., Leaking tap in washroom"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-none"
                placeholder="Describe the issue in detail..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-50 transition-colors text-center relative">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3 text-blue-600">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Max 5 files (Images/Videos)</p>
                </div>
              </div>

              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="w-4 h-4 text-gray-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <div className="flex p-1 bg-gray-100 rounded-lg">
                {[
                  { label: 'Low', value: 'LOW' },
                  { label: 'Medium', value: 'MEDIUM' },
                  { label: 'High', value: 'HIGH' },
                  { label: 'Emergency', value: 'EMERGENCY' },
                ].map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: p.value })}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${formData.priority === p.value
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500'
                      }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
              <div className="flex p-1 bg-gray-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isPublic: true })}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${formData.isPublic
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500'
                    }`}
                >
                  🌐 Public
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isPublic: false })}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${!formData.isPublic
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500'
                    }`}
                >
                  🔒 Private
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {formData.isPublic
                  ? 'Visible to all students and staff'
                  : 'Only visible to hostel management'}
              </p>
            </div>

            {/* AI Suggestions */}
            {aiSuggestions && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-purple-900 mb-1">AI Suggestions</h4>
                    <p className="text-sm text-purple-700">
                      Suggested Category: {aiSuggestions.suggestedCategory} | Priority:{' '}
                      {aiSuggestions.suggestedPriority}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      Confidence: {(aiSuggestions.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 flex gap-4">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => navigate('/issues')}
                type="button"
              >
                Cancel
              </Button>
              <Button variant="primary" fullWidth type="submit" disabled={isLoading}>
                {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : 'Submit Report'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Duplicate Warning Modal */}
      {showDuplicateWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Similar Issues Found</h3>
                  <p className="text-sm text-gray-500">
                    We found {duplicateIssues.length} similar issue(s)
                  </p>
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                {duplicateIssues.map((issue) => (
                  <div
                    key={issue._id}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleViewDuplicate(issue._id)}
                  >
                    <p className="font-semibold text-sm text-gray-900">{issue.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Status: {issue.status} | Similarity: {(issue.similarity * 100).toFixed(0)}%
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDuplicateWarning(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Edit Issue
                </button>
                <button
                  onClick={handleProceedWithDuplicates}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Proceed Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};