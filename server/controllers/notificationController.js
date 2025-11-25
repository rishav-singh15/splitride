const Notification = require('../models/Notification');

// --- Helper: Create & Emit Notification ---
exports.createNotification = async (io, userId, type, message, rideId) => {
  try {
    // 1. Save to DB
    const notification = new Notification({
      userId,
      type,
      message,
      rideId
    });
    await notification.save();

    // 2. Emit Real-time Event (if Socket.io instance is provided)
    if (io) {
        // Emit to the specific user's room (userId)
        io.to(userId.toString()).emit('new_notification', notification);
    }

  } catch (err) {
    console.error('Error creating notification:', err.message);
    // We don't crash the request here, just log the error
  }
};

// --- Get Unread Notifications ---
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user.id,
      read: false
    }).sort({ createdAt: -1 }); // Newest first
    
    res.json(notifications);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// --- Mark as Read ---
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Authorization check
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