const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['passenger', 'driver'],
    required: true
  },
  rating: { type: Number, default: 5 },
  totalRides: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },

  // --- Driver-specific fields ---
  vehicle: {
    number: { type: String },
    type: { type: String }, // e.g., Auto, Sedan, SUV
    capacity: { type: Number }
  },
  
  // --- Payment methods (simplified) ---
  paymentMethods: [{
    type: { type: String }, // e.g., 'card', 'upi'
    details: { type: String }
  }]
});
// We'll add password hashing methods here later (in auth phase)
module.exports = mongoose.model('User', UserSchema);