const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PassengerSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  name: { type: String },
  joinedAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'paid', 'cancelled'], 
    default: 'pending' 
  },
  fareToPay: { type: Number, default: 0 },
  seatNumber: { type: Number }
});

const ApprovalSchema = new Schema({
  requestedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  }
});

const RideSchema = new Schema({
  driver: {
    id: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String },
    vehicle: { type: Object }
  },
  route: {
    start: { type: String, required: true },
    end: { type: String, required: true },
    distance: { type: Number } // in km
  },
  pricing: {
    baseFare: { type: Number, required: true, default: 0 },
    incrementPerPassenger: { type: Number, required: true, default: 0 },
    currentTotal: { type: Number, default: 0 },
    perPersonFare: { type: Number, default: 0 }
  },
  passengers: [PassengerSchema],
  status: {
    type: String,
    enum: ['searching', 'ongoing', 'completed', 'cancelled'],
    default: 'searching'
  },
  maxPassengers: { type: Number, default: 3 },
  approvals: [ApprovalSchema],
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

module.exports = mongoose.model('Ride', RideSchema);