const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const auth = require('../middleware/auth'); // <--- Import auth

// --- We will add 'auth' middleware to all routes ---

// @route   POST api/rides/create
// @desc    Passenger creates a new ride request
// @access  Private
router.post('/create', auth, rideController.createRide); // <--- Add auth

// @route   POST api/rides/accept/:rideId
// @desc    Driver accepts a ride and sets pricing
// @access  Private
router.post('/accept/:rideId', auth, rideController.acceptRide); // <--- Add auth

// @route   POST api/rides/join/:rideId
// @desc    Passenger requests to join an existing shared ride
// @access  Private
router.post('/join/:rideId', auth, rideController.requestJoinRide); // <--- Add auth

// @route   POST api/rides/approve/:rideId/:requesterId
// @desc    Existing passenger approves/rejects a join request
// @access  Private
router.post('/approve/:rideId/:requesterId', auth, rideController.approveJoinRequest); // <--- Add auth
router.get('/searching', auth, rideController.getSearchingRides);
router.get('/active', auth, rideController.getActiveRide);
router.get('/joinable', auth, rideController.getJoinableRides);
router.get('/active-driver', auth, rideController.getActiveDriverRide);
router.post('/complete/:rideId', auth, rideController.completeRide);
module.exports = router;