#!/usr/bin/env node
/**
 * Script per backup automatico MongoDB
 * Run: node scripts/backup-db.js
 * 
 * Backup viene salvato in backups/YYYY-MM-DD-HHmmss/
 */

require('dotenv').config();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const MONGODB_URI = process.env.MONGODB_URI;
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../backups');

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI non configurato');
  process.exit(1);
}

// Crea directory backups se non esiste
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Formato timestamp: YYYY-MM-DD-HHmmss
const timestamp = new Date().toISOString()
  .replace(/T/, '-')
  .replace(/\..+/, '')
  .replace(/:/g, '');

const backupPath = path.join(BACKUP_DIR, timestamp);

console.log('🔄 Avvio backup MongoDB...');
console.log(`📁 Destinazione: ${backupPath}`);

// mongodump command
const command = `mongodump --uri="${MONGODB_URI}" --out="${backupPath}"`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Errore durante backup:', error);
    console.error(stderr);
    process.exit(1);
  }

  console.log(stdout);
  console.log(`✅ Backup completato: ${backupPath}`);

  // Mantieni solo ultimi 7 backups (opzionale)
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(f => fs.statSync(path.join(BACKUP_DIR, f)).isDirectory())
    .sort()
    .reverse();

  if (backups.length > 7) {
    const toDelete = backups.slice(7);
    console.log(`\n🗑️ Eliminazione vecchi backup (mantieni ultimi 7)...`);
    
    toDelete.forEach(backup => {
      const backupDir = path.join(BACKUP_DIR, backup);
      fs.rmSync(backupDir, { recursive: true, force: true });
      console.log(`  ✓ Eliminato: ${backup}`);
    });
  }

  console.log(`\n📊 Backups disponibili: ${Math.min(backups.length, 7)}`);
  process.exit(0);
});
