const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const auth = require('../middleware/auth');

// =================================================================
// 🚨 IMPORTANT: SPECIFIC ROUTES MUST COME FIRST
// =================================================================

// 1. Get available/searching rides (For Driver List)
router.get('/available', auth, rideController.getAvailableRides);
router.get('/searching', auth, rideController.getAvailableRides); // Alias for legacy code

// 2. Get active ride for current user (For Passenger Dashboard)
router.get('/active', auth, rideController.getActiveRide);

// 3. Get active ride for driver (For Driver Dashboard)
router.get('/active-driver', auth, rideController.getActiveDriverRide);

// 4. Legacy/Other specific routes
router.get('/joinable', auth, rideController.getJoinableRides);


// =================================================================
// 📝 ACTION ROUTES (POST/PUT)
// =================================================================
router.post('/create', auth, rideController.createRide);
router.post('/accept/:rideId', auth, rideController.acceptRide);
router.post('/join/:rideId', auth, rideController.requestJoinRide);
router.post('/approve/:rideId/:requesterId', auth, rideController.approveJoinRequest);
router.post('/complete/:rideId', auth, rideController.completeRide);

// Status update (used by Driver to start/end ride)
router.put('/:id/status', auth, async (req, res) => {
    try {
        const Ride = require('../models/Ride');
        const { status } = req.body;
        const ride = await Ride.findByIdAndUpdate(req.params.id, { status }, { new: true });
        
        // Notify via socket
        const io = req.app.get('io');
        io.to(req.params.id).emit('ride_updated', ride);
        
        res.json(ride);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// =================================================================
// ⚠️ WILDCARD ROUTE (MUST BE LAST)
// =================================================================
// This matches ANYTHING not matched above.
// If you put /searching below this, it will fail.
router.get('/:id', auth, rideController.getRideById); 

module.exports = router;