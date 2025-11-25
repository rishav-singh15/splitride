const Ride = require('../models/Ride');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

// Helper function (as defined in the plan)
function calculateNewFare(ride, numPassengers) {
  const total = ride.pricing.baseFare + 
    (ride.pricing.incrementPerPassenger * (numPassengers - 1));
  return total / numPassengers;
}

exports.getSearchingRides = async (req, res) => {
  try {
    const rides = await Ride.find({ status: 'searching' }).sort({ createdAt: -1 });
    res.json(rides);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// --- Create new ride (Passenger 1 initiates) ---
exports.createRide = async (req, res) => {
  try {
    // 1. Get the new data format from Frontend
    // Frontend sends: { pickup: { coordinates: [...] }, drop: { coordinates: [...] }, ... }
    const { pickup, drop, seatsRequested, paymentMethod } = req.body;
    const userId = req.user.id; // Assuming auth middleware sets this

    // 2. Validate input
    if (!pickup || !drop || !pickup.coordinates || !drop.coordinates) {
       return res.status(400).json({ error: "Pickup and Drop locations are required with coordinates." });
    }

    // 3. Create the Ride Object matching the NEW Schema
    const ride = new Ride({
      driver: null, // No driver yet
      route: {
        start: {
          name: pickup.name || "Pinned Location",
          location: {
            type: "Point",
            coordinates: pickup.coordinates // [Lng, Lat]
          }
        },
        end: {
          name: drop.name || "Destination",
          location: {
            type: "Point",
            coordinates: drop.coordinates // [Lng, Lat]
          }
        },
        totalDistance: 0 // We will calculate this when driver accepts or use a helper now
      },
      passengers: [{
        user: userId,
        pickup: {
            name: pickup.name || "Pinned Location",
            coordinates: pickup.coordinates
        },
        drop: {
            name: drop.name || "Destination",
            coordinates: drop.coordinates
        },
        status: 'pending',
        seatNumber: 1,
        fareShare: 0, // Will be calculated when driver accepts/others join
        distanceTraveled: 0
      }],
      status: 'searching',
      pricing: {
        baseFare: 0, 
        currentTotal: 0
      },
      seatsRequested: seatsRequested || 1
    });

    await ride.save();

    // 4. Emit socket event (optional, if you have drivers listening)
    const io = req.app.get('io');
    if (io) {
        io.emit('new_ride_request', ride);
    }

    res.json({ success: true, ride });

  } catch (error) {
    console.error("Create Ride Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// --- Driver accepts ride with pricing ---
exports.acceptRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { baseFare, incrementPerPassenger } = req.body;
    
    // --- REAL DRIVER DATA (from auth middleware) ---
    const driverId = req.user.id;
    const driver = await User.findById(driverId); // Get driver details
    if (!driver || driver.role !== 'driver') {
      return res.status(403).json({ error: 'User is not a driver' });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    if (ride.status !== 'searching') return res.status(400).json({ error: 'Ride already accepted' });

    // Set driver and pricing
    ride.driver = {
      id: driverId,
      name: driver.name,
      vehicle: driver.vehicle // <--- Replaced mock
    };
    ride.pricing = {
      baseFare,
      incrementPerPassenger,
      currentTotal: baseFare,
      perPersonFare: baseFare
    };
    ride.status = 'ongoing';

    ride.passengers[0].fareToPay = baseFare;
    ride.passengers[0].status = 'approved';
    
    await ride.save();

    const passengerSocketId = ride.passengers[0].userId.toString();
    req.app.get('io').to(passengerSocketId)
      .emit('ride_accepted', { ride });
    req.app.get('io').to(rideId).emit('ride_updated', ride);

    createNotification(
      io,
      passenger.userId,
      'ride_accepted',
      `Your ride from ${ride.route.start} to ${ride.route.end} has been accepted by ${ride.driver.name}!`,
      ride._id
    );

    res.json({ success: true, ride });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// --- Passenger 2+ requests to join shared ride ---
exports.requestJoinRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    
    // --- REAL USER DATA (from auth middleware) ---
    const userId = req.user.id;
    const userName = req.user.name;

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });

    if (ride.passengers.length >= ride.maxPassengers) {
      return res.status(400).json({ error: 'Ride is full' });
    }
    
    const newApproval = {
      requestedBy: userId, // <--- Replaced mock
      approvedBy: [],
      status: 'pending'
    };
    ride.approvals.push(newApproval);
    
    await ride.save();

    const potentialNewFare = calculateNewFare(ride, ride.passengers.length + 1);

    const notification = {
      rideId,
      requesterId: userId, // <--- Replaced mock
      requesterName: userName, // <--- Replaced mock
      newFare: potentialNewFare
    };

    ride.passengers.forEach(p => {
      req.app.get('io').to(p.userId.toString())
        .emit('join_request', notification);
    });

    res.json({ success: true, message: 'Request sent, waiting for approval' });
  } catch (error)
 {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// --- Existing passenger approves/rejects join request ---
// --- Existing passenger approves/rejects join request ---
exports.approveJoinRequest = async (req, res) => {
  try {
    const { rideId, requesterId } = req.params;
    const { approve } = req.body; 
    const approverId = req.user.id; // Get approver ID from auth

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });

    const approval = ride.approvals.find(a => 
       a.requestedBy.toString() === requesterId && a.status === 'pending'
    );

    if (!approval) {
      return res.status(404).json({ error: 'Request not found or already processed' });
    }

    // Get the io instance from app
    const io = req.app.get('io');

    if (approve) {
      // Add approver
      if (!approval.approvedBy.includes(approverId)) {
          approval.approvedBy.push(approverId);
      }

      // Check if all current passengers approved
      const allApproved = approval.approvedBy.length === ride.passengers.length;

      if (allApproved) {
    // --- 1. ADD PASSENGER TO RIDE & LOCATION DATA ---
    const newPassenger = await User.findById(requesterId);
    if (!newPassenger) {
        return res.status(404).json({ error: 'Joining passenger not found' });
    }

    // We MUST capture the location data sent from the frontend map
    const newPassengerData = {
      userId: newPassenger._id,
      name: newPassenger.name,
      status: 'approved',
      seatNumber: ride.passengers.length + 1,
      // *** NEW: Store the new passenger's P&D locations (expected format: {lat, lng}) ***
      // NOTE: We assume the frontend sends the required structure:
      // pickup: { coordinates: [req.body.pickup.lng, req.body.pickup.lat] },
      pickup: req.body.pickup,
      drop: req.body.drop,
    };
    
    ride.passengers.push(newPassengerData);

    // --- 2. RECALCULATE FARES (DISTANCE-WEIGHTED LOGIC) ---
    // The previous manual calculation is gone. We call the smart algorithm.
    const updatedRide = exports.recalculateFares(ride); // This mutates and returns the ride object

    approval.status = 'approved';
    await updatedRide.save(); // Save the ride with all new fares

    // --- 3. NOTIFY EVERYONE ---
    const updateData = {
      message: `${newPassenger.name} has joined the ride!`,
      // The total collected amount
      totalFare: updatedRide.pricing.currentTotal, 
    };

    // Notify all passengers (including new one) with their *specific* new fare
    updatedRide.passengers.forEach(p => {
        const individualFare = p.fareToPay; // The distance-weighted fare from the function
        
        const passengerUpdateData = { 
            ...updateData, 
            newFare: individualFare, 
            savings: '15%' // Static savings for MVP wow factor
        };

        io.to(p.userId.toString()).emit('fare_updated', passengerUpdateData);
        
        // --- ADD NOTIFICATION ---
        createNotification(
          io,
          p.userId,
          'fare_updated',
          `${newPassenger.name} joined! Your new fare is ₹${individualFare}`, 
          updatedRide._id
        );
    });
    
    io.to(rideId).emit('ride_updated', updatedRide);
}
    } else {
      // --- REJECTED ---
      approval.status = 'rejected';
      
      io.to(requesterId)
        .emit('join_rejected', { rideId, message: 'Your request to join was denied.' });
        
      // --- ADD NOTIFICATION ---
      createNotification(
        io,
        requesterId, // The user who was rejected
        'join_rejected',
        `Your request to join the ride from ${ride.route.start} was denied.`,
        ride._id
      );
      // --- END ---
    }

    await ride.save();
    res.json({ success: true, ride });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.getActiveRide = async (req, res) => {
  try {
    const ride = await Ride.findOne({
      'passengers.userId': req.user.id,
      status: { $in: ['searching', 'ongoing'] }
    });
    res.json(ride); // Will be null if no active ride
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// --- Get all rides that are ongoing and joinable ---
exports.getJoinableRides = async (req, res) => {
  try {
    const rides = await Ride.find({
      status: 'ongoing',          // Ride must be in progress
      maxPassengers: { $gt: 1 },  // Must be a shared ride
      'passengers.0': { $exists: true }, // Ensure passenger array isn't empty
      // Check if user is NOT already in the passenger list
      'passengers.userId': { $ne: req.user.id }, 
      // This is a complex way to say: passenger count < max capacity
      $expr: { $lt: [ { $size: "$passengers" }, "$maxPassengers" ] } 
    }).sort({ createdAt: -1 });
    
    res.json(rides);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.getActiveDriverRide = async (req, res) => {
  try {
    const ride = await Ride.findOne({
      'driver.id': req.user.id,
      status: 'ongoing'
    });
    res.json(ride); // Will be null if no active ride
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.completeRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    const io = req.app.get('io');

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Security check: Only the driver of this ride can complete it
    if (ride.driver.id.toString() !== req.user.id) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    ride.status = 'completed';
    ride.completedAt = Date.now();
    await ride.save();

    // Notify all passengers that the ride is over
    const message = `Your ride from ${ride.route.start} to ${ride.route.end} is complete.`;

    ride.passengers.forEach(p => {
      // Send a socket event to update their UI
      io.to(p.userId.toString()).emit('ride_completed', { rideId: ride._id });
      
      // Send a persistent notification
      createNotification(
        io,
        p.userId,
        'ride_completed', // You may need to add this to your Notification model enum
        message,
        ride._id
      );
    });

    res.json({ success: true, message: 'Ride completed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// HELPER: Haversine Formula to calculate distance between coords in km
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; // Distance in km
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

// THE ALGORITHM: Recalculate fares for all passengers
exports.recalculateFares = (ride) => {
    const BASE_RATE_PER_KM = 15; // ₹15 per km (Standard cab rate)
    const POOL_DISCOUNT = 0.85;  // 15% discount for pooling
    
    // 1. Calculate Total Pooled Distance (Driver's effort)
    // In a real app, this comes from Mapbox API. For MVP, we sum segments.
    // Logic: Start -> P1_Pickup -> P2_Pickup -> P1_Drop -> P2_Drop (simplified)
    // For MVP V1: Sum of individual distances * 0.7 (Overlap factor)
    
    let totalDriverDistance = 0;
    ride.passengers.forEach(p => {
        const dist = calculateDistance(
            p.pickup.coordinates[1], p.pickup.coordinates[0],
            p.drop.coordinates[1], p.drop.coordinates[0]
        );
        p.distanceTraveled = dist; // Update passenger object
        totalDriverDistance += dist; 
    });
    
    // Simulate overlap efficiency (Driver drives less than sum of solo trips)
    const optimizedTotalDistance = totalDriverDistance * 0.7; 
    
    // 2. Calculate Total Ride Cost (Driver's Revenue)
    const totalRideCost = (optimizedTotalDistance * BASE_RATE_PER_KM) + ride.pricing.baseFare;

    // 3. DISTANCE-WEIGHTED SPLIT
    // Each person pays proportional to their solo distance
    ride.passengers.forEach(p => {
        const sharePercentage = p.distanceTraveled / totalDriverDistance;
        
        // Their "Fair Share" of the discounted total cost
        p.fareShare = (totalRideCost * sharePercentage).toFixed(2);
        
        // SAFETY CHECK: Ensure they never pay more than Solo
        const soloCost = (p.distanceTraveled * BASE_RATE_PER_KM) + ride.pricing.baseFare;
        if (p.fareShare > soloCost) {
             p.fareShare = soloCost * 0.95; // Force 5% discount minimum
        }
    });

    return ride;
};