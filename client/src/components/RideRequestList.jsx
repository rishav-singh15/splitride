import React, { useState, useEffect } from 'react';
import api from '../services/api';       // Our axios
import socket from '../services/socket'; // Our socket.io

export default function RideRequestList() {
  const [rides, setRides] = useState([]);

  // Fetch initial rides on component mount
  useEffect(() => {
    const fetchSearchingRides = async () => {
      try {
        const res = await api.get('/rides/searching');
        setRides(res.data);
      } catch (err) {
        console.error('Failed to fetch rides', err);
      }
    };
    fetchSearchingRides();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    // A new ride is requested
    const handleNewRide = (newRide) => {
      setRides((prevRides) => [newRide, ...prevRides]);
    };
    
    // A ride is accepted (by us or another driver)
    const handleRideUpdated = (updatedRide) => {
      if (updatedRide.status !== 'searching') {
        setRides((prevRides) => prevRides.filter(ride => ride._id !== updatedRide._id));
      }
    };

    socket.on('new_ride_request', handleNewRide);
    socket.on('ride_updated', handleRideUpdated);

    // Cleanup listeners when component unmounts
    return () => {
      socket.off('new_ride_request', handleNewRide);
      socket.off('ride_updated', handleRideUpdated);
    };
  }, []);

  const handleAccept = async (rideId) => {
    // Your mentor's logic: Driver quotes base and increment
    const baseFare = parseFloat(prompt('Enter Base Fare (e.g., 100):'));
    const incrementPerPassenger = parseFloat(prompt('Enter Increment per Passenger (e.g., 25):'));

    if (!baseFare || !incrementPerPassenger) {
      alert('You must enter valid fares.');
      return;
    }

    try {
      await api.post(`/rides/accept/${rideId}`, { baseFare, incrementPerPassenger });
      // Instantly remove from UI for this driver
      setRides((prevRides) => prevRides.filter(ride => ride._id !== rideId));
    } catch (err) {
      console.error('Failed to accept ride', err);
      alert('Failed to accept ride. It may have already been taken.');
    }
  };

  return (
    <div className="space-y-4">
      {rides.length === 0 ? (
        <p>No ride requests at the moment...</p>
      ) : (
        rides.map((ride) => (
          <div key={ride._id} className="p-4 bg-white rounded-lg shadow-md">
            <h3 className="font-semibold">New Request</h3>
            <p>From: {ride.route.start}</p>
            <p>To: {ride.route.end}</p>
            <p>Type: {ride.maxPassengers > 1 ? 'Shared' : 'Solo'}</p>
            <button
              onClick={() => handleAccept(ride._id)}
              className="w-full px-4 py-2 mt-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              Accept Ride
            </button>
          </div>
        ))
      )}
    </div>
  );
}