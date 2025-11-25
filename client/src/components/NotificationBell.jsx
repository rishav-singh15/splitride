import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, UserPlus, CheckCircle, Info, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import socket from '../services/socket';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // 1. Fetch initial unread notifications
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
  }, [user]);

  // 2. Real-time Listeners
  useEffect(() => {
    if (!socket) return;

    // A. Generic Notifications from Backend
    const handleNewNotification = (newNotification) => {
      setNotifications((prev) => [newNotification, ...prev]);
    };

    // B. Smart Listeners: Create notifications from specific events
    // (In case the backend doesn't store them immediately, we show them locally)
    const handleJoinRequest = (data) => {
        const notif = {
            _id: Date.now(), // Temp ID
            type: 'join_request',
            message: `${data.requesterName} wants to join your ride!`,
            rideId: data.rideId,
            createdAt: new Date()
        };
        setNotifications((prev) => [notif, ...prev]);
    };

    const handleRideAccepted = (data) => {
        const notif = {
            _id: Date.now(),
            type: 'ride_accepted',
            message: `Driver accepted your ride! Base fare: ₹${data.baseFare || 50}`,
            rideId: data.ride._id,
            createdAt: new Date()
        };
        setNotifications((prev) => [notif, ...prev]);
    };

    socket.on('new_notification', handleNewNotification);
    socket.on('join_request', handleJoinRequest);
    socket.on('ride_accepted', handleRideAccepted);

    return () => {
      socket.off('new_notification', handleNewNotification);
      socket.off('join_request', handleJoinRequest);
      socket.off('ride_accepted', handleRideAccepted);
    };
  }, []);

  // 3. Actions
  const handleNotificationClick = async (n) => {
    // 1. Mark as read
    if (n._id && typeof n._id === 'string') {
        try {
            await api.put(`/notifications/read/${n._id}`);
        } catch (e) { /* Ignore error for temp notifications */ }
    }

    // 2. Remove from list
    setNotifications((prev) => prev.filter((item) => item._id !== n._id));
    setIsOpen(false);

    // 3. Navigate to relevant page
    if (n.rideId) {
        navigate(`/ride/${n.rideId}`);
    }
  };

  const clearAll = async () => {
     setNotifications([]);
     setIsOpen(false);
     // Optional: Call API to clear all
  };

  const unreadCount = notifications.length;

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 rounded-full hover:bg-slate-100 transition-colors"
      >
        <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'text-indigo-600' : 'text-slate-600'}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
            {/* Backdrop to close on click outside */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
            
            <div className="absolute right-0 z-50 w-80 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
            
            {/* Header */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 text-sm">Notifications</h3>
                {unreadCount > 0 && (
                    <button onClick={clearAll} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                        Mark all read
                    </button>
                )}
            </div>

            {/* List */}
            <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No new alerts</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100">
                    {notifications.map((n, idx) => (
                        <li 
                        key={n._id || idx} 
                        onClick={() => handleNotificationClick(n)} 
                        className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3 items-start"
                        >
                        {/* Icon based on type */}
                        <div className={`mt-1 p-1.5 rounded-full shrink-0 ${
                            n.type === 'join_request' ? 'bg-indigo-100 text-indigo-600' :
                            n.type === 'ride_accepted' ? 'bg-emerald-100 text-emerald-600' :
                            'bg-slate-100 text-slate-500'
                        }`}>
                            {n.type === 'join_request' ? <UserPlus size={16} /> :
                             n.type === 'ride_accepted' ? <CheckCircle size={16} /> :
                             <Info size={16} />}
                        </div>

                        <div>
                            <p className="text-sm text-slate-700 font-medium leading-tight mb-1">
                                {n.message}
                            </p>
                            <p className="text-xs text-slate-400">
                                {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                            </p>
                        </div>
                        </li>
                    ))}
                    </ul>
                )}
            </div>
            </div>
        </>
      )}
    </div>
  );
}