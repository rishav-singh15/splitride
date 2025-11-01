const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['join_request', 'ride_accepted', 'fare_updated', 'join_rejected'],
    required: true
  },
  message: { type: String, required: true },
  rideId: { type: Schema.Types.ObjectId, ref: 'Ride' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', NotificationSchema);