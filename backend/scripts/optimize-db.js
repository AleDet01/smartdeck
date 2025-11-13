require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

async function optimizeDatabase() {
  console.log('🔧 Starting database optimization...\n');
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log(`📁 Found ${collections.length} collections\n`);
    
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const collection = db.collection(collectionName);
      
      console.log(`\n📊 Analyzing collection: ${collectionName}`);
      console.log('─'.repeat(50));
      
      // Get collection stats
      const stats = await collection.stats();
      console.log(`Documents: ${stats.count}`);
      console.log(`Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Index Size: ${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`);
      
      // Get existing indexes
      const indexes = await collection.indexes();
      console.log(`\nExisting indexes (${indexes.length}):`);
      indexes.forEach(index => {
        const keys = Object.keys(index.key).map(k => `${k}: ${index.key[k]}`).join(', ');
        console.log(`  - ${index.name}: { ${keys} }${index.unique ? ' [UNIQUE]' : ''}`);
      });
      
      // Rebuild indexes for optimization
      console.log('\n🔨 Rebuilding indexes...');
      await collection.reIndex();
      console.log('✓ Indexes rebuilt');
      
      // Compact collection (MongoDB 4.4+)
      try {
        console.log('🗜️  Compacting collection...');
        await db.command({ compact: collectionName, force: true });
        console.log('✓ Collection compacted');
      } catch (err) {
        console.log('⚠️  Compact not available (requires MongoDB 4.4+)');
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✨ Database optimization completed successfully!');
    console.log('='.repeat(50) + '\n');
    
    // Get database stats
    const dbStats = await db.stats();
    console.log('📈 Database Statistics:');
    console.log(`  Total Collections: ${dbStats.collections}`);
    console.log(`  Total Indexes: ${dbStats.indexes}`);
    console.log(`  Data Size: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Storage Size: ${(dbStats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Index Size: ${(dbStats.indexSize / 1024 / 1024).toFixed(2)} MB`);
    
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
    process.exit(0);
    
  } catch (err) {
    console.error('\n❌ Error during optimization:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

optimizeDatabase();
