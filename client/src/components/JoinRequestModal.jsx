import React, { useState } from 'react';
import api from '../services/api';
import { User, MapPin, CheckCircle, XCircle, TrendingDown } from 'lucide-react';

export default function JoinRequestModal({ request, rideId, onClose }) {
  const [loading, setLoading] = useState(false);

  if (!request) return null;

  const handleResponse = async (approve) => {
    setLoading(true);
    try {
      // Matches the controller: exports.approveJoinRequest
      // Route expected: POST /api/rides/:rideId/approve/:requesterId
      await api.post(`/rides/${rideId}/approve/${request.requesterId}`, { 
        approve 
        // Note: pickup/drop are already stored in DB "approvals" array, 
        // so we don't strictly need to send them again, but it's safe.
      });
      onClose(); 
    } catch (err) {
      console.error('Failed to respond to join request', err);
      alert('Error responding to request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-indigo-600 p-6 text-white text-center">
          <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-3 backdrop-blur-md">
            <User size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold">New Join Request</h2>
          <p className="text-indigo-100 text-sm">A passenger wants to share your ride</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          <div className="text-center">
             <h3 className="text-xl font-bold text-slate-800">{request.requesterName}</h3>
             <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold mt-2">
                <TrendingDown size={14} /> Fares will reduce
             </div>
          </div>

          {/* Route Preview */}
          <div className="bg-slate-50 p-4 rounded-xl space-y-4 border border-slate-100">
             <div className="flex gap-3">
                <div className="mt-1">
                   <div className="w-2 h-2 rounded-full bg-green-500 ring-2 ring-white shadow-sm"></div>
                </div>
                <div>
                   <p className="text-xs text-slate-400 font-bold uppercase">Their Pickup</p>
                   <p className="text-sm font-medium text-slate-700 leading-tight">
                      {request.pickup?.name || "Pinned Location"}
                   </p>
                </div>
             </div>
             
             <div className="h-px bg-slate-200 ml-2"></div>

             <div className="flex gap-3">
                <div className="mt-1">
                   <div className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-white shadow-sm"></div>
                </div>
                <div>
                   <p className="text-xs text-slate-400 font-bold uppercase">Their Drop</p>
                   <p className="text-sm font-medium text-slate-700 leading-tight">
                      {request.drop?.name || "Pinned Location"}
                   </p>
                </div>
             </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              onClick={() => handleResponse(false)}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              <XCircle size={20} />
              Reject
            </button>
            <button
              onClick={() => handleResponse(true)}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></span>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Accept
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}