import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; 
import MapComponent from './MapComponent'; 
import { MapPin, Navigation, Clock, CreditCard, AlertCircle } from 'lucide-react'; 

const BookRideForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // STATE: Coordinates for the Map
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords, setDropCoords] = useState(null);

  // STATE: Basic ride details
  const [seats, setSeats] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 1. VALIDATION
    if (!pickupCoords || !dropCoords) {
      setError('Please tap the map to pin both Start and End locations.');
      setLoading(false);
      return;
    }

    try {
      // 2. DATA FORMATTING (Matching Backend Schema)
      const rideData = {
        pickup: {
          name: "Pinned Location", 
          coordinates: [pickupCoords.lng, pickupCoords.lat] // GeoJSON [lng, lat]
        },
        drop: {
          name: "Destination",
          coordinates: [dropCoords.lng, dropCoords.lat]
        },
        seatsRequested: seats,
        paymentMethod
      };

      // 3. API CALL
      // Using /rides/create which maps to createRide in controller
      const response = await api.post('/rides/create', rideData);
      
      if (response.data.success) {
        navigate(`/ride/${response.data.ride._id}`);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to book ride. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden my-8 border border-slate-100">
      <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Navigation className="w-6 h-6 text-emerald-400" />
            Book a SplitRide
          </h2>
          <p className="text-slate-400 text-sm mt-1">Pin your locations to see fare estimates</p>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT COLUMN: THE MAP */}
        <div className="order-2 lg:order-1 flex flex-col h-full min-h-[450px]">
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex justify-between">
            <span>Select Route</span>
            <span className="text-xs font-normal text-slate-500">Click map to pin points</span>
          </label>
          
          <div className="flex-grow w-full rounded-xl overflow-hidden shadow-inner border border-slate-200 relative">
            <MapComponent 
              pickup={pickupCoords} 
              drop={dropCoords} 
              setPickup={setPickupCoords} 
              setDrop={setDropCoords} 
            />
          </div>

          {/* Coordinate Feedback */}
          <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
             <div className={`p-2 rounded bg-slate-50 border ${pickupCoords ? "border-emerald-200 text-emerald-700" : "border-gray-200 text-gray-400"}`}>
               <span className="font-bold block">● Pickup</span>
               {pickupCoords ? `${pickupCoords.lat.toFixed(4)}, ${pickupCoords.lng.toFixed(4)}` : "Not set"}
             </div>
             <div className={`p-2 rounded bg-slate-50 border ${dropCoords ? "border-red-200 text-red-700" : "border-gray-200 text-gray-400"}`}>
               <span className="font-bold block">● Drop</span>
               {dropCoords ? `${dropCoords.lat.toFixed(4)}, ${dropCoords.lng.toFixed(4)}` : "Not set"}
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: THE FORM */}
        <form onSubmit={handleSubmit} className="order-1 lg:order-2 flex flex-col justify-center space-y-8 py-4">
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Seat Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Seats Required
            </label>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setSeats(num)}
                  className={`py-3 rounded-lg border font-medium transition-all ${
                    seats === num 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-105' 
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payment Method
            </label>
            <div className="relative">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-4 pl-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-slate-50 appearance-none"
              >
                <option value="cash">Cash Payment</option>
                <option value="upi">UPI / GPay</option>
                <option value="wallet">SplitWallet</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transform transition-all active:scale-95 ${
              loading 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' 
              : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                 <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"/>
                 Calculating Route...
              </span>
            ) : 'Find Ride Now'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookRideForm;