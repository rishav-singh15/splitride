const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead } = require('../controllers/notificationController');
const auth = require('../middleware/auth');

// @route   GET api/notifications
// @desc    Get user's unread notifications
// @access  Private
router.get('/', auth, getNotifications);

// @route   PUT api/notifications/read/:id
// @desc    Mark a notification as read
// @access  Private
router.put('/read/:id', auth, markAsRead);

module.exports = router;