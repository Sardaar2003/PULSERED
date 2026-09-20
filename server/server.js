const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const logger = require('./logger');
const { connectDB } = require('./config/db');
const { seedMasterAdmin } = require('./config/seedAdmin');

const authRoutes = require('./routes/authRoutes');
const redditRoutes = require('./routes/redditRoutes');

const app = express();

// Initialize MongoDB connection and seed Master Admin
connectDB().then(() => {
  seedMasterAdmin();
});

// Middleware setup
app.use(cors());
app.use(express.json());

// Morgan HTTP request logging stream to Winston logger
const morganStream = {
  write: (message) => {
    logger.info(`[HTTP] ${message.trim()}`);
  },
};
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', { stream: morganStream }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/reddit', redditRoutes);

// Healthcheck Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'PulseRed Social Intelligence API',
    timestamp: new Date().toISOString(),
    logsLocation: path.join(__dirname, '../logs'),
  });
});

// Serve static frontend build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error('Unhandled Server Error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`🚀 PulseRed Backend Server running on http://localhost:${PORT}`);
  logger.info(`📁 Persistent logs being written to ${path.join(__dirname, '../logs/app.log')}`);
});
