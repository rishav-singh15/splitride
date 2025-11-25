import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // Assuming you have an axios instance set up
import MapComponent from './MapComponent'; // Import the new Map component
import { MapPin, Navigation, Clock, CreditCard } from 'lucide-react'; // Icons for UI polish

const BookRideForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // STATE: Coordinates for the Map (The most important part)
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords, setDropCoords] = useState(null);

  // STATE: Basic ride details
  const [seats, setSeats] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 1. VALIDATION: Ensure points are pinned on the map
    if (!pickupCoords || !dropCoords) {
      setError('Please select both Pickup and Drop locations on the map.');
      setLoading(false);
      return;
    }

    try {
      // 2. DATA FORMATTING: Convert Map Objects {lat, lng} to Backend GeoJSON [lng, lat]
      // Note: MongoDB uses [Longitude, Latitude] order.
      const rideData = {
        pickup: {
          name: "Pinned Location", // You can add reverse geocoding later to get real names
          coordinates: [pickupCoords.lng, pickupCoords.lat]
        },
        drop: {
          name: "Destination",
          coordinates: [dropCoords.lng, dropCoords.lat]
        },
        seatsRequested: seats,
        paymentMethod
      };

      // 3. API CALL
      const response = await api.post('/rides/create', rideData);
      
      if (response.data.success) {
        // Redirect to the Active Ride page with the new ride ID
        navigate(`/ride/${response.data.ride._id}`);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to book ride');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden my-8">
      <div className="p-6 bg-slate-900 text-white">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Navigation className="w-6 h-6" />
          Book a SplitRide
        </h2>
        <p className="text-slate-400 text-sm mt-1">Pin your locations to see fare estimates</p>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* LEFT COLUMN: THE MAP */}
        <div className="order-2 md:order-1 h-[400px] md:h-auto min-h-[400px]">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Route (Click on Map)
          </label>
          <div className="h-full w-full rounded-lg border-2 border-slate-100 overflow-hidden">
            {/* The Map Component handles the visual interactions */}
            <MapComponent 
              pickup={pickupCoords} 
              drop={dropCoords} 
              setPickup={setPickupCoords} 
              setDrop={setDropCoords} 
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
             <span className={pickupCoords ? "text-green-600 font-bold" : ""}>
               ● Pickup: {pickupCoords ? "Set" : "Not Set"}
             </span>
             <span className={dropCoords ? "text-red-600 font-bold" : ""}>
               ● Drop: {dropCoords ? "Set" : "Not Set"}
             </span>
          </div>
        </div>

        {/* RIGHT COLUMN: THE FORM */}
        <form onSubmit={handleSubmit} className="order-1 md:order-2 flex flex-col justify-center space-y-6">
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          {/* Seat Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Seats Required
            </label>
            <div className="flex gap-4">
              {[1, 2, 3].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setSeats(num)}
                  className={`flex-1 py-2 rounded-lg border ${
                    seats === num 
                    ? 'bg-slate-900 text-white border-slate-900' 
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="wallet">SplitWallet</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-md transition-all ${
              loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-emerald-500 hover:bg-emerald-600 text-white hover:shadow-lg'
            }`}
          >
            {loading ? 'Calculating Route...' : 'Find Ride Now'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookRideForm;