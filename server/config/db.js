const mongoose = require('mongoose');
const logger = require('../logger');

let isConnected = false;
let memoryStore = {
  users: [],
  searchHistory: [],
  savedPosts: []
};

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/prowlo_reddit';
  
  try {
    mongoose.set('strictQuery', false);
    // Setting short timeout so startup doesn't hang if MongoDB service is offline
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    logger.info(`MongoDB Connected successfully to: ${mongoURI}`);
  } catch (err) {
    isConnected = false;
    logger.warn(`MongoDB Connection failed (${err.message}). Defaulting to resilient in-memory database store for seamless offline usage.`);
    logger.info(`To use MongoDB persistently, start your MongoDB server or provide a valid MONGODB_URI in .env`);
  }
};

const getIsConnected = () => isConnected;
const getMemoryStore = () => memoryStore;

module.exports = { connectDB, getIsConnected, getMemoryStore };
