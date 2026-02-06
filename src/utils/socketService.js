// src/utils/socketService.js
import io from 'socket.io-client';
import { toast } from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  // Initialize socket connection
  connect() {
    const token = localStorage.getItem('accesstoken');
    
    if (!token) {
      console.warn('No auth token found, skipping socket connection');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  // Setup default event listeners
  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      this.reconnectAttempts = 0;
      toast.success('Connected to real-time updates', { duration: 2000 });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, need to reconnect manually
        this.socket.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        toast.error('Failed to connect to real-time updates');
      }
    });

    // Real-time event listeners
    this.socket.on('new_issue', (data) => {
      console.log('New issue received:', data);
      toast.success(
        `New issue reported: ${data.issue?.title || 'Issue'}`,
        { icon: '🔔' }
      );
      this.triggerListeners('new_issue', data);
    });

    this.socket.on('issue_updated', (data) => {
      console.log('Issue updated:', data);
      this.triggerListeners('issue_updated', data);
    });

    this.socket.on('status_changed', (data) => {
      console.log('Status changed:', data);
      toast.info(
        `Issue status updated to: ${data.status}`,
        { icon: '📝' }
      );
      this.triggerListeners('status_changed', data);
    });

    this.socket.on('new_announcement', (data) => {
      console.log('New announcement:', data);
      toast.success(
        `New announcement: ${data.announcement?.title || 'Announcement'}`,
        { icon: '📢', duration: 4000 }
      );
      this.triggerListeners('new_announcement', data);
    });

    this.socket.on('new_comment', (data) => {
      console.log('New comment:', data);
      this.triggerListeners('new_comment', data);
    });

    this.socket.on('reaction_updated', (data) => {
      console.log('Reaction updated:', data);
      this.triggerListeners('reaction_updated', data);
    });

    this.socket.on('duplicate_issue_detected', (data) => {
      console.log('Duplicate issue detected:', data);
      toast.warning(
        'Similar issue found! Check existing issues.',
        { icon: '⚠️', duration: 5000 }
      );
      this.triggerListeners('duplicate_issue_detected', data);
    });

    this.socket.on('issue_assigned', (data) => {
      console.log('Issue assigned:', data);
      toast.info(
        `Issue assigned to ${data.assignedTo?.fullName || 'staff'}`,
        { icon: '👤' }
      );
      this.triggerListeners('issue_assigned', data);
    });
  }

  // Join a room
  joinRoom(roomName) {
    if (this.socket) {
      this.socket.emit('join_room', roomName);
      console.log(`Joined room: ${roomName}`);
    }
  }

  // Leave a room
  leaveRoom(roomName) {
    if (this.socket) {
      this.socket.emit('leave_room', roomName);
      console.log(`Left room: ${roomName}`);
    }
  }

  // Emit event
  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  // Register event listener
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Remove event listener
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Trigger registered listeners
  triggerListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in listener for ${event}:`, error);
        }
      });
    }
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.listeners.clear();
      this.socket = null;
      console.log('Socket disconnected manually');
    }
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }

  // Check if connected
  isConnected() {
    return this.socket?.connected || false;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;