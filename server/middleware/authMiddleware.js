const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getIsConnected, getMemoryStore } = require('../config/db');
const logger = require('../logger');

const JWT_SECRET = process.env.JWT_SECRET || 'prowlo_reddit_jwt_secret_key_987654321';

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      const isDbConnected = getIsConnected();
      let activeSessionId = null;

      if (isDbConnected) {
        const user = await User.findById(decoded.id);
        if (!user) {
          return res.status(401).json({ error: 'User no longer exists' });
        }
        if (!user.isApproved) {
          return res.status(403).json({ error: 'Your account access has been revoked or is pending admin approval' });
        }
        activeSessionId = user.activeSessionId;
        req.user = {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          isApproved: user.isApproved,
          prowloApiKey: user.prowloApiKey,
        };
      } else {
        const store = getMemoryStore();
        const user = store.users.find((u) => u.id === decoded.id);
        if (!user) {
          return res.status(401).json({ error: 'User no longer exists' });
        }
        if (!user.isApproved) {
          return res.status(403).json({ error: 'Your account access has been revoked or is pending admin approval' });
        }
        activeSessionId = user.activeSessionId;
        req.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isApproved: user.isApproved,
          prowloApiKey: user.prowloApiKey,
        };
      }

      // Check Concurrent Login Session ID
      if (decoded.sessionId && activeSessionId && decoded.sessionId !== activeSessionId) {
        logger.warn(`Concurrent session terminated for user ${req.user.email} (Token Session: ${decoded.sessionId}, Active Session: ${activeSessionId})`);
        return res.status(401).json({
          error: 'Session terminated. Your account was logged in from another browser or device.',
          code: 'CONCURRENT_SESSION_TERMINATED',
        });
      }

      return next();
    } catch (error) {
      logger.error('JWT Authentication failed', { error: error.message });
      return res.status(401).json({ error: 'Not authorized, token invalid or expired' });
    }
  }

  if (!token) {
    logger.warn('Unauthorized access attempt: No authorization token provided', { path: req.originalUrl });
    return res.status(401).json({ error: 'Not authorized, no token provided' });
  }
};

const adminProtect = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  logger.warn(`Admin access denied for non-admin user: ${req.user?.email}`);
  return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
};

module.exports = { protect, adminProtect };
