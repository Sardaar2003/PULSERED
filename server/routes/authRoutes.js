const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getIsConnected, getMemoryStore } = require('../config/db');
const { protect, adminProtect } = require('../middleware/authMiddleware');
const logger = require('../logger');

const JWT_SECRET = process.env.JWT_SECRET || 'prowlo_reddit_jwt_secret_key_987654321';

// Helper to generate JWT containing Session ID
const generateToken = (id, email, name, role, sessionId) => {
  return jwt.sign({ id, email, name, role, sessionId }, JWT_SECRET, { expiresIn: '7d' });
};

// Helper for unique session IDs
const generateSessionId = () => {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// @route   POST /api/auth/register
// @desc    Register a new user (Pending Admin Approval)
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    logger.warn('Registration failed: Missing required fields');
    return res.status(400).json({ error: 'Please provide name, email, and password' });
  }

  try {
    const isDbConnected = getIsConnected();
    const normalizedEmail = email.toLowerCase().trim();

    if (isDbConnected) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        logger.warn(`Registration failed: Email already registered (${normalizedEmail})`);
        return res.status(400).json({ error: 'User already exists with this email' });
      }

      const isMasterAdmin = normalizedEmail === 'admin@pulsered.com';
      const role = isMasterAdmin ? 'admin' : 'user';
      const isApproved = isMasterAdmin;

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await User.create({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role,
        isApproved,
      });

      logger.info(`New user registered in MongoDB: ${user.email} (Role: ${role}, Approved: ${isApproved})`);

      if (!isApproved) {
        return res.status(201).json({
          message: 'Registration successful! Your account is pending admin approval before you can sign in.',
          requiresApproval: true,
          user: { id: user._id, name: user.name, email: user.email, role: user.role, isApproved: false },
        });
      }

      const sessionId = generateSessionId();
      user.activeSessionId = sessionId;
      await user.save();

      const token = generateToken(user._id, user.email, user.name, user.role, sessionId);
      return res.status(201).json({
        message: 'Account created and approved!',
        requiresApproval: false,
        user: { id: user._id, name: user.name, email: user.email, role: user.role, isApproved: true, prowloApiKey: user.prowloApiKey },
        token,
      });
    } else {
      const store = getMemoryStore();
      const existingUser = store.users.find((u) => u.email === normalizedEmail);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists with this email' });
      }

      const isMasterAdmin = normalizedEmail === 'admin@pulsered.com';
      const role = isMasterAdmin ? 'admin' : 'user';
      const isApproved = isMasterAdmin;

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = {
        id: `user_${Date.now()}`,
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role,
        isApproved,
        activeSessionId: null,
        prowloApiKey: '',
        createdAt: new Date(),
      };

      store.users.push(newUser);
      logger.info(`New user registered in memory store: ${newUser.email} (Role: ${role}, Approved: ${isApproved})`);

      if (!isApproved) {
        return res.status(201).json({
          message: 'Registration successful! Your account is pending admin approval before you can sign in.',
          requiresApproval: true,
          user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, isApproved: false },
        });
      }

      const sessionId = generateSessionId();
      newUser.activeSessionId = sessionId;

      const token = generateToken(newUser.id, newUser.email, newUser.name, newUser.role, sessionId);
      return res.status(201).json({
        message: 'Account created and approved!',
        requiresApproval: false,
        user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, isApproved: true, prowloApiKey: '' },
        token,
      });
    }
  } catch (error) {
    logger.error('Error during registration', { error: error.message });
    return res.status(500).json({ error: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & enforce single session ID
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    logger.warn('Login attempt failed: Missing email or password');
    return res.status(400).json({ error: 'Please provide email and password' });
  }

  try {
    const isDbConnected = getIsConnected();
    const normalizedEmail = email.toLowerCase().trim();

    if (isDbConnected) {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        logger.warn(`Login failed: User not found for email ${normalizedEmail}`);
        return res.status(400).json({ error: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        logger.warn(`Login failed: Password mismatch for ${normalizedEmail}`);
        return res.status(400).json({ error: 'Invalid email or password' });
      }

      if (!user.isApproved) {
        logger.warn(`Login rejected: User ${normalizedEmail} is pending admin approval`);
        return res.status(403).json({
          error: 'Your account is pending admin approval. Please contact the administrator to grant access.',
          isPendingApproval: true,
        });
      }

      const newSessionId = generateSessionId();
      user.activeSessionId = newSessionId;
      await user.save();

      logger.info(`User ${user.email} logged in. New activeSessionId generated: ${newSessionId}`);
      const token = generateToken(user._id, user.email, user.name, user.role, newSessionId);

      return res.json({
        user: { id: user._id, name: user.name, email: user.email, role: user.role, isApproved: user.isApproved, prowloApiKey: user.prowloApiKey || '' },
        token,
      });
    } else {
      const store = getMemoryStore();
      const user = store.users.find((u) => u.email === normalizedEmail);
      if (!user) {
        return res.status(400).json({ error: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid email or password' });
      }

      if (!user.isApproved) {
        return res.status(403).json({
          error: 'Your account is pending admin approval. Please contact the administrator to grant access.',
          isPendingApproval: true,
        });
      }

      const newSessionId = generateSessionId();
      user.activeSessionId = newSessionId;

      logger.info(`User ${user.email} logged in via memory store. New activeSessionId: ${newSessionId}`);
      const token = generateToken(user.id, user.email, user.name, user.role, newSessionId);

      return res.json({
        user: { id: user.id, name: user.name, email: user.email, role: user.role, isApproved: user.isApproved, prowloApiKey: user.prowloApiKey || '' },
        token,
      });
    }
  } catch (error) {
    logger.error('Error during login', { error: error.message });
    return res.status(500).json({ error: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
router.get('/me', protect, async (req, res) => {
  return res.json({ user: req.user });
});

// @route   GET /api/auth/admin/users
// @desc    Get all registered users for Admin approval management
router.get('/admin/users', protect, adminProtect, async (req, res) => {
  try {
    const isDbConnected = getIsConnected();
    if (isDbConnected) {
      const users = await User.find({}).select('-password').sort({ createdAt: -1 });
      return res.json({ users });
    } else {
      const store = getMemoryStore();
      const users = store.users.map(({ password, ...u }) => u);
      return res.json({ users });
    }
  } catch (error) {
    logger.error('Error fetching admin user list', { error: error.message });
    return res.status(500).json({ error: 'Failed to fetch user list' });
  }
});

// @route   PUT /api/auth/admin/approve/:userId
// @desc    Approve or update a user's approval status
router.put('/admin/approve/:userId', protect, adminProtect, async (req, res) => {
  const { userId } = req.params;
  const { approve } = req.body;

  try {
    const isDbConnected = getIsConnected();
    if (isDbConnected) {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      user.isApproved = approve !== false;
      await user.save();

      logger.info(`Admin ${req.user.email} updated approval status for ${user.email} -> Approved: ${user.isApproved}`);
      return res.json({ message: `User ${user.email} status updated`, user: { id: user._id, email: user.email, isApproved: user.isApproved } });
    } else {
      const store = getMemoryStore();
      const user = store.users.find((u) => u.id === userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      user.isApproved = approve !== false;
      logger.info(`Admin ${req.user.email} updated approval status for ${user.email} -> Approved: ${user.isApproved}`);
      return res.json({ message: `User ${user.email} status updated`, user: { id: user.id, email: user.email, isApproved: user.isApproved } });
    }
  } catch (error) {
    logger.error('Error updating user approval status', { error: error.message });
    return res.status(500).json({ error: 'Failed to update approval status' });
  }
});

// @route   DELETE /api/auth/admin/users/:userId
// @desc    Delete a user account (Admin only)
router.delete('/admin/users/:userId', protect, adminProtect, async (req, res) => {
  const { userId } = req.params;

  try {
    const isDbConnected = getIsConnected();
    if (isDbConnected) {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      if (user.email === 'admin@pulsered.com') {
        return res.status(400).json({ error: 'Cannot delete fixed Master Admin account' });
      }

      await User.deleteOne({ _id: userId });
      logger.info(`Admin ${req.user.email} deleted user account: ${user.email} (ID: ${userId})`);
      return res.json({ message: `User ${user.email} account deleted successfully` });
    } else {
      const store = getMemoryStore();
      const userIndex = store.users.findIndex((u) => u.id === userId);
      if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

      if (store.users[userIndex].email === 'admin@pulsered.com') {
        return res.status(400).json({ error: 'Cannot delete fixed Master Admin account' });
      }

      const deleted = store.users.splice(userIndex, 1);
      logger.info(`Admin ${req.user.email} deleted user account from memory: ${deleted[0].email}`);
      return res.json({ message: `User ${deleted[0].email} account deleted successfully` });
    }
  } catch (error) {
    logger.error('Error deleting user account', { error: error.message });
    return res.status(500).json({ error: 'Server error deleting user account' });
  }
});

// @route   PUT /api/auth/settings
// @desc    Update user API key settings
router.put('/settings', protect, async (req, res) => {
  const { prowloApiKey } = req.body;

  try {
    const isDbConnected = getIsConnected();
    if (isDbConnected) {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });

      user.prowloApiKey = prowloApiKey || '';
      await user.save();
      logger.info(`Updated API Key settings for user: ${user.email}`);

      return res.json({
        message: 'Settings updated successfully',
        user: { id: user._id, name: user.name, email: user.email, role: user.role, isApproved: user.isApproved, prowloApiKey: user.prowloApiKey },
      });
    } else {
      const store = getMemoryStore();
      const user = store.users.find((u) => u.id === req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });

      user.prowloApiKey = prowloApiKey || '';
      return res.json({
        message: 'Settings updated successfully',
        user: { id: user.id, name: user.name, email: user.email, role: user.role, isApproved: user.isApproved, prowloApiKey: user.prowloApiKey },
      });
    }
  } catch (error) {
    logger.error('Error updating settings', { error: error.message });
    return res.status(500).json({ error: 'Server error updating settings' });
  }
});

module.exports = router;
