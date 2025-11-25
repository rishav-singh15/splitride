const mongoose = require('mongoose');

const RideSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // --- GEOJSON SUPPORT ---
  route: {
    start: {
      name: { type: String, required: true },
      location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], required: true } // [Longitude, Latitude]
      }
    },
    end: {
      name: { type: String, required: true }, 
      location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], required: true }
      }
    },
    totalDistance: { type: Number, default: 0 } // In km
  },
  
  passengers: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pickup: {
      name: String,
      coordinates: [Number] 
    },
    drop: {
      name: String,
      coordinates: [Number]
    },
    seatNumber: Number,
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected', 'picked_up', 'dropped_off'],
      default: 'approved' 
    },
    fareShare: { type: Number, default: 0 },      
    distanceTraveled: { type: Number, default: 0 } 
  }],

  // --- RESTORED: Join Request Persistence ---
  approvals: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pickup: {
      name: String,
      coordinates: [Number]
    },
    drop: {
      name: String,
      coordinates: [Number]
    },
    status: { 
      type: String, 
      enum: ['pending', 'rejected'], 
      default: 'pending' 
    }
  }],

  maxPassengers: { type: Number, default: 3 }, 

  status: {
    type: String,
    enum: ['searching', 'scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'searching'
  },
  
  pricing: {
    baseFare: { type: Number, default: 0 },
    currentTotal: { type: Number, default: 0 }
  },
  
  safety: {
    otp: { type: String }, 
    isVerified: { type: Boolean, default: false },
    shareToken: { type: String }
  }
}, { timestamps: true });

// Index for Geospatial queries (Essential for "Find Rides Near Me")
RideSchema.index({ "route.start.location": "2dsphere" });

module.exports = mongoose.model('Ride', RideSchema);