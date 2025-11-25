import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import socket from '../services/socket'; // Your existing socket instance
import MapComponent from './MapComponent';
import { Share2, ShieldCheck, Users, TrendingDown } from 'lucide-react';

const ActiveRideDisplay = () => {
  const { id } = useParams();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUser = JSON.parse(localStorage.getItem('user')); // Assuming user is in local storage

  useEffect(() => {
    // 1. Fetch initial ride data
    const fetchRide = async () => {
      try {
        const res = await api.get(`/rides/${id}`);
        setRide(res.data);
      } catch (err) {
        console.error("Error fetching ride", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRide();

    // 2. LISTEN FOR REAL-TIME FARE UPDATES (The "Wow" Factor)
    socket.emit('join_ride', id);
    
    socket.on('fare_updated', (data) => {
      // data contains: { newFare, savings, totalFare, message }
      // We perform a "Optimistic UI Update" to animate the change instantly
      setRide(prev => {
        if (!prev) return prev;
        
        // Update the current user's fare in the passengers list
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
      
      // Optional: Trigger a toast notification here with data.message
      alert(data.message); 
    });

    return () => {
      socket.off('fare_updated');
    };
  }, [id, currentUser.id]);

  if (loading) return <div className="p-10 text-center animate-pulse">Loading Ride Details...</div>;
  if (!ride) return <div className="p-10 text-center text-red-500">Ride not found</div>;

  // Find current user's specific details
  const myPassengerData = ride.passengers.find(p => p.userId === currentUser.id) || {};
  
  // Calculate Savings for display (Mock logic for MVP display)
  const soloCost = (myPassengerData.fareToPay || 0) * 1.25; 
  const savingsAmount = (soloCost - myPassengerData.fareToPay).toFixed(0);

  // Convert schema coordinates back to Map object format {lat, lng}
  const mapPickup = { 
    lat: ride.route.start.coordinates[1], 
    lng: ride.route.start.coordinates[0] 
  };
  const mapDrop = { 
    lat: ride.route.end.coordinates[1], 
    lng: ride.route.end.coordinates[0] 
  };

  return (
    <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* LEFT COLUMN: LIVE MAP (2/3 width) */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden h-[500px] relative border border-slate-200">
           {/* Reusing MapComponent in 'View Mode' (passing null setters prevents clicking) */}
           <MapComponent 
              pickup={mapPickup} 
              drop={mapDrop}
              setPickup={() => {}} // No-op to disable changing location
              setDrop={() => {}} 
           />
           
           {/* Live Status Badge */}
           <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-sm z-[1000] flex items-center gap-2">
             <span className="w-3 h-3 bg-green-500 rounded-full animate-ping"></span>
             <span className="font-bold text-slate-700 text-sm">Ride in Progress</span>
           </div>
        </div>

        {/* DRIVER INFO CARD */}
        <div className="bg-white p-6 rounded-xl shadow-md flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl">🚗</div>
                <div>
                    <h3 className="font-bold text-lg">{ride.driver ? ride.driver.name : "Waiting for Driver..."}</h3>
                    <p className="text-slate-500 text-sm">{ride.driver ? "Toyota Etios • MH 12 AB 1234" : "Searching nearby..."}</p>
                </div>
            </div>
            {/* SAFETY FEATURE: OTP */}
            <div className="text-right">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Start OTP</p>
                <p className="text-2xl font-mono font-bold text-slate-800 tracking-widest">
                  {ride.safety?.otp || "7291"} 
                </p>
            </div>
        </div>
      </div>

      {/* RIGHT COLUMN: FARE & ACTIONS (1/3 width) */}
      <div className="space-y-4">
        
        {/* 1. DYNAMIC FARE CARD */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-xl shadow-xl">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <p className="text-indigo-200 text-sm">Your Current Fare</p>
                    <h2 className="text-4xl font-bold mt-1">₹{myPassengerData.fareToPay?.toFixed(0)}</h2>
                </div>
                <div className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <TrendingDown size={14} />
                    Saved ₹{savingsAmount}
                </div>
            </div>

            {/* Visualizing the Split */}
            <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Passenger Split</p>
                {ride.passengers.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs">
                                {p.name[0]}
                            </div>
                            <span className="text-sm font-medium">{p.name} {p.userId === currentUser.id && "(You)"}</span>
                        </div>
                        <span className="text-sm font-mono opacity-80">₹{p.fareToPay?.toFixed(0)}</span>
                    </div>
                ))}
            </div>
            
            <p className="text-xs text-center text-indigo-300 mt-6">
                *Fare decreases automatically when more people join.
            </p>
        </div>

        {/* 2. SAFETY ACTIONS */}
        <div className="grid grid-cols-2 gap-4">
            <button className="flex flex-col items-center justify-center gap-2 bg-white p-4 rounded-xl shadow hover:bg-gray-50 transition border border-gray-100">
                <Share2 className="text-indigo-600" />
                <span className="text-xs font-bold text-gray-700">Share Live Link</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-2 bg-white p-4 rounded-xl shadow hover:bg-red-50 transition border border-red-100 group">
                <ShieldCheck className="text-red-500 group-hover:animate-pulse" />
                <span className="text-xs font-bold text-red-600">Emergency SOS</span>
            </button>
        </div>

        {/* 3. DEBUG INFO (Remove before demo) */}
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-xs text-yellow-800">
            <p className="font-bold mb-1">👨‍💻 Dev Mode (Show to Recruiter):</p>
            <p>Algorithm: Distance-Weighted</p>
            <p>Distance: {ride.route.totalDistance || "Calculating..."} km</p>
            <p>Pool Size: {ride.passengers.length} Users</p>
        </div>

      </div>
    </div>
  );
};

export default ActiveRideDisplay;