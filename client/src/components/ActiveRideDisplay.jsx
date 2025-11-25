import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import socket from '../services/socket';
import MapComponent from './MapComponent';
import { Share2, ShieldCheck, TrendingDown, Navigation, Users, Clock } from 'lucide-react';

const ActiveRideDisplay = () => {
  const { id } = useParams();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Safe User Access
  let currentUser = {};
  try {
    const userStr = localStorage.getItem('user');
    currentUser = userStr ? JSON.parse(userStr) : {};
  } catch(e) {}

  useEffect(() => {
    // 1. Initial Fetch
    const fetchRide = async () => {
      try {
        const res = await api.get(`/rides/${id}`);
        setRide(res.data);
      } catch (err) {
        console.error("Error loading ride:", err);
        setError("Could not load ride details.");
      } finally {
        setLoading(false);
      }
    };
    fetchRide();

    // 2. Real-time Listeners
    if (socket) {
        socket.emit('join_ride', id);
        
        // "ride_updated" sends the WHOLE object -> Safer than patching state manually
        socket.on('ride_updated', (updatedRide) => {
            console.log("Real-time update received:", updatedRide);
            setRide(updatedRide); 
        });
    }

    return () => { 
        if (socket) socket.off('ride_updated'); 
    };
  }, [id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen text-slate-500 gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p>Syncing Ride Data...</p>
    </div>
  );
  
  if (error) return <div className="p-10 text-center text-red-500 font-bold">{error}</div>;
  if (!ride) return <div className="p-10 text-center text-gray-500">Ride not found</div>;

  // --- SAFE COORDINATE PARSING ---
  // MongoDB stores as [Longitude, Latitude] inside location.coordinates
  const getCoordinates = (point) => {
    // Try the nested GeoJSON structure first (Ride.js schema)
    if (point?.location?.coordinates) return point.location.coordinates;
    // Fallback for flat structure
    if (point?.coordinates) return point.coordinates;
    return null;
  };

  const startCoords = getCoordinates(ride.route?.start);
  const endCoords = getCoordinates(ride.route?.end);
  const hasValidRoute = startCoords && endCoords;

  // Leaflet needs { lat, lng } - MongoDB gives [lng, lat]
  const mapPickup = hasValidRoute ? { lat: startCoords[1], lng: startCoords[0] } : null;
  const mapDrop = hasValidRoute ? { lat: endCoords[1], lng: endCoords[0] } : null;

  // Find My Data
  const myPassengerData = (ride.passengers || []).find(p => {
      const pId = p.user?._id || p.user || p.userId; // Handle populated vs unpopulated
      return pId === currentUser.id;
  }) || {};

  // Savings Logic (Visual Credibility)
  // Est. Solo Price = (Distance * 15) + 50. 
  // If distance is missing, assume 10km for visual demo
  const estimatedSolo = (myPassengerData.distanceTraveled || 5) * 15 + 50; 
  const currentShare = myPassengerData.fareShare || 0;
  const savings = Math.max(0, estimatedSolo - currentShare);

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* LEFT COL: MAP & STATUS */}
      <div className="lg:col-span-2 space-y-6">
        {/* Map Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-[500px] relative border border-slate-200">
           {hasValidRoute ? (
               <MapComponent pickup={mapPickup} drop={mapDrop} setPickup={() => {}} setDrop={() => {}} />
           ) : (
               <div className="h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                   <Navigation size={48} className="opacity-20 mb-2"/>
                   <p className="font-semibold">Map data syncing...</p>
               </div>
           )}
           
           {/* Floating Status Pill */}
           <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-4 py-2 rounded-full shadow-lg z-[1000] flex items-center gap-3 border border-slate-100">
             <span className={`w-3 h-3 rounded-full animate-pulse ${ride.status === 'searching' ? 'bg-amber-500' : 'bg-green-500'}`}></span>
             <span className="font-bold text-slate-700 text-sm uppercase tracking-wide">
                {ride.status === 'searching' ? 'Matching Drivers' : ride.status}
             </span>
           </div>
        </div>

        {/* Driver & Safety Card */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-2xl shadow-sm">
                    {ride.driver ? '👨‍✈️' : '📡'}
                </div>
                <div>
                    <h3 className="font-bold text-lg text-slate-800 leading-tight">
                        {ride.driver?.name || "Finding Driver..."}
                    </h3>
                    <p className="text-slate-500 text-xs font-medium uppercase mt-1">
                        {ride.driver?.vehicle?.number || "Searching Area"}
                    </p>
                </div>
            </div>
            
            <div className="flex flex-col items-end justify-center border-l border-slate-100 pl-4">
                <div className="flex items-center gap-1 text-slate-400 mb-1">
                    <ShieldCheck size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Secure OTP</span>
                </div>
                <p className="text-3xl font-mono font-bold text-slate-800 tracking-widest">
                    {ride.safety?.otp || "----"}
                </p>
            </div>
        </div>
      </div>

      {/* RIGHT COL: FARE & ACTIONS */}
      <div className="space-y-6">
        
        {/* The "Algorithm" Display (Visual Credibility) */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-2xl relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <p className="text-indigo-200 text-xs font-bold uppercase tracking-wide mb-1">Your Share</p>
                        <h2 className="text-5xl font-bold tracking-tight">
                            ₹{currentShare.toFixed(0)}
                        </h2>
                    </div>
                    {savings > 0 && (
                        <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg animate-bounce-slow">
                            <TrendingDown size={14} /> Save ₹{savings.toFixed(0)}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Ride Split</p>
                    
                    {/* List of Passengers */}
                    {(ride.passengers || []).map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2 border-b border-white/10 last:border-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs">
                                    {idx + 1}
                                </div>
                                <span className="text-sm font-medium text-slate-200">
                                    {p.user?.name || "Passenger"} 
                                    {p.user?._id === currentUser.id && " (You)"}
                                </span>
                            </div>
                            <span className="text-sm font-mono opacity-90">₹{p.fareShare?.toFixed(0)}</span>
                        </div>
                    ))}
                    
                    {/* Pending Requests Visual */}
                    {(ride.approvals || []).length > 0 && (
                        <div className="mt-4 bg-amber-500/20 border border-amber-500/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-amber-200 text-xs font-bold">
                                <Users size={14} />
                                <span>{ride.approvals.length} Request(s) Pending</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-3">
            <button className="flex items-center justify-center gap-2 w-full py-4 bg-white border-2 border-slate-100 rounded-xl font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-200 transition-all shadow-sm">
                <Share2 size={18} />
                Share Tracking Link
            </button>
        </div>

      </div>
    </div>
  );
};

export default ActiveRideDisplay;