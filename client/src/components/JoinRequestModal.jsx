import React from 'react';
import api from '../services/api';

export default function JoinRequestModal({ request, rideId, onClose }) {
  if (!request) return null;

  const handleResponse = async (approve) => {
    try {
      await api.post(`/rides/approve/${rideId}/${request.requesterId}`, { approve });
      onClose(); // Close the modal
    } catch (err) {
      console.error('Failed to respond to join request', err);
      alert('Error responding to request.');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="p-6 bg-white rounded-lg shadow-xl">
        <h2 className="mb-4 text-xl font-bold">New Join Request!</h2>
        <p><span className="font-semibold">{request.requesterName}</span> wants to join your ride.</p>
        <p>Your new fare would be: <span className="font-bold">${request.newFare.toFixed(2)}</span></p>
        <div className="flex justify-end mt-6 space-x-4">
          <button
            onClick={() => handleResponse(false)}
            className="px-4 py-2 font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Reject
          </button>
          <button
            onClick={() => handleResponse(true)}
            className="px-4 py-2 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}