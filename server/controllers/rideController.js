const Ride = require('../models/Ride');
const User = require('../models/User');

// --- HELPER: MATH FUNCTIONS ---
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Haversine formula for distance (in km)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// --- CORE ALGORITHM: DISTANCE WEIGHTED SPLIT (PHASE 2 LOGIC) ---
exports.recalculateFares = (ride) => {
  const BASE_RATE_PER_KM = 15; // ₹15 per km
  
  let totalDriverDistance = 0;
  
  if (!ride.passengers || ride.passengers.length === 0) return ride;

  // 1. Calculate individual distances
  ride.passengers.forEach(p => {
    // Safe navigation to prevent crashes on bad data
    if (p.pickup?.coordinates && p.drop?.coordinates) {
        // coordinates are [lng, lat], so index 1 is lat, 0 is lng
        const dist = calculateDistance(
            p.pickup.coordinates[1], p.pickup.coordinates[0], 
            p.drop.coordinates[1], p.drop.coordinates[0]
        );
        p.distanceTraveled = dist;
        totalDriverDistance += dist;
    }
  });

  // Overlap Factor: Assume 30% savings vs solo trips
  const optimizedDistance = totalDriverDistance * 0.7; 
  
  // 2. Calculate Total Cost for the whole Ride
  const totalRideCost = (optimizedDistance * BASE_RATE_PER_KM) + (ride.pricing.baseFare || 50);
  
  // Update Ride Totals
  ride.pricing.currentTotal = totalRideCost;
  
  // 3. Allocate Fairness (Weighted Split)
  ride.passengers.forEach(p => {
    if (totalDriverDistance > 0) {
        // Your share is proportional to your distance
        const sharePct = p.distanceTraveled / totalDriverDistance;
        p.fareShare = (totalRideCost * sharePct);
        
        // Cap at Solo Price (Individual Rationality - Game Theory)
        const soloPrice = (p.distanceTraveled * BASE_RATE_PER_KM) + 50;
        if (p.fareShare > soloPrice) {
            p.fareShare = soloPrice * 0.95; // Guaranteed 5% discount
        }
    }
  });

  return ride;
};

// ==========================================
// CONTROLLER FUNCTIONS
// ==========================================

