const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const auth = require('../middleware/auth');

// BASE ROUTE: /api/rides

// 1. Create a Ride (Passenger)
router.post('/create', auth, rideController.createRide);

// 2. Get Available Rides (Driver Feed)
router.get('/available', auth, rideController.getAvailableRides);
router.get('/searching', auth, rideController.getSearchingRides); // Alias

// 3. Get Active Ride Status
router.get('/active', auth, rideController.getActiveRide);
router.get('/driver/active', auth, rideController.getActiveDriverRide);

// 4. Get Specific Ride by ID
router.get('/:id', auth, rideController.getRideById);

// 5. Driver Actions
router.post('/:rideId/accept', auth, rideController.acceptRide);
router.post('/:rideId/complete', auth, rideController.completeRide);

// 6. Join Request Actions (Passenger 2)
router.post('/:rideId/join', auth, rideController.requestJoinRide);

// 7. Approval Actions (Passenger 1)
router.post('/:rideId/approve/:requesterId', auth, rideController.approveJoinRequest);

module.exports = router;