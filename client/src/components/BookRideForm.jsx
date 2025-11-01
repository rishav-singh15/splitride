import React, { useState } from 'react';
import api from '../services/api'; // Our configured axios

export default function BookRideForm() {
  const [start, setStart] = useState('');
  const [end, setEnd] =useState('');
  const [isShared, setIsShared] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await api.post('/rides/create', { start, end, isShared });
      if (res.data.success) {
        setMessage(`Ride requested! Your ride ID is: ${res.data.ride._id}`);
        setStart('');
        setEnd('');
        setIsShared(false);
      }
    } catch (err) {
      console.error(err);
      setMessage('Failed to request ride. Please try again.');
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">Start Location</label>
          <input
            type="text"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="e.g., '123 Main St'"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">End Location</label>
          <input
            type="text"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="e.g., '456 Market St'"
            required
          />
        </div>
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isShared}
              onChange={(e) => setIsShared(e.target.checked)}
              className="mr-2"
            />
            Share this ride?
          </label>
        </div>
        <button type="submit" className="w-full py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
          Request Ride
        </button>
        {message && <p className="mt-4 text-sm text-center">{message}</p>}
      </form>
    </div>
  );
}