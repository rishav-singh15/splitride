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
    const { start, end, isShared } = req.body;
    // --- REAL USER DATA (from auth middleware) ---
    const userId = req.user.id;
    const userName = req.user.name;
    
    const ride = new Ride({
      route: { start, end },
      passengers: [{
        userId: userId, // <--- Replaced mock
        name: userName, // <--- Replaced mock
        status: 'pending',
        seatNumber: 1
      }],
      status: 'searching',
      pricing: {
        baseFare: 0,
        incrementPerPassenger: 0,
        currentTotal: 0,
        perPersonFare: 0
      },
      maxPassengers: isShared ? 3 : 1
    });

    await ride.save();
    
    req.app.get('io').emit('new_ride_request', ride);
    
    res.status(201).json({ success: true, ride });
  } catch (error) {
    console.error(error);
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
        // --- ADD PASSENGER TO RIDE ---
        const newPassenger = await User.findById(requesterId);
        if (!newPassenger) {
            return res.status(404).json({ error: 'Joining passenger not found' });
        }

        ride.passengers.push({
          userId: newPassenger._id,
          name: newPassenger.name,
          status: 'approved',
          seatNumber: ride.passengers.length + 1
        });

        // --- RECALCULATE FARES (YOUR CORE LOGIC) ---
        const numPassengers = ride.passengers.length;
        const newTotal = ride.pricing.baseFare + 
           (ride.pricing.incrementPerPassenger * (numPassengers - 1));
        const farePerPerson = newTotal / numPassengers;

        ride.pricing.currentTotal = newTotal;
        ride.pricing.perPersonFare = farePerPerson;

        ride.passengers.forEach(p => {
          p.fareToPay = farePerPerson;
        });

        approval.status = 'approved';

        // --- NOTIFY EVERYONE ---
        const updateData = {
          message: `${newPassenger.name} has joined the ride!`,
          newFare: farePerPerson,
          totalFare: newTotal,
          passengers: ride.passengers.map(p => ({ name: p.name, fare: p.fareToPay }))
        };

        // Notify all passengers (including new one)
        ride.passengers.forEach(p => {
          io.to(p.userId.toString()).emit('fare_updated', updateData);
          
          // --- ADD NOTIFICATION ---
          createNotification(
            io,
            p.userId,
            'fare_updated',
            `${newPassenger.name} joined! Your new fare is $${farePerPerson.toFixed(2)}`,
            ride._id
          );
          // --- END ---
        });
        io.to(rideId).emit('ride_updated', ride);
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