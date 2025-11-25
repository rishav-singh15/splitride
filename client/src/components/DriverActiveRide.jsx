import React, { useEffect, useState } from 'react';
import api from '../services/api';
import socket from '../services/socket';
import MapComponent from './MapComponent';
import { Navigation, Users, CheckCircle, ShieldAlert } from 'lucide-react';

const DriverActiveRide = () => {
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [otpInput, setOtpInput] = useState('');
  const [error, setError] = useState('');

  // 1. Fetch the Driver's Current Active Ride
  useEffect(() => {
    const fetchDriverRide = async () => {
      try {
        const res = await api.get('/rides/driver/active');
        setRide(res.data);
      } catch (err) {
        console.log("No active ride found for driver.");
      } finally {
        setLoading(false);
      }
    };
    fetchDriverRide();

    // Real-time updates
    if (socket) {
        socket.on('ride_updated', (updatedRide) => {
            // Only update if it matches our current ride context
            setRide(prev => prev?._id === updatedRide._id ? updatedRide : prev);
        });
        
        socket.on('new_ride_request', (newRide) => {
           // Optional: Show a toast notification here
           console.log("New ride available:", newRide);
        });
    }

    return () => {
        if (socket) socket.off('ride_updated');
    };
  }, []);

  // --- ACTIONS ---

  const verifyOtpAndStart = async () => {
    if (otpInput !== ride.safety?.otp) {
        setError("Invalid OTP. Ask passenger for code.");
        return;
    }
    // In a real app, you'd have a specific API endpoint for this. 
    // For MVP, we assume OTP match allows starting.
    // Let's just update the status to ongoing if it isn't already.
    if (ride.status === 'scheduled' || ride.status === 'searching') {
        try {
            await api.post(`/rides/${ride._id}/accept`, { baseFare: ride.pricing.baseFare });
            setError("");
            alert("OTP Verified! Ride Started.");
        } catch (err) {
            setError(err.message);
        }
    }
  };

  const completeRide = async () => {
      if(!window.confirm("End this ride?")) return;
      try {
          await api.post(`/rides/${ride._id}/complete`);
          setRide(null); // Clear screen
      } catch (err) {
          setError("Failed to end ride.");
      }
  };

  if (loading) return <div className="p-10 text-center">Loading Driver Dashboard...</div>;
  if (!ride) return (
    <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl shadow-sm border border-slate-200">
        <Navigation size={48} className="text-slate-300 mb-4" />
        <h3 className="text-xl font-bold text-slate-700">No Active Ride</h3>
        <p className="text-slate-500">Wait for requests in the Dashboard.</p>
    </div>
  );

  // --- MAP COORDINATES ---
  // Ensure we handle the nested object safely to prevent Error #31
  const startCoords = ride.route.start.location?.coordinates || ride.route.start.coordinates;
  const endCoords = ride.route.end.location?.coordinates || ride.route.end.coordinates;
  
  const mapPickup = startCoords ? { lat: startCoords[1], lng: startCoords[0] } : null;
  const mapDrop = endCoords ? { lat: endCoords[1], lng: endCoords[0] } : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* HEADER STATUS */}
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg flex justify-between items-center">
         <div>
            <h2 className="text-2xl font-bold">Current Trip</h2>
            <p className="text-emerald-400 text-sm font-mono mt-1">
                ID: {ride._id.slice(-6).toUpperCase()}
            </p>
         </div>
         <div className="text-right">
             <div className="text-3xl font-bold">₹{ride.pricing.currentTotal.toFixed(0)}</div>
             <div className="text-slate-400 text-xs uppercase">Total Earnings</div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* LEFT: MAP & ROUTE */}
          <div className="space-y-6">
             <div className="h-64 rounded-xl overflow-hidden shadow-md border border-slate-200 relative">
                 <MapComponent pickup={mapPickup} drop={mapDrop} setPickup={()=>{}} setDrop={()=>{}} />
             </div>

             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                 <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Navigation size={18} /> Route Details
                 </h3>
                 
                 {/* 🛑 FIX FOR ERROR #31: Access .name property */}
                 <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
                     <div className="relative">
                         <span className="absolute -left-[31px] w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"></span>
                         <p className="text-xs text-slate-400 font-bold uppercase">Pickup</p>
                         <p className="font-medium text-slate-800">
                            {ride.route.start.name} 
                         </p>
                     </div>
                     <div className="relative">
                         <span className="absolute -left-[31px] w-4 h-4 rounded-full bg-red-500 border-2 border-white"></span>
                         <p className="text-xs text-slate-400 font-bold uppercase">Drop</p>
                         <p className="font-medium text-slate-800">
                            {ride.route.end.name}
                         </p>
                     </div>
                 </div>
             </div>
          </div>

          {/* RIGHT: PASSENGERS & ACTIONS */}
          <div className="space-y-6">
              
              {/* OTP VERIFICATION (PHASE 2) */}
              {ride.status === 'scheduled' || ride.status === 'searching' ? (
                  <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl">
                      <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                          <ShieldAlert size={18} /> Verify Passenger
                      </h3>
                      <p className="text-sm text-indigo-700 mb-4">Enter the 4-digit OTP shown on passenger's screen.</p>
                      <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="OTP" 
                            className="w-full p-3 rounded-lg border border-indigo-200 font-mono text-center text-xl tracking-widest focus:ring-2 focus:ring-indigo-500 outline-none"
                            maxLength={4}
                            value={otpInput}
                            onChange={(e) => setOtpInput(e.target.value)}
                          />
                          <button 
                            onClick={verifyOtpAndStart}
                            className="bg-indigo-600 text-white px-6 rounded-lg font-bold hover:bg-indigo-700"
                          >
                            Start
                          </button>
                      </div>
                      {error && <p className="text-red-500 text-sm mt-2 font-bold">{error}</p>}
                  </div>
              ) : (
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3">
                      <CheckCircle className="text-emerald-600" />
                      <div>
                          <p className="font-bold text-emerald-900">Ride in Progress</p>
                          <p className="text-xs text-emerald-700">Safety checks passed</p>
                      </div>
                  </div>
              )}

              {/* PASSENGER LIST */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <Users size={18} /> Passengers ({ride.passengers.length})
                  </h3>
                  <div className="space-y-3">
                      {ride.passengers.map((p, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
                                      {idx + 1}
                                  </div>
                                  <div>
                                      {/* 🛑 FIX: Access .name explicitly */}
                                      <p className="font-medium text-sm text-slate-800">{p.user?.name || "Passenger"}</p>
                                      <p className="text-xs text-slate-500">Seat {p.seatNumber}</p>
                                  </div>
                              </div>
                              <span className="font-mono font-bold text-slate-700">₹{p.fareShare.toFixed(0)}</span>
                          </div>
                      ))}
                  </div>
              </div>

              {/* END RIDE BUTTON */}
              {ride.status === 'ongoing' && (
                  <button 
                    onClick={completeRide}
                    className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg transition-all"
                  >
                    Complete Ride
                  </button>
              )}
          </div>
      </div>
    </div>
  );
};

export default DriverActiveRide;