import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight, Users, Clock, Navigation } from 'lucide-react';

const JoinableRidesList = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const res = await api.get('/rides/available');
        setRides(res.data);
      } catch (err) {
        console.error("Error loading rides:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRides();
  }, []);

  // --- LOGIC: Accept the ride properly ---
  const handleAcceptRide = async (rideId) => {
    try {
      // 1. Call API to assign this driver
      // Defaulting baseFare to 50 for MVP simplicity
      await api.post(`/rides/${rideId}/accept`, { baseFare: 50 });
      
      // 2. Navigate to the Active Ride Dashboard
      navigate('/driver/ride');
    } catch (err) {
      alert("Error accepting ride: " + (err.response?.data?.error || err.message));
    }
  };

  // Helper to calculate simple distance for display (optional visual polish)
  const getDistanceDisplay = (ride) => {
    if (ride.route?.totalDistance) return `${ride.route.totalDistance.toFixed(1)} km`;
    return "City Ride";
  };

  if (loading) return (
    <div className="p-8 text-center space-y-3">
        <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="text-gray-500 text-sm">Scanning for nearby passengers...</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4">
      <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-indigo-600"/> Passenger Requests
          </h2>
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
            Live Feed
          </span>
      </div>
      
      {rides.length === 0 ? (
          <div className="text-center text-gray-500 py-16 bg-white rounded-xl border border-dashed border-gray-300 shadow-sm">
              <Navigation className="mx-auto text-gray-300 mb-2" size={32} />
              <p className="font-medium">No rides found nearby.</p>
              <p className="text-xs mt-1">New requests will appear here automatically.</p>
          </div>
      ) : (
          rides.map(ride => (
            <div key={ride._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all relative overflow-hidden">
                {/* Status Badge */}
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                    NEW REQUEST
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Route Info */}
                    <div className="md:col-span-2 space-y-4">
                        <div className="relative pl-4 border-l-2 border-dashed border-gray-200 space-y-4">
                            {/* Start */}
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 bg-green-500 rounded-full ring-4 ring-white"></div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Pickup</p>
                                <h4 className="font-semibold text-gray-800">
                                    {ride.route?.start?.name || "Start Location"}
                                </h4>
                            </div>
                            
                            {/* End */}
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 bg-red-500 rounded-full ring-4 ring-white"></div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Drop</p>
                                <h4 className="font-semibold text-gray-800">
                                    {ride.route?.end?.name || "Destination"}
                                </h4>
                            </div>
                        </div>
                    </div>
                    
                    {/* Meta & Action */}
                    <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                        <div className="space-y-2 mb-4">
                             <div className="flex justify-between text-sm">
                                 <span className="text-gray-500">Distance</span>
                                 <span className="font-bold text-gray-800">{getDistanceDisplay(ride)}</span>
                             </div>
                             <div className="flex justify-between text-sm">
                                 <span className="text-gray-500">Seats</span>
                                 <span className="font-bold text-indigo-600">{ride.seatsRequested || 1} Requested</span>
                             </div>
                        </div>

                        <button 
                            onClick={() => handleAcceptRide(ride._id)}
                            className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-transform active:scale-95"
                        >
                            Accept Ride <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
          ))
      )}
    </div>
  );
};

export default JoinableRidesList;