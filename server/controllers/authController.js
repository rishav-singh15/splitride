const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- Register a new user ---
exports.register = async (req, res) => {
  const { name, email, phone, password, role, vehicle } = req.body;

  try {
    // 1. Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // 2. Create object
    user = new User({
      name,
      email,
      phone,
      password,
      role,
      vehicle: role === 'driver' ? vehicle : null
    });

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // 4. Create Token
    const payload = { user: { id: user.id, role: user.role } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '30d' },
      async (err, token) => {
        if (err) throw err;
        
        // 🛑 FIX: Return User data along with Token for immediate UI update
        // We fetch it again to ensure we exclude the password field
        const userPayload = await User.findById(user.id).select('-password');
        
        res.status(201).json({ token, user: userPayload });
      }
    );

  } catch (error) {
    console.error("Register Error:", error.message);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// --- Login a user ---
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // 3. Create Token
    const payload = { user: { id: user.id, role: user.role } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '30d' },
      (err, token) => {
        if (err) throw err;
        
        // 🛑 FIX: Send user object (without password) manually
        const userPayload = {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            vehicle: user.vehicle // needed for driver dashboard
        };

        res.json({ token, user: userPayload });
      }
    );
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// --- Get Logged in User ---
exports.getLoggedInUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
};