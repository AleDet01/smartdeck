#!/usr/bin/env node
/**
 * Script per creare tutti gli indexes MongoDB in produzione
 * Run: node scripts/init-indexes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Import models per triggerare index creation
const User = require('../models/user');
const Flashcard = require('../models/singleFlash');
const TestSession = require('../models/testSession');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI non configurato');
  process.exit(1);
}

async function initIndexes() {
  try {
    console.log('🔄 Connessione a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connesso a MongoDB');

    console.log('\n📊 Creazione indexes...\n');

    // User indexes
    console.log('⏳ Creazione indexes User...');
    await User.createIndexes();
    console.log('✓ User indexes creati');

    // Flashcard indexes
    console.log('⏳ Creazione indexes Flashcard...');
    await Flashcard.createIndexes();
    console.log('✓ Flashcard indexes creati');

    // TestSession indexes
    console.log('⏳ Creazione indexes TestSession...');
    await TestSession.createIndexes();
    console.log('✓ TestSession indexes creati');

    // Lista tutti gli indexes
    console.log('\n📋 Indexes creati:\n');
    
    const userIndexes = await User.collection.getIndexes();
    console.log('User indexes:', Object.keys(userIndexes).join(', '));
    
    const flashcardIndexes = await Flashcard.collection.getIndexes();
    console.log('Flashcard indexes:', Object.keys(flashcardIndexes).join(', '));
    
    const sessionIndexes = await TestSession.collection.getIndexes();
    console.log('TestSession indexes:', Object.keys(sessionIndexes).join(', '));

    console.log('\n✅ Tutti gli indexes creati con successo!');
    
    logger.info('Database indexes inizializzati');
    
  } catch (err) {
    console.error('❌ Errore creazione indexes:', err);
    logger.error('Errore creazione indexes', { error: err.message });
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Disconnesso da MongoDB');
    process.exit(0);
  }
}

// Run
initIndexes();
