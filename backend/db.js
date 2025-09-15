const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://alexdetu01_db_user:oP5n5Pv2UjTqvgJj@smartdeckcluster.fckswzj.mongodb.net/datasmartdeck?retryWrites=true&w=majority&appName=smartdeckcluster';
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
