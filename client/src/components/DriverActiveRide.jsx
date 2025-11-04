import React, { useState, useEffect } from 'react';
import socket from '../services/socket';
import api from '../services/api';

export default function DriverActiveRide({ initialRide, onRideComplete }) {
  const [ride, setRide] = useState(initialRide);
  const [isCompleting, setIsCompleting] = useState(false);

  // Listen for fare/passenger updates
  useEffect(() => {
    socket.emit('join_ride', ride._id);

    const handleFareUpdate = (data) => {
      setRide(prevRide => ({
        ...prevRide,
        pricing: {
          ...prevRide.pricing,
          currentTotal: data.totalFare,
          perPersonFare: data.newFare,
        },
        passengers: data.passengers // Update passenger list
      }));
    };

    socket.on('fare_updated', handleFareUpdate);

    return () => {
      socket.off('fare_updated', handleFareUpdate);
    };
  }, [ride._id]);

  // Handle the "Complete Ride" button click
  const handleCompleteRide = async () => {
    if (!window.confirm('Are you sure you want to end this ride?')) {
      return;
    }
    setIsCompleting(true);
    try {
      await api.post(`/rides/complete/${ride._id}`);
      onRideComplete(); // This tells the DashboardPage to refresh
    } catch (err) {
      console.error('Failed to complete ride', err);
      alert('Could not complete ride. Please try again.');
      setIsCompleting(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="mb-4 text-2xl font-bold">Active Ride Details</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold">Route</h4>
          <p>From: {ride.route.start}</p>
          <p>To: {ride.route.end}</p>
        </div>
        
        <div>
          <h4 className="font-semibold">Your Earnings</h4>
          <p>Total Fare: <span className="text-xl font-bold text-green-600">${ride.pricing.currentTotal.toFixed(2)}</span></p>
          <p>(Base: ${ride.pricing.baseFare}, Increment: ${ride.pricing.incrementPerPassenger})</p>
        </div>

        <div>
          <h4 className="font-semibold">Passengers ({ride.passengers.length})</h4>
          <ul className="list-disc list-inside">
            {ride.passengers.map((p, index) => (
              <li key={index}>{p.name} (Paying ${p.fareToPay.toFixed(2)})</li>
            ))}
          </ul>
        </div>
      </div>

      <button
        onClick={handleCompleteRide}
        disabled={isCompleting}
        className="w-full py-2 mt-6 font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
      >
        {isCompleting ? 'Completing...' : 'End Ride'}
      </button>
    </div>
  );
}