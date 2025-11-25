import React, { useState, useEffect } from 'react';
import api from '../services/api';       
import socket from '../services/socket'; 
import { MapPin, Users, Clock, Navigation } from 'lucide-react';

export default function RideRequestList() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial rides
  useEffect(() => {
    const fetchSearchingRides = async () => {
      try {
        const res = await api.get('/rides/searching');
        setRides(res.data);
      } catch (err) {
        console.error('Failed to fetch rides', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSearchingRides();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    const handleNewRide = (newRide) => {
      setRides((prevRides) => [newRide, ...prevRides]);
    };
    
    const handleRideUpdated = (updatedRide) => {
      // If ride is no longer searching, remove it from list
      if (updatedRide.status !== 'searching') {
        setRides((prevRides) => prevRides.filter(ride => ride._id !== updatedRide._id));
      }
    };

    if (socket) {
        socket.on('new_ride_request', handleNewRide);
        socket.on('ride_updated', handleRideUpdated);
    }

    return () => {
      if (socket) {
          socket.off('new_ride_request', handleNewRide);
          socket.off('ride_updated', handleRideUpdated);
      }
    };
  }, []);

  const handleAccept = async (rideId) => {
    // Phase 2 MVP: Simplified Acceptance (One-Click)
    // We default to 50 base fare to speed up testing. 
    // You can uncomment the prompts later if you want dynamic pricing negotiation.
    const baseFare = 50; 
    // const baseFare = parseFloat(prompt('Enter Base Fare (e.g., 100):')) || 50;

    try {
      // 🛑 FIX: URL corrected to match Controller: /rides/:id/accept
      await api.post(`/rides/${rideId}/accept`, { baseFare });
      
      // Optimistic UI update: Remove immediately
      setRides((prevRides) => prevRides.filter(ride => ride._id !== rideId));
    } catch (err) {
      console.error('Failed to accept ride', err);
      alert('Failed to accept ride. It may have been taken.');
    }
  };

  if (loading) return <div className="p-4 text-center text-gray-500">Loading requests...</div>;

  return (
    <div className="space-y-4">
      {rides.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <Navigation className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">No active requests nearby.</p>
        </div>
      ) : (
        rides.map((ride) => (
          <div key={ride._id} className="p-5 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                    {ride.seatsRequested || 1} Passenger(s)
                </span>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={12} />
                    <span>{new Date(ride.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
            </div>

            {/* Route Details - 🛑 FIX: Access .name to prevent crash */}
            <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-green-500 shrink-0" />
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Pickup</p>
                        <p className="font-medium text-gray-800 leading-tight">
                            {ride.route?.start?.name || "Start Location"}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-red-500 shrink-0" />
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Drop</p>
                        <p className="font-medium text-gray-800 leading-tight">
                            {ride.route?.end?.name || "Destination"}
                        </p>
                    </div>
                </div>
            </div>

            <button
              onClick={() => handleAccept(ride._id)}
              className="w-full py-3 text-white bg-slate-900 rounded-lg font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              Accept Ride
            </button>
          </div>
        ))
      )}
    </div>
  );
}