const mongoose = require('mongoose');

const RideSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // --- UPDATED SECTION: GEOJSON SUPPORT ---
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
  // ----------------------------------------
  
  passengers: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // We also store P&D for each passenger for the algorithm
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
      default: 'pending' 
    },
    fareShare: Number,        
    distanceTraveled: Number 
  }],

  seatsRequested: { type: Number, default: 1 },

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
    isVerified: { type: Boolean, default: false }
  }
}, { timestamps: true });

// Important: Create Index for Geospatial queries (finding rides near me)
RideSchema.index({ "route.start.location": "2dsphere" });

module.exports = mongoose.model('Ride', RideSchema);