const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const auth = require('../middleware/auth');

// --- 1. NEW ROUTES (Required for the Fixes) ---

// Get all rides waiting for a driver (For JoinableRidesList.jsx)
router.get('/available', auth, rideController.getAvailableRides);

// Get a specific ride by ID (For ActiveRideDisplay.jsx & DriverActiveRide.jsx)
// 🚨 IMPORTANT: This must be placed AFTER specific routes like /available, /searching, etc.
// If placed before, it would trap "available" as an "id"
router.get('/:id', auth, rideController.getRideById); 


// --- 2. EXISTING ROUTES (Kept from your code) ---

// @route   POST api/rides/create
router.post('/create', auth, rideController.createRide);

// @route   POST api/rides/accept/:rideId
router.post('/accept/:rideId', auth, rideController.acceptRide);

// @route   POST api/rides/join/:rideId
router.post('/join/:rideId', auth, rideController.requestJoinRide);

// @route   POST api/rides/approve/:rideId/:requesterId
router.post('/approve/:rideId/:requesterId', auth, rideController.approveJoinRequest);

// Legacy/Other Routes (Kept safe)
router.get('/searching', auth, rideController.getSearchingRides);
router.get('/active', auth, rideController.getActiveRide);
router.get('/joinable', auth, rideController.getJoinableRides);
router.get('/active-driver', auth, rideController.getActiveDriverRide);
router.post('/complete/:rideId', auth, rideController.completeRide);

module.exports = router;