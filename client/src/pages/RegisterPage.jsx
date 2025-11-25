import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, Lock, Car, AlertCircle, ChevronRight } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'passenger',
    vehicleNumber: '',
    vehicleType: '',
    vehicleCapacity: 2,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const userData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      role: formData.role,
    };

    if (formData.role === 'driver') {
      userData.vehicle = {
        number: formData.vehicleNumber,
        type: formData.vehicleType,
        capacity: parseInt(formData.vehicleCapacity, 10),
      };
    }

    try {
        await register(userData);
        navigate('/'); // Redirect to Dashboard
    } catch (err) {
        setError(err.message || 'Registration failed. Please try again.');
        setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 py-10">
      <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-2xl shadow-xl border border-slate-100">
        
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-800">Create Account</h2>
            <p className="text-slate-500">Join the SplitRide community</p>
        </div>

        {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
                <AlertCircle size={16} /> {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Toggle Role */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-6">
                <button
                    type="button"
                    onClick={() => setFormData({...formData, role: 'passenger'})}
                    className={`py-2 text-sm font-bold rounded-lg transition-all ${formData.role === 'passenger' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                    Passenger
                </button>
                <button
                    type="button"
                    onClick={() => setFormData({...formData, role: 'driver'})}
                    className={`py-2 text-sm font-bold rounded-lg transition-all ${formData.role === 'driver' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                    Driver
                </button>
            </div>

            {/* Standard Fields */}
            <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                    <User className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input name="name" placeholder="Full Name" onChange={handleChange} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" required />
                </div>
                <div className="relative">
                    <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input name="phone" type="tel" placeholder="Phone" onChange={handleChange} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" required />
                </div>
            </div>

            <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                <input name="email" type="email" placeholder="Email Address" onChange={handleChange} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" required />
            </div>

            <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                <input name="password" type="password" placeholder="Create Password" onChange={handleChange} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" required />
            </div>

            {/* Conditional Driver Fields */}
            {formData.role === 'driver' && (
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-3 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-2 text-indigo-900 font-bold mb-2">
                        <Car size={18} /> Driver Details
                    </div>
                    <input name="vehicleNumber" placeholder="Vehicle Number (e.g. MH-12-AB-1234)" onChange={handleChange} className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" required />
                    <div className="grid grid-cols-2 gap-4">
                        <input name="vehicleType" placeholder="Model (e.g. Swift)" onChange={handleChange} className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl outline-none" required />
                        <input name="vehicleCapacity" type="number" placeholder="Seats" onChange={handleChange} value={formData.vehicleCapacity} className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl outline-none" required />
                    </div>
                </div>
            )}

            <button type="submit" disabled={loading} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 mt-4">
                {loading ? 'Creating Account...' : (
                    <>
                        Start Riding <ChevronRight size={20} />
                    </>
                )}
            </button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-bold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}