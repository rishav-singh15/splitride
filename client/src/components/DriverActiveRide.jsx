import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import socket from '../services/socket';
import MapComponent from './MapComponent';
import { Navigation, Phone, ShieldCheck, MapPin, CheckCircle } from 'lucide-react';

const DriverActiveRide = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [otpInput, setOtpInput] = useState('');

  useEffect(() => {
    const fetchRide = async () => {
      try {
        const res = await api.get(`/rides/${id}`);
        setRide(res.data);
      } catch (err) {
        console.error("Ride Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRide();

    if (socket) {
        socket.emit('join_ride', id);
        socket.on('ride_updated', (updatedRide) => {
            setRide(updatedRide);
        });
    }
    return () => { if (socket) socket.off('ride_updated'); };
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
    if (window.confirm("Confirm End Ride?")) {
        try {
            await api.put(`/rides/${id}/status`, { status: 'completed' });
            navigate('/dashboard'); 
        } catch (err) {
            console.error(err);
        }
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Loading...</div>;
  if (!ride) return <div className="p-10 text-center text-red-500">Ride not found</div>;

  // --- 🛡️ SAFETY EXTRACTION BLOCK ---
  // We extract all strings HERE. If data is bad, it becomes empty string.
  // This prevents the "Object with keys" error in the JSX.
  
  const rideIdDisplay = ride._id ? ride._id.slice(-6) : "---";
  const rideStatus = ride.status || "unknown";
  
  // Safe Route Names
  const startLocationName = ride.route?.start?.name || "Start Location";
  const endLocationName = ride.route?.end?.name || "Destination";
  
  // Safe Coordinates
  const getCoords = (pt) => (pt?.location?.coordinates || pt?.coordinates || null);
  const startCoords = getCoords(ride.route?.start);
  const endCoords = getCoords(ride.route?.end);
  
  const mapPickup = startCoords ? { lat: startCoords[1], lng: startCoords[0] } : null;
  const mapDrop = endCoords ? { lat: endCoords[1], lng: endCoords[0] } : null;
  // ----------------------------------

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* HEADER */}
      <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center shadow-lg">
        <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
                <Navigation className="text-green-400" />
                Driver Navigation
            </h1>
            <p className="text-slate-400 text-sm">Ride #{rideIdDisplay}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
            rideStatus === 'ongoing' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'
        }`}>
            {rideStatus}
        </div>
      </div>

      {/* MAP AREA */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden h-96 border border-slate-200">
         {mapPickup && mapDrop ? (
             <MapComponent pickup={mapPickup} drop={mapDrop} />
         ) : (
             <div className="h-full flex items-center justify-center text-gray-400">
                Map Data Loading...
             </div>
         )}
      </div>

      {/* TEXT ROUTE (Safe Display) */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2">
              <MapPin size={16} className="text-green-500" />
              <span className="font-medium text-gray-700">{startLocationName}</span>
          </div>
          <div className="h-px bg-gray-300 w-10"></div>
          <div className="flex items-center gap-2">
              <MapPin size={16} className="text-red-500" />
              <span className="font-medium text-gray-700">{endLocationName}</span>
          </div>
      </div>

      {/* ACTION PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* PASSENGER LIST */}
          <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  Passengers
              </h3>
              <div className="space-y-3">
                  {(ride.passengers || []).map((p, idx) => {
                      const pName = p.name || p.user?.name || "Passenger";
                      const pFare = p.fareToPay?.toFixed(0) || "0";
                      
                      return (
                          <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                  <p className="font-bold text-gray-800">{pName}</p>
                                  <p className="text-xs text-green-600 font-mono">Collect: ₹{pFare}</p>
                              </div>
                              <div className="bg-green-100 p-2 rounded-full text-green-600">
                                  <Phone size={16} />
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>

          {/* CONTROLS */}
          <div className="bg-white p-6 rounded-xl shadow-md flex flex-col justify-between">
              {rideStatus === 'searching' || rideStatus === 'scheduled' || rideStatus === 'ongoing' ? (
                  <>
                    {rideStatus !== 'ongoing' && (
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
                        onClick={rideStatus === 'ongoing' ? handleEndRide : handleStartRide}
                        className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all ${
                            rideStatus === 'ongoing' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                    >
                        {rideStatus === 'ongoing' ? 'COMPLETE RIDE' : 'START RIDE'}
                    </button>
                  </>
              ) : (
                  <div className="text-center text-gray-500 flex flex-col items-center">
                      <CheckCircle className="text-green-500 mb-2" size={48} />
                      <p>Ride Completed</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default DriverActiveRide;