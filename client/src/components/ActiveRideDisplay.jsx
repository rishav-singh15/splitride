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
  
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : {};

  useEffect(() => {
    const fetchRide = async () => {
      try {
        const res = await api.get(`/rides/${id}`);
        setRide(res.data);
      } catch (err) {
        console.error("Error fetching ride", err);
        setError("Could not load ride details. Please try again.");
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
                const updatedPassengers = prev.passengers.map(p => {
                    if (p.userId === currentUser.id) {
                        return { ...p, fareToPay: data.newFare };
                    }
                    return p;
                });
                return {
                    ...prev,
                    passengers: updatedPassengers,
                    pricing: { ...prev.pricing, currentTotal: data.totalFare }
                };
            });
        });
    }

    return () => {
        if (socket) socket.off('fare_updated');
    };
  }, [id, currentUser.id]);

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  if (error) return <div className="p-10 text-center text-red-500 bg-red-50 rounded-lg m-4">{error}</div>;
  if (!ride) return <div className="p-10 text-center text-gray-500">Ride not found</div>;

  // --- 🛑 CRITICAL FIX: Handle Nested GeoJSON Structure ---
  // The Schema saves it as: route.start.location.coordinates
  const getCoordinates = (point) => {
    if (point && point.location && point.location.coordinates) {
        return point.location.coordinates; // [lng, lat]
    }
    // Fallback for older data or different structure
    if (point && point.coordinates) {
        return point.coordinates;
    }
    return null;
  };

  const startCoords = getCoordinates(ride.route?.start);
  const endCoords = getCoordinates(ride.route?.end);
  const hasValidRoute = startCoords && endCoords;

  const mapPickup = hasValidRoute ? { lat: startCoords[1], lng: startCoords[0] } : null;
  const mapDrop = hasValidRoute ? { lat: endCoords[1], lng: endCoords[0] } : null;
  // ---------------------------------------------------------

  const myPassengerData = ride.passengers.find(p => p.userId === currentUser.id) || {};
  const fareToPay = myPassengerData.fareToPay || 0;

  return (
    <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* LEFT COLUMN: LIVE MAP */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden h-[500px] relative border border-slate-200">
           {hasValidRoute ? (
               <MapComponent 
                  pickup={mapPickup} 
                  drop={mapDrop}
                  setPickup={() => {}} 
                  setDrop={() => {}} 
               />
           ) : (
               <div className="h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-3">
                   <Navigation size={48} className="opacity-20"/>
                   <p>Visual Route Loading...</p>
               </div>
           )}
           
           {/* Live Status Badge */}
           <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-sm z-[1000] flex items-center gap-2">
             <span className="w-3 h-3 bg-green-500 rounded-full animate-ping"></span>
             <span className="font-bold text-slate-700 text-sm">
                {ride.status === 'searching' ? 'Looking for Driver' : 'Ride in Progress'}
             </span>
           </div>
        </div>

        {/* DRIVER INFO CARD */}
        <div className="bg-white p-6 rounded-xl shadow-md flex justify-between items-center border border-slate-100">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xl">
                  🚗
                </div>
                <div>
                    <h3 className="font-bold text-lg text-slate-800">
                        {ride.driver ? ride.driver.name : "Finding Driver..."}
                    </h3>
                    <p className="text-slate-500 text-sm">
                        {ride.driver ? "Toyota Etios • MH 12 AB 1234" : "Connecting to nearby drivers"}
                    </p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Safe-Start OTP</p>
                <p className="text-2xl font-mono font-bold text-slate-800 tracking-widest">
                    {ride.safety?.otp || "7291"}
                </p>
            </div>
        </div>
      </div>

      {/* RIGHT COLUMN: FARE & ACTIONS */}
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-xl shadow-xl">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <p className="text-indigo-200 text-sm">Your Fair Share</p>
                    <h2 className="text-4xl font-bold mt-1">₹{fareToPay.toFixed(0)}</h2>
                </div>
                <div className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <TrendingDown size={14} />
                    Dynamic Pricing
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <span>Passenger</span>
                    <span>Split</span>
                </div>
                <div className="divide-y divide-white/10">
                    {ride.passengers.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center py-3">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold">
                                    {p.name ? p.name[0] : 'U'}
                                </div>
                                <span className="text-sm font-medium">
                                    {p.name} {p.userId === currentUser.id && <span className="text-indigo-300">(You)</span>}
                                </span>
                            </div>
                            <span className="text-sm font-mono opacity-90">₹{p.fareToPay?.toFixed(0) || 0}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <button className="flex flex-col items-center justify-center gap-2 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100">
                <Share2 className="text-indigo-600" size={20} />
                <span className="text-xs font-bold text-gray-700">Track Link</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-2 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition border border-red-100 group">
                <ShieldCheck className="text-red-500 group-hover:scale-110 transition-transform" size={20} />
                <span className="text-xs font-bold text-red-600">SOS Alert</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default ActiveRideDisplay;