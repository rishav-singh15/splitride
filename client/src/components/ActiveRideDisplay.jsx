import React, { useState, useEffect } from 'react';
import socket from '../services/socket';
import JoinRequestModal from './JoinRequestModal'; // Import the modal

export default function ActiveRideDisplay({ initialRide }) {
  const [ride, setRide] = useState(initialRide);
  const [joinRequest, setJoinRequest] = useState(null); // State for the modal

  useEffect(() => {
    // Join the socket room for this specific ride
    socket.emit('join_ride', ride._id);

    // --- Socket Listeners ---
    
    // 1. Driver accepted our initial request
    const handleRideAccepted = (data) => {
      setRide(data.ride);
    };

    // 2. A new user was approved, fare recalculated
    const handleFareUpdate = (data) => {
      alert(data.message); // Notify user
      setRide(prevRide => ({
        ...prevRide,
        pricing: {
          ...prevRide.pricing,
          currentTotal: data.totalFare,
          perPersonFare: data.newFare,
        },
        passengers: data.passengers.map(p => ({ name: p.name })) // Simple update
      }));
    };

    // 3. A new person wants to join
    const handleJoinRequest = (requestData) => {
      setJoinRequest(requestData); // Show the modal
    };

    socket.on('ride_accepted', handleRideAccepted);
    socket.on('fare_updated', handleFareUpdate);
    socket.on('join_request', handleJoinRequest);

    // Cleanup
    return () => {
      socket.off('ride_accepted', handleRideAccepted);
      socket.off('fare_updated', handleFareUpdate);
      socket.off('join_request', handleJoinRequest);
    };
  }, [ride._id]);

  const getStatusMessage = () => {
    if (ride.status === 'searching') return 'Searching for a driver...';
    if (ride.status === 'ongoing') return 'Ride in progress';
    return 'Ride status unknown';
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      {/* --- Render the modal --- */}
      <JoinRequestModal
        request={joinRequest}
        rideId={ride._id}
        onClose={() => setJoinRequest(null)}
      />

      <h2 className="mb-4 text-2xl font-bold">Your Active Ride</h2>
      <p className="mb-2 text-lg font-semibold text-blue-600">{getStatusMessage()}</p>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold">Route</h4>
          <p>From: {ride.route.start}</p>
          <p>To: {ride.route.end}</p>
        </div>
        
        {ride.status === 'ongoing' && (
          <div>
            <h4 className="font-semibold">Fare Details</h4>
            <p>Your Fare: <span className="text-xl font-bold text-green-600">${ride.pricing.perPersonFare.toFixed(2)}</span></p>
            <p>Total Fare: ${ride.pricing.currentTotal.toFixed(2)}</p>
          </div>
        )}

        <div>
          <h4 className="font-semibold">Driver</h4>
          <p>{ride.driver?.name || 'Waiting for driver...'}</p>
          <p>{ride.driver?.vehicle?.number}</p>
        </div>

        <div>
          <h4 className="font-semibold">Passengers</h4>
          {ride.passengers.map((p, index) => (
            <p key={index}>{p.name}</p>
          ))}
        </div>
      </div>
    </div>
  );
}