// --- 1. CREATE RIDE ---
exports.createRide = async (req, res) => {
  try {
    const { pickup, drop, seatsRequested } = req.body;
    const userId = req.user.id;

    // Strict Validation for GeoJSON
    if (!pickup?.coordinates || !drop?.coordinates) {
      return res.status(400).json({ error: "Invalid location data. Map coordinates required." });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const ride = new Ride({
      driver: null,
      route: {
        start: {
          name: pickup.name || "Start Location",
          location: { type: "Point", coordinates: pickup.coordinates }
        },
        end: {
          name: drop.name || "Destination",
          location: { type: "Point", coordinates: drop.coordinates }
        }
      },
      passengers: [{
        user: userId,
        pickup: { name: pickup.name, coordinates: pickup.coordinates },
        drop: { name: drop.name, coordinates: drop.coordinates },
        status: 'approved',
        seatNumber: 1,
        fareShare: 0, 
        distanceTraveled: 0
      }],
      status: 'searching',
      pricing: { baseFare: 0, currentTotal: 0 },
      seatsRequested: seatsRequested || 1,
      safety: { otp, isVerified: false }
    });

    // Initial calculation (Solo ride)
    exports.recalculateFares(ride);
    await ride.save();

    const io = req.app.get('io');
    if (io) io.emit('new_ride_request', ride);

    res.json({ success: true, ride });
  } catch (error) {
    console.error("Create Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// --- 2. GET AVAILABLE RIDES ---
exports.getAvailableRides = async (req, res) => {
  try {
    const rides = await Ride.find({ status: 'searching' })
      .populate('passengers.user', 'name')
      .sort({ createdAt: -1 });
    res.json(rides);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 3. GET SPECIFIC RIDE ---
exports.getRideById = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('driver', 'name vehicle')
      .populate('passengers.user', 'name phone')
      .populate('approvals.user', 'name'); 
      
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    res.json(ride);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 4. ACCEPT RIDE (Driver) ---
exports.acceptRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { baseFare } = req.body; 
    const driverId = req.user.id;

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });

    ride.driver = driverId;
    ride.status = 'ongoing';
    ride.pricing.baseFare = Number(baseFare) || 50;

    exports.recalculateFares(ride);
    await ride.save();
    
    const io = req.app.get('io');
    io.to(rideId).emit('ride_updated', ride);
    
    // Notify Passenger 1
    if (ride.passengers[0]) {
        io.to(ride.passengers[0].user.toString()).emit('ride_accepted', { ride, baseFare });
    }

    res.json({ success: true, ride });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 5. JOIN REQUEST (Passenger 2) ---
exports.requestJoinRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const userId = req.user.id;
    const { pickup, drop } = req.body;

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });

    const exists = ride.passengers.some(p => p.user.toString() === userId) ||
                   ride.approvals.some(a => a.user.toString() === userId);
    
    if (exists) return res.status(400).json({ error: "Already requested or joined" });

    // 1. SAVE TO DATABASE (Persistence)
    ride.approvals.push({
        user: userId,
        pickup: { name: pickup.name || "Join Loc", coordinates: pickup.coordinates },
        drop: { name: drop.name || "Drop Loc", coordinates: drop.coordinates },
        status: 'pending'
    });
    
    await ride.save();
    
    // 2. EMIT REAL-TIME EVENT
    const io = req.app.get('io');
    // Notify all existing passengers (to show the Modal)
    ride.passengers.forEach(p => {
       io.to(p.user.toString()).emit('join_request', {
           rideId,
           requesterId: userId,
           requesterName: req.user.name,
           pickup, 
           drop
       });
    });

    res.json({ success: true, message: 'Request sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- 6. APPROVE JOIN (Passenger 1) ---
exports.approveJoinRequest = async (req, res) => {
  try {
    const { rideId, requesterId } = req.params;
    
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });

    // Find the pending request in DB
    const approvalIndex = ride.approvals.findIndex(
        a => a.user.toString() === requesterId && a.status === 'pending'
    );

    if (approvalIndex === -1) {
        return res.status(404).json({ error: 'Join request not found or already processed' });
    }

    const requestData = ride.approvals[approvalIndex];

    // 1. Move to Passengers Array
    ride.passengers.push({
        user: requesterId,
        pickup: requestData.pickup,
        drop: requestData.drop,
        status: 'approved',
        seatNumber: ride.passengers.length + 1,
        fareShare: 0,
        distanceTraveled: 0
    });

    // 2. Remove from approvals
    ride.approvals.splice(approvalIndex, 1);

    // 3. Recalculate Fares (The Magic)
    exports.recalculateFares(ride);
    
    await ride.save();

    // 4. Notify Everyone
    const io = req.app.get('io');
    const newUser = await User.findById(requesterId); 

    io.to(rideId).emit('ride_updated', ride);
    
    // Broadcast fare update
    ride.passengers.forEach(p => {
        io.to(p.user.toString()).emit('fare_updated', {
            newFare: p.fareShare,
            totalFare: ride.pricing.currentTotal,
            message: `${newUser.name} joined! Fares optimized.`
        });
    });

    res.json({ success: true, ride });
  } catch (error) {
    console.error("Approve Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// --- 7. UTILS ---
exports.getActiveRide = async (req, res) => {
  try {
    const ride = await Ride.findOne({
      'passengers.user': req.user.id,
      status: { $in: ['searching', 'ongoing', 'scheduled'] }
    })
    .populate('driver')
    .populate('passengers.user', 'name')
    .populate('approvals.user', 'name');
    res.json(ride);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getActiveDriverRide = async (req, res) => {
  try {
    const ride = await Ride.findOne({
      driver: req.user.id,
      status: { $in: ['ongoing', 'scheduled'] }
    }).populate('passengers.user', 'name phone');
    res.json(ride);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.completeRide = async (req, res) => {
    try {
        const ride = await Ride.findByIdAndUpdate(req.params.rideId, { status: 'completed' }, { new: true });
        const io = req.app.get('io');
        io.to(req.params.rideId).emit('ride_updated', ride);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getSearchingRides = exports.getAvailableRides;
exports.getJoinableRides = exports.getAvailableRides;