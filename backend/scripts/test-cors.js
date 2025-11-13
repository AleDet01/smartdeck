#!/usr/bin/env node

/**
 * Test CORS Configuration
 * Verifica che il backend risponda correttamente alle richieste CORS
 */

const https = require('https');
const http = require('http');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}\n`)
};

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'https://smartdeck.onrender.com';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'https://smartdeck-frontend.onrender.com';

log.header('🧪 SmartDeck CORS Test Suite');
log.info(`Backend: ${BACKEND_URL}`);
log.info(`Frontend Origin: ${FRONTEND_ORIGIN}`);

/**
 * Make HTTP request
 */
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const lib = options.protocol === 'https:' ? https : http;
    
    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

/**
 * Test 1: Preflight OPTIONS request
 */
async function testPreflight() {
  log.header('Test 1: CORS Preflight (OPTIONS)');
  
  try {
    const url = new URL(`${BACKEND_URL}/auth/login`);
    
    const response = await makeRequest({
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'OPTIONS',
      headers: {
        'Origin': FRONTEND_ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    log.info(`Status: ${response.statusCode}`);
    
    // Check required headers
    const checks = [
      {
        header: 'access-control-allow-origin',
        expected: FRONTEND_ORIGIN,
        actual: response.headers['access-control-allow-origin']
      },
      {
        header: 'access-control-allow-methods',
        expected: 'POST',
        actual: response.headers['access-control-allow-methods']
      },
      {
        header: 'access-control-allow-credentials',
        expected: 'true',
        actual: response.headers['access-control-allow-credentials']
      }
    ];
    
    let allPassed = true;
    
    checks.forEach(check => {
      if (check.actual && check.actual.includes(check.expected)) {
        log.success(`${check.header}: ${check.actual}`);
      } else {
        log.error(`${check.header}: Expected '${check.expected}', got '${check.actual}'`);
        allPassed = false;
      }
    });
    
    return allPassed;
  } catch (error) {
    log.error(`Preflight failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Actual POST request with CORS
 */
async function testActualRequest() {
  log.header('Test 2: Actual POST Request with CORS');
  
  try {
    const url = new URL(`${BACKEND_URL}/auth/login`);
    
    const body = JSON.stringify({
      username: 'test_cors',
      password: 'Test1234!'
    });
    
    const response = await makeRequest({
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Origin': FRONTEND_ORIGIN,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      body
    });
    
    log.info(`Status: ${response.statusCode}`);
    
    const allowOrigin = response.headers['access-control-allow-origin'];
    
    if (allowOrigin === FRONTEND_ORIGIN) {
      log.success(`Access-Control-Allow-Origin: ${allowOrigin}`);
      return true;
    } else {
      log.error(`Access-Control-Allow-Origin: Expected '${FRONTEND_ORIGIN}', got '${allowOrigin}'`);
      return false;
    }
  } catch (error) {
    log.error(`Actual request failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 3: Health check
 */
async function testHealthCheck() {
  log.header('Test 3: Health Check');
  
  try {
    const url = new URL(`${BACKEND_URL}/health`);
    
    const response = await makeRequest({
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'GET'
    });
    
    log.info(`Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      log.success(`Backend status: ${data.status}`);
      log.info(`Database: ${data.database.state}`);
      log.info(`Memory: ${data.memory.used} / ${data.memory.total}`);
      return true;
    } else {
      log.error(`Health check failed with status ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    log.error(`Health check failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 4: Invalid origin should be blocked
 */
async function testBlockedOrigin() {
  log.header('Test 4: Invalid Origin (Should be blocked)');
  
  try {
    const url = new URL(`${BACKEND_URL}/auth/login`);
    const invalidOrigin = 'https://malicious-site.com';
    
    const response = await makeRequest({
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'OPTIONS',
      headers: {
        'Origin': invalidOrigin,
        'Access-Control-Request-Method': 'POST'
      }
    });
    
    const allowOrigin = response.headers['access-control-allow-origin'];
    
    if (!allowOrigin || allowOrigin !== invalidOrigin) {
      log.success(`Invalid origin correctly blocked`);
      return true;
    } else {
      log.error(`Invalid origin was NOT blocked!`);
      return false;
    }
  } catch (error) {
    log.error(`Blocked origin test failed: ${error.message}`);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  const results = [];
  
  results.push(await testHealthCheck());
  results.push(await testPreflight());
  results.push(await testActualRequest());
  results.push(await testBlockedOrigin());
  
  // Summary
  log.header('📊 Test Summary');
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  if (passed === total) {
    log.success(`All tests passed! (${passed}/${total})`);
    process.exit(0);
  } else {
    log.error(`Some tests failed (${passed}/${total})`);
    process.exit(1);
  }
}

// Run
runTests().catch(error => {
  log.error(`Test suite crashed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
