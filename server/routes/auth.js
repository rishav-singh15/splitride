const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// BASE ROUTE: /api/auth

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/', auth, authController.getLoggedInUser);

module.exports = router;