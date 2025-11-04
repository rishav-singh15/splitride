import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import socket from '../services/socket';

// Import all our components
import BookRideForm from '../components/BookRideForm';
import RideRequestList from '../components/RideRequestList';
import ActiveRideDisplay from '../components/ActiveRideDisplay';
import JoinableRidesList from '../components/JoinableRidesList';
import DriverActiveRide from '../components/DriverActiveRide'; // <-- IMPORT NEW COMPONENT

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeRide, setActiveRide] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // This will run when the component loads or the user changes
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const checkActiveRide = async () => {
      let endpoint = '';
      if (user.role === 'passenger') {
        endpoint = '/rides/active';
      } else if (user.role === 'driver') {
        endpoint = '/rides/active-driver'; // <-- USE OUR NEW DRIVER ENDPOINT
      }

      if (endpoint) {
        try {
          const res = await api.get(endpoint);
          setActiveRide(res.data); // Will be null if no ride
        } catch (err) {
          console.error('Error fetching active ride', err);
        }
      }
      setIsLoading(false);
    };
    
    checkActiveRide();
  }, [user]);

  // This is for Passenger 2
  useEffect(() => {
    if (!user || user.role !== 'passenger') return;

    const handleJoinedRide = (data) => {
      if (!activeRide) {
        api.get('/rides/active').then(res => setActiveRide(res.data));
      }
    };
    socket.on('fare_updated', handleJoinedRide);
    return () => socket.off('fare_updated', handleJoinedRide);
  }, [user, activeRide]);

  // This is for Passengers when the ride is completed
  useEffect(() => {
    if (!user || user.role !== 'passenger') return;

    const handleRideCompleted = () => {
      alert('Your ride is complete!');
      setActiveRide(null); // Clear the active ride, which shows the booking forms again
    };
    socket.on('ride_completed', handleRideCompleted);
    return () => socket.off('ride_completed', handleRideCompleted);
  }, [user]);


  if (isLoading || !user) {
    return <div>Loading dashboard...</div>;
  }

  // --- DRIVER DASHBOARD ---
  if (user.role === 'driver') {
    return (
      <div>
        <h1 className="mb-6 text-3xl font-bold">Welcome, {user.name}</h1>
        {activeRide ? (
          <DriverActiveRide initialRide={activeRide} onRideComplete={() => setActiveRide(null)} />
        ) : (
          <div>
            <h2 className="mb-4 text-2xl">Available Ride Requests</h2>
            <RideRequestList />
          </div>
        )}
      </div>
    );
  }

  // --- PASSENGER DASHBOARD ---
  if (user.role === 'passenger') {
    return (
      <div>
        <h1 className="mb-6 text-3xl font-bold">Welcome, {user.name}</h1>
        {activeRide ? (
          <ActiveRideDisplay initialRide={activeRide} />
        ) : (
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

  return null; 
}