const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable manca');
  process.exit(1);
}

// Mongoose configuration per performance e sicurezza
mongoose.set('strictQuery', true); // Previene query injection
mongoose.set('sanitizeFilter', true); // Sanitize filters

const connectDB = async (retries = 5) => {
  const options = {
    // Connection pooling
    maxPoolSize: 10,
    minPoolSize: 2,
    
    // Timeouts (aggressivi per Render deploy speed)
    serverSelectionTimeoutMS: 8000, // Era 5000
    socketTimeoutMS: 45000,
    connectTimeoutMS: 15000, // Era 10000
    
    // Auto index (false in produzione per performance)
    autoIndex: process.env.NODE_ENV !== 'production',
    
    // Buffering
    bufferCommands: false,
    
    // Monitoring
    heartbeatFrequencyMS: 10000,
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(MONGODB_URI, options);
      console.log('✓ MongoDB connesso con successo');
      console.log(`✓ Database: ${mongoose.connection.name}`);
      console.log(`✓ Connection pool size: ${options.maxPoolSize}`);
      
      // Connection event handlers
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnesso');
      });
      
      mongoose.connection.on('reconnected', () => {
        console.log('✓ MongoDB riconnesso');
      });
      
      return;
    } catch (err) {
      console.error(`❌ MongoDB connection attempt ${attempt}/${retries} failed:`, err.message);
      
      if (attempt === retries) {
        console.error('❌ Impossibile connettersi a MongoDB dopo tutti i tentativi');
        throw err;
      }
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`⏳ Retry in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

module.exports = connectDB;
