#!/usr/bin/env node

/**
 * Pre-Deploy Test Suite
 * Verifica configurazione e funzionamento prima del deploy production
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 SmartDeck Pre-Deploy Test Suite\n');

let errors = [];
let warnings = [];

// 1. Check Backend Files
console.log('📁 Checking Backend Files...');
const backendFiles = [
  'backend/index.js',
  'backend/db.js',
  'backend/package.json',
  'backend/middleware/security.js',
  'backend/middleware/sentry.js',
  'backend/middleware/rateLimiter.js',
  'backend/utils/logger.js',
  'backend/scripts/init-indexes.js',
  'backend/scripts/backup-db.js',
];

backendFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    errors.push(`❌ Missing file: ${file}`);
  } else {
    console.log(`  ✅ ${file}`);
  }
});

// 2. Check Frontend Files
console.log('\n📁 Checking Frontend Files...');
const frontendFiles = [
  'frontend/package.json',
  'frontend/src/App.jsx',
  'frontend/src/components/ErrorBoundary.jsx',
  'frontend/src/components/LoadingFallback.jsx',
  'frontend/src/components/SEO.jsx',
  'frontend/src/utils/analytics.js',
  'frontend/src/utils/reportWebVitals.js',
  'frontend/src/utils/networkUtils.js',
  'frontend/public/sitemap.xml',
  'frontend/public/robots.txt',
  'frontend/public/service-worker.js',
];

frontendFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    errors.push(`❌ Missing file: ${file}`);
  } else {
    console.log(`  ✅ ${file}`);
  }
});

// 3. Check Environment Variables
console.log('\n🔐 Checking Environment Variables...');
const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'OPENAI_API_KEY',
];

const optionalEnvVars = [
  'SENTRY_DSN',
  'REDIS_URL',
  'GA4_MEASUREMENT_ID',
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    errors.push(`❌ Missing required env var: ${envVar}`);
  } else {
    console.log(`  ✅ ${envVar} is set`);
  }
});

optionalEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    warnings.push(`⚠️  Optional env var not set: ${envVar}`);
  } else {
    console.log(`  ✅ ${envVar} is set`);
  }
});

// 4. Check Dependencies
console.log('\n📦 Checking Backend Dependencies...');
const backendPackage = require('../backend/package.json');
const requiredBackendDeps = [
  'express',
  'mongoose',
  'helmet',
  'express-mongo-sanitize',
  'hpp',
  'ioredis',
  'rate-limit-redis',
  'winston',
  'winston-daily-rotate-file',
  '@sentry/node',
  '@sentry/profiling-node',
];

requiredBackendDeps.forEach(dep => {
  if (!backendPackage.dependencies[dep]) {
    errors.push(`❌ Missing backend dependency: ${dep}`);
  } else {
    console.log(`  ✅ ${dep} v${backendPackage.dependencies[dep]}`);
  }
});

console.log('\n📦 Checking Frontend Dependencies...');
const frontendPackage = require('../frontend/package.json');
const requiredFrontendDeps = [
  'react',
  'react-dom',
  'react-router-dom',
  'react-helmet-async',
  'react-hot-toast',
  'web-vitals',
];

requiredFrontendDeps.forEach(dep => {
  if (!frontendPackage.dependencies[dep]) {
    errors.push(`❌ Missing frontend dependency: ${dep}`);
  } else {
    console.log(`  ✅ ${dep} v${frontendPackage.dependencies[dep]}`);
  }
});

// 5. Security Checks
console.log('\n🔒 Security Checks...');

// Check JWT_SECRET length
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  warnings.push('⚠️  JWT_SECRET should be at least 32 characters');
}

// Check if .env files are gitignored
if (!fs.existsSync('.gitignore')) {
  errors.push('❌ Missing .gitignore file');
} else {
  const gitignore = fs.readFileSync('.gitignore', 'utf-8');
  if (!gitignore.includes('.env')) {
    warnings.push('⚠️  .env not in .gitignore');
  }
}

// 6. Database Indexes Check
console.log('\n💾 Database Setup Checks...');
const indexScript = fs.readFileSync('backend/scripts/init-indexes.js', 'utf-8');
if (!indexScript.includes('createIndex')) {
  warnings.push('⚠️  init-indexes.js might not create indexes correctly');
} else {
  console.log('  ✅ Indexes script looks good');
}

// 7. Final Report
console.log('\n' + '='.repeat(60));
console.log('📊 TEST RESULTS\n');

if (errors.length === 0 && warnings.length === 0) {
  console.log('🎉 ALL CHECKS PASSED! Ready for deployment!\n');
} else {
  if (errors.length > 0) {
    console.log('❌ ERRORS (must fix before deploy):');
    errors.forEach(err => console.log(`  ${err}`));
    console.log();
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS (recommended to fix):');
    warnings.forEach(warn => console.log(`  ${warn}`));
    console.log();
  }
  
  if (errors.length > 0) {
    console.log('🚫 NOT READY FOR DEPLOYMENT\n');
    process.exit(1);
  } else {
    console.log('✅ Ready for deployment (with warnings)\n');
  }
}

console.log('='.repeat(60));
console.log('\n📝 Next Steps:');
console.log('  1. Fix any errors or warnings above');
console.log('  2. Run: node backend/scripts/init-indexes.js (on production DB)');
console.log('  3. Test locally: npm run dev (backend + frontend)');
console.log('  4. Deploy to Render.com');
console.log('  5. Monitor Sentry + logs for first 24h\n');

console.log('📖 Full checklist: PRODUCTION_READY.md\n');
