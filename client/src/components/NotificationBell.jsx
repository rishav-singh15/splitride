import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import socket from '../services/socket';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  // 1. Fetch initial unread notifications on load
  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const res = await api.get('/notifications');
          setNotifications(res.data);
        } catch (err) {
          console.error('Failed to fetch notifications', err);
        }
      };
      fetchNotifications();
    }
  }, [user]); // Run when user logs in

  // 2. Listen for new notifications in real-time
  useEffect(() => {
    const handleNewNotification = (newNotification) => {
      // Add the new notification to the top of the list
      setNotifications((prev) => [newNotification, ...prev]);
    };

    socket.on('new_notification', handleNewNotification);

    // Cleanup listener
    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, []); // Run only once

  // 3. Handle marking a notification as "read"
  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/read/${id}`);
      // Remove it from the list in the UI
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const unreadCount = notifications.length;

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button onClick={() => setIsOpen(!isOpen)} className="relative">
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 z-50 w-64 mt-2 overflow-hidden bg-white rounded-lg shadow-xl">
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No new notifications</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {notifications.map((n) => (
                <li 
                  key={n._id} 
                  onClick={() => handleMarkAsRead(n._id)} 
                  className="p-3 text-sm hover:bg-gray-100 cursor-pointer"
                >
                  <p>{n.message}</p>
                  <p className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleTimeString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}