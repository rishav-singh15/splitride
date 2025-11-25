import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import socket from '../services/socket';
import MapComponent from './MapComponent';
import { Share2, ShieldCheck, TrendingDown, MapPin, Navigation } from 'lucide-react';

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
    const fetchRide = async () => {
      try {
        const res = await api.get(`/rides/${id}`);
        setRide(res.data);
      } catch (err) {
        console.error("Error", err);
        setError("Could not load ride.");
      } finally {
        setLoading(false);
      }
    };
    fetchRide();

    if (socket) {
        socket.emit('join_ride', id);
        socket.on('fare_updated', (data) => {
            setRide(prev => {
                if (!prev) return prev;
                const updatedPassengers = (prev.passengers || []).map(p => {
                    const pId = p.user?._id || p.user || p.userId;
                    if (pId === currentUser.id) return { ...p, fareToPay: data.newFare };
                    return p;
                });
                return { ...prev, passengers: updatedPassengers, pricing: { ...prev.pricing, currentTotal: data.totalFare } };
            });
        });
    }
    return () => { if (socket) socket.off('fare_updated'); };
  }, [id, currentUser.id]);

  if (loading) return <div className="p-10 text-center animate-pulse">Loading Ride...</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;
  if (!ride) return <div className="p-10 text-center text-gray-500">Ride not found</div>;

  // --- SAFE COORDINATES ---
  const getCoordinates = (point) => {
    if (point?.location?.coordinates) return point.location.coordinates;
    if (point?.coordinates) return point.coordinates;
    return null;
  };
  const startCoords = getCoordinates(ride.route?.start);
  const endCoords = getCoordinates(ride.route?.end);
  const hasValidRoute = startCoords && endCoords;

  const mapPickup = hasValidRoute ? { lat: startCoords[1], lng: startCoords[0] } : null;
  const mapDrop = hasValidRoute ? { lat: endCoords[1], lng: endCoords[0] } : null;

  const myPassengerData = (ride.passengers || []).find(p => {
      const pId = p.user?._id || p.user || p.userId;
      return pId === currentUser.id;
  }) || {};

  return (
    <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden h-[500px] relative border border-slate-200">
           {hasValidRoute ? (
               <MapComponent pickup={mapPickup} drop={mapDrop} setPickup={() => {}} setDrop={() => {}} />
           ) : (
               <div className="h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                   <Navigation size={48} className="opacity-20"/>
                   {/* 🛑 FIX: Access .name explicitly. If you use {ride.route.start} here, it crashes! */}
                   <p className="mt-2 text-sm font-semibold">
                     {ride.route?.start?.name || "Start"} → {ride.route?.end?.name || "End"}
                   </p>
               </div>
           )}
           <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-sm z-[1000] flex items-center gap-2">
             <span className="w-3 h-3 bg-green-500 rounded-full animate-ping"></span>
             <span className="font-bold text-slate-700 text-sm">
                {ride.status === 'searching' ? 'Looking for Driver' : 'Ride in Progress'}
             </span>
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md flex justify-between items-center border border-slate-100">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xl">🚗</div>
                <div>
                    <h3 className="font-bold text-lg text-slate-800">{ride.driver?.name || "Finding Driver..."}</h3>
                    <p className="text-slate-500 text-sm">{ride.driver ? "Vehicle Assigned" : "Connecting..."}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">OTP</p>
                <p className="text-2xl font-mono font-bold text-slate-800 tracking-widest">{ride.safety?.otp || "7291"}</p>
            </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-xl shadow-xl">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <p className="text-indigo-200 text-sm">Your Fare</p>
                    <h2 className="text-4xl font-bold mt-1">₹{myPassengerData.fareToPay?.toFixed(0) || 0}</h2>
                </div>
                <div className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <TrendingDown size={14} /> Dynamic
                </div>
            </div>
            <div className="space-y-3">
                {(ride.passengers || []).map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center py-3">
                         {/* 🛑 FIX: Explicitly access .name */}
                        <span className="text-sm font-medium text-slate-200">{p.name || p.user?.name || "Passenger"}</span>
                        <span className="text-sm font-mono opacity-90">₹{p.fareToPay?.toFixed(0) || 0}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveRideDisplay;