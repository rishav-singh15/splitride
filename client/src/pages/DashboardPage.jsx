import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import socket from '../services/socket'; // Import socket

// Import all our components
import BookRideForm from '../components/BookRideForm';
import RideRequestList from '../components/RideRequestList';
import ActiveRideDisplay from '../components/ActiveRideDisplay';
import JoinableRidesList from '../components/JoinableRidesList';

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeRide, setActiveRide] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- THIS IS THE CORRECTED USE-EFFECT ---
  useEffect(() => {
    // We must wait for the user object to be known
    if (!user) {
      setIsLoading(false); // No user, so not loading
      return;
    }

    if (user.role === 'passenger') {
      const checkActiveRide = async () => {
        try {
          const res = await api.get('/rides/active');
          setActiveRide(res.data); // Will be null if no ride
        } catch (err) {
          console.error('Error fetching active ride', err);
        }
        setIsLoading(false); // Set loading false *after* check
      };
      checkActiveRide();
    } else {
      setIsLoading(false); // Driver doesn't need this check
    }
  }, [user]); // Dependency is the whole user object

  // This is the *second* useEffect we added (for Passenger 2)
  useEffect(() => {
    // Make sure user is loaded before attaching listeners
    if (!user) return;

    const handleJoinedRide = (data) => {
      if (!activeRide) {
        api.get('/rides/active').then(res => {
          setActiveRide(res.data);
        });
      }
    };
    
    socket.on('fare_updated', handleJoinedRide);

    return () => {
      socket.off('fare_updated', handleJoinedRide);
    };
  }, [user, activeRide]); // <-- Add user as a dependency

  if (isLoading) { // Simplified loading check
    return <div>Loading dashboard...</div>;
  }

  // --- DRIVER DASHBOARD ---
  if (user && user.role === 'driver') {
    return (
      <div>
        <h1 className="mb-6 text-3xl font-bold">Welcome, {user.name}</h1>
        <h2 className="mb-4 text-2xl">Available Ride Requests</h2>
        <RideRequestList />
      </div>
    );
  }

  // --- PASSENGER DASHBOARD ---
  if (user && user.role === 'passenger') {
    return (
      <div>
        <h1 className="mb-6 text-3xl font-bold">Welcome, {user.name}</h1>
        
        {activeRide ? (
          // --- 1. Passenger has an active ride ---
          <ActiveRideDisplay initialRide={activeRide} />
        ) : (
          // --- 2. Passenger does NOT have an active ride ---
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <h2 className="mb-4 text-2xl">Book a New Ride</h2>
              <BookRideForm />
            </div>
            <div>
              <JoinableRidesList />
            </div>
          </div>
        )}
      </div>
    );
  }

  // If no user (logged out, etc.), render nothing or a redirect
  return null; 
}