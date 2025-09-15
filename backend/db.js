const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set. Set the environment variable and restart the server.');
  process.exit(1);
}

const connectDB = async () => {
  try {
    // mongoose v6+ has sensible defaults; passing legacy options causes warnings
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err && err.message ? err.message : err);
    // rethrow so the caller can decide how to handle (start/exit/retry)
    throw err;
  }
};

module.exports = connectDB;
