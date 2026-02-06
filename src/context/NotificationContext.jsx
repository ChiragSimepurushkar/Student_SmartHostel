import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import { toast } from 'react-hot-toast';

const NotificationContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const NotificationProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accesstoken');
    if (!token) return;

    // Initialize socket connection
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      setIsConnected(false);
    });

    // Listen for notifications
    newSocket.on('notification', (data) => {
      console.log('🔔 New notification:', data);
      
      const newNotification = {
        ...data,
        id: data._id || Date.now(),
        time: new Date(),
        read: false
      };

      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show toast
      toast.success(data.message || 'New notification', { 
        icon: '🔔',
        duration: 4000 
      });
    });

    // Listen for real-time issue updates
    newSocket.on('issue_updated', (data) => {
      console.log('📝 Issue updated:', data);
      toast.info('Issue status updated', { icon: '📝' });
    });

    newSocket.on('new_comment', (data) => {
      console.log('💬 New comment:', data);
      toast.info(`${data.user?.fullName || 'Someone'} commented on an issue`, { 
        icon: '💬' 
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const markAllAsRead = () => {
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id) => {
    setNotifications(prev => {
      const filtered = prev.filter(n => n.id !== id);
      const unread = filtered.filter(n => !n.read).length;
      setUnreadCount(unread);
      return filtered;
    });
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Join issue room for real-time updates
  const joinIssueRoom = (issueId) => {
    if (socket) {
      socket.emit('join_issue', issueId);
    }
  };

  const leaveIssueRoom = (issueId) => {
    if (socket) {
      socket.emit('leave_issue', issueId);
    }
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      markAllAsRead,
      removeNotification,
      clearAll,
      isConnected,
      socket,
      joinIssueRoom,
      leaveIssueRoom
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};