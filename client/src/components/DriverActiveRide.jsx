import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import socket from '../services/socket';
import MapComponent from './MapComponent';
import { Navigation, Phone, ShieldCheck, MapPin } from 'lucide-react';

const DriverActiveRide = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [otpInput, setOtpInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRide = async () => {
      try {
        const res = await api.get(`/rides/${id}`);
        setRide(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load ride.");
      } finally {
        setLoading(false);
      }
    };
    fetchRide();

    socket.emit('join_ride', id);
    socket.on('ride_updated', (updatedRide) => {
        setRide(updatedRide);
    });

    return () => {
        socket.off('ride_updated');
    };
  }, [id]);

  const handleStartRide = async () => {
    try {
      if (otpInput !== ride.safety?.otp) {
        alert("Incorrect OTP!");
        return;
      }
      await api.put(`/rides/${id}/status`, { status: 'ongoing' });
      setRide(prev => ({ ...prev, status: 'ongoing' }));
    } catch (err) {
      alert("Error starting ride");
    }
  };

  const handleEndRide = async () => {
    if (window.confirm("End ride?")) {
        try {
            await api.put(`/rides/${id}/status`, { status: 'completed' });
            navigate('/dashboard'); 
        } catch (err) {
            console.error(err);
        }
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Loading Navigation...</div>;
  if (!ride) return <div className="p-10 text-center text-red-500">Ride not found</div>;

  // --- SAFE COORDINATE PARSING ---
  const getCoordinates = (point) => {
    if (point?.location?.coordinates) return point.location.coordinates;
    if (point?.coordinates) return point.coordinates;
    return null;
  };
  
  const startCoords = getCoordinates(ride.route?.start);
  const endCoords = getCoordinates(ride.route?.end);
  const mapPickup = startCoords ? { lat: startCoords[1], lng: startCoords[0] } : null;
  const mapDrop = endCoords ? { lat: endCoords[1], lng: endCoords[0] } : null;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center shadow-lg">
        <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
                <Navigation className="text-green-400" />
                Driver Navigation
            </h1>
            {/* 🛑 FIX: Access .name explicitly here too if you add route info */}
            <p className="text-slate-400 text-sm">Ride #{ride._id.slice(-6)}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
            ride.status === 'ongoing' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'
        }`}>
            {ride.status}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden h-96 border border-slate-200">
         {mapPickup && mapDrop ? (
             <MapComponent pickup={mapPickup} drop={mapDrop} />
         ) : (
             <div className="h-full flex items-center justify-center text-gray-400">
               Map Unavailable
             </div>
         )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  Passengers
              </h3>
              <div className="space-y-3">
                  {ride.passengers.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                              {/* 🛑 FIX: Ensure name is string */}
                              <p className="font-bold text-gray-800">{p.name || p.user?.name || "Passenger"}</p>
                              <p className="text-xs text-green-600 font-mono">Collect: ₹{p.fareToPay?.toFixed(0)}</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md flex flex-col justify-between">
              {ride.status !== 'completed' ? (
                  <>
                    {ride.status !== 'ongoing' && (
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-600 mb-2">
                                Enter Passenger OTP
                            </label>
                            <input 
                                type="text" 
                                placeholder="4-Digit Code"
                                value={otpInput}
                                onChange={(e) => setOtpInput(e.target.value)}
                                className="w-full text-center text-2xl font-mono tracking-[1em] p-3 border-2 border-gray-200 rounded-lg outline-none"
                                maxLength={4}
                            />
                        </div>
                    )}
                    <button 
                        onClick={ride.status === 'ongoing' ? handleEndRide : handleStartRide}
                        className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all ${
                            ride.status === 'ongoing' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                    >
                        {ride.status === 'ongoing' ? 'COMPLETE RIDE' : 'START RIDE'}
                    </button>
                  </>
              ) : (
                  <div className="text-center text-gray-500">Ride Completed</div>
              )}
          </div>
      </div>
    </div>
  );
};

export default DriverActiveRide;