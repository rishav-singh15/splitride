import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function JoinableRidesList() {
  const [rides, setRides] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchJoinableRides = async () => {
      try {
        const res = await api.get('/rides/joinable');
        setRides(res.data);
      } catch (err) {
        console.error('Failed to fetch joinable rides', err);
      }
    };
    fetchJoinableRides();
  }, []);

  const handleJoinRequest = async (rideId) => {
    try {
      await api.post(`/rides/join/${rideId}`);
      setMessage('Join request sent! Waiting for approval...');
      // Remove the ride from the list after requesting
      setRides(rides.filter(ride => ride._id !== rideId));
    } catch (err) {
      console.error('Failed to send join request', err);
      setMessage(err.response?.data?.error || 'Failed to send request.');
    }
  };

  if (rides.length === 0) {
    return <p className="text-sm text-gray-600">No other shared rides to join nearby right now.</p>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Join an Existing Ride</h3>
      {message && <p className="text-blue-600">{message}</p>}
      {rides.map((ride) => (
        <div key={ride._id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
          <div>
            <p>From: <span className="font-semibold">{ride.route.start}</span></p>
            <p>To: <span className="font-semibold">{ride.route.end}</span></p>
            <p>Current Fare: <span className="font-bold">${ride.pricing.perPersonFare.toFixed(2)}</span></p>
          </div>
          <button
            onClick={() => handleJoinRequest(ride._id)}
            className="px-3 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            Request to Join
          </button>
        </div>
      ))}
    </div>
  );
}