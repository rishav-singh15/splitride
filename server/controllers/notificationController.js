const Notification = require('../models/Notification');

// --- Helper function to create a notification ---
// We'll import this into rideController
exports.createNotification = async (io, userId, type, message, rideId) => {
  try {
    const notification = new Notification({
      userId,
      type,
      message,
      rideId
    });
    await notification.save();

    // --- EMIT REAL-TIME EVENT ---
    // We send this to the user's private room so they get a live update
    io.to(userId.toString()).emit('new_notification', notification);

  } catch (err) {
    console.error('Error creating notification:', err.message);
  }
};

// --- Get all unread notifications for a user ---
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user.id,
      read: false
    }).sort({ createdAt: -1 });
    
    res.json(notifications);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// --- Mark a notification as read ---
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    // Ensure the notification belongs to the user
    if (notification.userId.toString() !== req.user.id) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    notification.read = true;
    await notification.save();
    
    res.json(notification);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};