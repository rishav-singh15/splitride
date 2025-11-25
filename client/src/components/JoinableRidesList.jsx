import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight, Clock } from 'lucide-react';

const JoinableRidesList = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const res = await api.get('/rides/available'); // Ensure this endpoint exists
        setRides(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRides();
  }, []);

  if (loading) return <div className="p-8 text-center">Scanning for nearby rides...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-4 p-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Available Rides</h2>
      
      {rides.length === 0 ? (
          <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-xl">
              No active rides found nearby.
          </div>
      ) : (
          rides.map(ride => (
            <div key={ride._id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        {/* SAFE LOCATION DISPLAY */}
                        <div className="flex items-center gap-2 text-gray-700">
                            <MapPin size={16} className="text-green-500" />
                            <span className="font-medium">
                                {ride.route?.start?.name || "Pinned Location"}
                            </span>
                        </div>
                        <div className="pl-1">
                            <div className="h-4 border-l-2 border-gray-200 ml-2"></div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                            <MapPin size={16} className="text-red-500" />
                            <span className="font-medium">
                                {ride.route?.end?.name || "Destination"}
                            </span>
                        </div>
                    </div>
                    
                    <div className="text-right">
                        <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold">
                            {ride.passengers.length} / {ride.maxPassengers || 3} Seats
                        </span>
                        <p className="text-xs text-gray-400 mt-2">
                            {new Date(ride.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                    </div>
                </div>

                <button 
                    onClick={() => navigate(`/driver/ride/${ride._id}`)} // Or whatever your accept route is
                    className="w-full mt-4 bg-slate-900 text-white py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800"
                >
                    View Details <ArrowRight size={16} />
                </button>
            </div>
          ))
      )}
    </div>
  );
};

export default JoinableRidesList;