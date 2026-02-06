import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { NotificationProvider } from './context/NotificationContext';

// Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { Dashboard } from './pages/student/Dashboard';
import { MyIssues } from './pages/issues/MyIssues';
import { ReportIssue } from './pages/issues/ReportIssue';
import { AnnouncementList } from './pages/announcements/AnnouncementList';
import { LostFoundList } from './pages/lostfound/LostFoundList';
import { ReportLostFound } from './pages/lostfound/ReportLostFound';
import { Profile } from './pages/student/Profile';
import { Settings } from './pages/student/Settings';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('accesstoken');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const App = () => {
  // Log environment check
  useEffect(() => {
    console.log('🚀 App Environment:', {
      API_URL: import.meta.env.VITE_API_URL,
      SOCKET_URL: import.meta.env.VITE_SOCKET_URL,
    });
  }, []);

  return (
    <NotificationProvider>
      <Router>
        <Toaster 
          position="top-center" 
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#363636',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute><Settings /></ProtectedRoute>
          } />
          
          {/* Issue Routes */}
          <Route path="/issues" element={
            <ProtectedRoute><MyIssues /></ProtectedRoute>
          } />
          <Route path="/issues/new" element={
            <ProtectedRoute><ReportIssue /></ProtectedRoute>
          } />
          
          {/* Feature Routes */}
          <Route path="/announcements" element={
            <ProtectedRoute><AnnouncementList /></ProtectedRoute>
          } />
          <Route path="/lost-found" element={
            <ProtectedRoute><LostFoundList /></ProtectedRoute>
          } />
          <Route path="/lost-found/new" element={
            <ProtectedRoute><ReportLostFound /></ProtectedRoute>
          } />
          
          {/* 404 Handler */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-gray-600 mb-6">Page not found</p>
                <a href="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
                  Go to Dashboard
                </a>
              </div>
            </div>
          } />
        </Routes>
      </Router>
    </NotificationProvider>
  );
};

export default App;