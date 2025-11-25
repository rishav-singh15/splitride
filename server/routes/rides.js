const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const auth = require('../middleware/auth');
const Ride = require('../models/Ride'); // Required for the inline status update

// =================================================================
// 🚨 SECTION 1: SPECIFIC GET ROUTES (MUST COME FIRST)
// =================================================================

// Driver finding rides
router.get('/available', auth, rideController.getAvailableRides);
router.get('/searching', auth, rideController.getAvailableRides); // Alias
router.get('/joinable', auth, rideController.getJoinableRides);   // Alias

// Dashboard loaders
router.get('/active', auth, rideController.getActiveRide);
router.get('/active-driver', auth, rideController.getActiveDriverRide);


// =================================================================
// 📝 SECTION 2: ACTION ROUTES (POST/PUT)
// =================================================================

router.post('/create', auth, rideController.createRide);
router.post('/accept/:rideId', auth, rideController.acceptRide);
router.post('/join/:rideId', auth, rideController.requestJoinRide);
router.post('/approve/:rideId/:requesterId', auth, rideController.approveJoinRequest);
router.post('/complete/:rideId', auth, rideController.completeRide);

// SPECIAL: Status Update (Used by Driver to 'Start' or 'End' ride)
// We handle this inline here to ensure it works without a separate controller export
router.put('/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        // Validate status
        if (!['ongoing', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const ride = await Ride.findByIdAndUpdate(
            req.params.id, 
            { status }, 
            { new: true }
        );

        if (!ride) return res.status(404).json({ error: "Ride not found" });

        // Notify via socket
        const io = req.app.get('io');
        io.to(req.params.id).emit('ride_updated', ride);
        
        res.json(ride);
    } catch (err) {
        console.error("Status Update Error:", err);
        res.status(500).json({ error: err.message });
    }
});


// =================================================================
// ⚠️ SECTION 3: WILDCARD ROUTE (MUST BE ABSOLUTELY LAST)
// =================================================================
// This matches ANY GET request that wasn't caught above.
// If you put /active below this, the code thinks "active" is an ID.
router.get('/:id', auth, rideController.getRideById); 

module.exports = router;