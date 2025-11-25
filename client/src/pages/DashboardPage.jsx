import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { MapPin, Clock, ArrowRight, Car, User, Navigation } from 'lucide-react';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeRide, setActiveRide] = useState(null);
  const [availableRides, setAvailableRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Load User & Data
    const loadDashboard = async () => {
        try {
            const userStr = localStorage.getItem('user');
            const userData = userStr ? JSON.parse(userStr) : null;
            setUser(userData);

            if (userData?.role === 'driver') {
                // DRIVER: Fetch available rides
                const res = await api.get('/rides/available');
                setAvailableRides(res.data);
                
                // Check if already in a ride
                try {
                    const activeRes = await api.get('/rides/driver/active');
                    if (activeRes.data) navigate('/driver/ride'); 
                } catch (e) { /* No active ride */ }

            } else {
                // PASSENGER: Check if already in a ride
                try {
                    const res = await api.get('/rides/active');
                    if (res.data) {
                        setActiveRide(res.data);
                    }
                } catch (e) { /* No active ride */ }
            }
        } catch (err) {
            console.error("Dashboard Load Error:", err);
        } finally {
            setLoading(false);
        }
    };
    loadDashboard();
  }, [navigate]);

  // --- ACTIONS ---
  const handleAcceptRide = async (rideId) => {
      try {
          // Driver sets base fare (hardcoded to 50 for MVP)
          await api.post(`/rides/${rideId}/accept`, { baseFare: 50 });
          navigate('/driver/ride');
      } catch (err) {
          alert("Failed to accept ride: " + (err.response?.data?.error || err.message));
      }
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Loading Dashboard...</div>;

  // ==========================================
  // VIEW 1: PASSENGER DASHBOARD
  // ==========================================
  if (user?.role === 'passenger') {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* HERO SECTION */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
                <h1 className="text-3xl font-bold mb-2">Hello, {user.name} 👋</h1>
                <p className="text-indigo-200 mb-6">Where do you want to go today?</p>
                
                {activeRide ? (
                     <button 
                        onClick={() => navigate(`/ride/${activeRide._id}`)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all"
                     >
                        <Car /> Back to Current Ride
                     </button>
                ) : (
                    <button 
                        onClick={() => navigate('/book')}
                        className="bg-white text-indigo-900 px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-50 transition-all shadow-md"
                    >
                        Book a New Ride <ArrowRight size={18} />
                    </button>
                )}
            </div>
            {/* Decor */}
            <Car className="absolute -right-10 -bottom-10 w-64 h-64 text-white/5 rotate-12" />
        </div>

        {/* ACTIVE RIDE CARD (If exists) */}
        {activeRide && (
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
                <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-emerald-500"/> Ride in Progress
                </h2>
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-sm text-slate-500">Destination</p>
                        {/* Safe Name Access */}
                        <p className="font-bold text-lg">{activeRide.route?.end?.name || "Selected Location"}</p>
                    </div>
                    <button 
                        onClick={() => navigate(`/ride/${activeRide._id}`)}
                        className="text-indigo-600 font-bold text-sm hover:underline"
                    >
                        View Live Tracking &rarr;
                    </button>
                </div>
            </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 2: DRIVER DASHBOARD
  // ==========================================
  return (
    <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Driver Console 🚖</h1>
                <p className="text-slate-500">Find passengers near you</p>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
                <span className="text-emerald-600 font-bold">● Online</span>
            </div>
        </div>

        {/* RIDE FEED */}
        {availableRides.length === 0 ? (
            <div className="bg-white p-12 rounded-xl text-center shadow-sm border border-slate-100">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Car className="text-slate-400" size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-700">No requests nearby</h3>
                <p className="text-slate-500">Requests will pop up here in real-time.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableRides.map(ride => (
                    <div key={ride._id} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-slate-100">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                    <User size={18} />
                                </div>
                                <div>
                                    {/* Safe Name Access */}
                                    <h3 className="font-bold text-slate-800">{ride.passengers[0]?.user?.name || "Passenger"}</h3>
                                    <p className="text-xs text-slate-500">⭐ 4.8 Rating</p>
                                </div>
                            </div>
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">
                                {ride.seatsRequested || 1} Seat(s)
                            </span>
                        </div>

                        <div className="space-y-3 mb-6 relative pl-4 border-l-2 border-slate-100">
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Pickup</p>
                                <p className="text-sm font-medium text-slate-700 flex items-start gap-2">
                                   <MapPin size={14} className="mt-1 text-green-500"/>
                                   {ride.route?.start?.name || "Map Location"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Drop</p>
                                <p className="text-sm font-medium text-slate-700 flex items-start gap-2">
                                   <MapPin size={14} className="mt-1 text-red-500"/>
                                   {ride.route?.end?.name || "Map Location"}
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={() => handleAcceptRide(ride._id)}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-bold transition-colors"
                        >
                            Accept Ride (₹50 Base)
                        </button>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

export default DashboardPage; // <--- THIS LINE WAS MISSING OR BROKEN