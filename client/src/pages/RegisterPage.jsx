import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

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

    const success = await register(userData);
    if (success) {
      navigate('/dashboard'); // Redirect to dashboard on successful registration
    } else {
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form onSubmit={handleSubmit} className="p-8 bg-white rounded-lg shadow-md w-96">
        <h2 className="mb-6 text-2xl font-bold text-center">Register</h2>
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        
        {/* Standard Fields */}
        <input name="name" placeholder="Name" onChange={handleChange} className="w-full px-3 py-2 mb-4 border rounded-lg" required />
        <input name="email" type="email" placeholder="Email" onChange={handleChange} className="w-full px-3 py-2 mb-4 border rounded-lg" required />
        <input name="phone" type="tel" placeholder="Phone" onChange={handleChange} className="w-full px-3 py-2 mb-4 border rounded-lg" required />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} className="w-full px-3 py-2 mb-4 border rounded-lg" required />

        {/* Role Selector */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">I am a...</label>
          <select name="role" onChange={handleChange} value={formData.role} className="w-full px-3 py-2 border rounded-lg">
            <option value="passenger">Passenger</option>
            <option value="driver">Driver</option>
          </select>
        </div>

        {/* Conditional Driver Fields */}
        {formData.role === 'driver' && (
          <div className="p-4 mb-4 border-t">
            <h3 className="mb-2 font-semibold">Driver Details</h3>
            <input name="vehicleNumber" placeholder="Vehicle Number (e.g., ABC-123)" onChange={handleChange} className="w-full px-3 py-2 mb-4 border rounded-lg" required />
            <input name="vehicleType" placeholder="Vehicle Type (e.g., Sedan)" onChange={handleChange} className="w-full px-3 py-2 mb-4 border rounded-lg" required />
            <input name="vehicleCapacity" type="number" placeholder="Capacity (e.g., 3)" onChange={handleChange} value={formData.vehicleCapacity} className="w-full px-3 py-2 mb-4 border rounded-lg" required />
          </div>
        )}

        <button type="submit" className="w-full py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
          Register
        </button>
        <p className="mt-4 text-sm text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}