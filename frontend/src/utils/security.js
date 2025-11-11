/**
 * Security utilities per validazione e sanitizzazione input
 */

// Password strength checker
export const validatePasswordStrength = (password) => {
  const checks = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    maxLength: password.length <= 128
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;
  
  let strength = 'weak';
  let score = 0;

  if (checks.minLength) score += 20;
  if (checks.hasUpperCase) score += 20;
  if (checks.hasLowerCase) score += 20;
  if (checks.hasNumber) score += 20;
  if (checks.hasSpecialChar) score += 20;

  if (score >= 80) strength = 'strong';
  else if (score >= 60) strength = 'medium';

  return {
    strength,
    score,
    checks,
    isValid: checks.minLength && checks.maxLength && passedChecks >= 3,
    message: getPasswordMessage(checks, strength)
  };
};

const getPasswordMessage = (checks, strength) => {
  if (!checks.minLength) return 'Password troppo corta (minimo 8 caratteri)';
  if (!checks.maxLength) return 'Password troppo lunga (massimo 128 caratteri)';
  
  const missing = [];
  if (!checks.hasUpperCase) missing.push('maiuscola');
  if (!checks.hasLowerCase) missing.push('minuscola');
  if (!checks.hasNumber) missing.push('numero');
  if (!checks.hasSpecialChar) missing.push('carattere speciale');

  if (missing.length > 2) {
    return `Password debole. Aggiungi almeno 2 tra: ${missing.join(', ')}`;
  }

  if (strength === 'strong') return 'Password forte ✓';
  if (strength === 'medium') return 'Password media';
  return 'Password debole';
};

// Email validation (RFC 5322 simplified)
export const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!email || email.length === 0) {
    return { isValid: false, message: 'Email richiesta' };
  }

  if (email.length > 254) {
    return { isValid: false, message: 'Email troppo lunga' };
  }

  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Formato email non valido' };
  }

  // Check disposable email domains (lista base)
  const disposableDomains = [
    'tempmail.com', 'throwaway.email', '10minutemail.com', 'guerrillamail.com',
    'mailinator.com', 'trashmail.com', 'fakeinbox.com'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (disposableDomains.includes(domain)) {
    return { 
      isValid: false, 
      message: 'Email temporanee non consentite' 
    };
  }

  return { isValid: true, message: 'Email valida' };
};

// Username validation
export const validateUsername = (username) => {
  if (!username || username.length === 0) {
    return { isValid: false, message: 'Username richiesto' };
  }

  if (username.length < 3) {
    return { isValid: false, message: 'Username troppo corto (minimo 3 caratteri)' };
  }

  if (username.length > 30) {
    return { isValid: false, message: 'Username troppo lungo (massimo 30 caratteri)' };
  }

  // Solo alfanumerici, underscore, trattini
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { 
      isValid: false, 
      message: 'Solo lettere, numeri, _ e - consentiti' 
    };
  }

  // Reserved usernames
  const reserved = ['admin', 'root', 'system', 'support', 'null', 'undefined'];
  if (reserved.includes(username.toLowerCase())) {
    return { isValid: false, message: 'Username riservato' };
  }

  return { isValid: true, message: 'Username valido' };
};

// Input sanitization per prevenire XSS
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

// Rate limiting client-side (prevention abuse)
export class RateLimiter {
  constructor(maxAttempts = 5, windowMs = 15 * 60 * 1000) { // 5 attempts per 15 min
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.attempts = new Map();
  }

  canAttempt(key) {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record) {
      this.attempts.set(key, { count: 1, firstAttempt: now });
      return { allowed: true, remaining: this.maxAttempts - 1 };
    }

    // Reset window if expired
    if (now - record.firstAttempt > this.windowMs) {
      this.attempts.set(key, { count: 1, firstAttempt: now });
      return { allowed: true, remaining: this.maxAttempts - 1 };
    }

    // Check limit
    if (record.count >= this.maxAttempts) {
      const resetIn = this.windowMs - (now - record.firstAttempt);
      return { 
        allowed: false, 
        remaining: 0,
        resetIn: Math.ceil(resetIn / 1000 / 60) // minutes
      };
    }

    record.count++;
    return { allowed: true, remaining: this.maxAttempts - record.count };
  }

  reset(key) {
    this.attempts.delete(key);
  }
}

// Session fingerprinting (browser fingerprint per rilevare session hijacking)
export const generateFingerprint = async () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#f60';
  ctx.fillRect(125, 1, 62, 20);
  ctx.fillStyle = '#069';
  ctx.fillText('SmartDeck', 2, 15);
  ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
  ctx.fillText('SmartDeck', 4, 17);

  const canvasFingerprint = canvas.toDataURL();

  const fingerprint = {
    canvas: hashCode(canvasFingerprint),
    screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: navigator.deviceMemory || 0,
    userAgent: hashCode(navigator.userAgent)
  };

  return hashCode(JSON.stringify(fingerprint));
};

// Simple hash function
const hashCode = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

// Secure random token generator (CSRF protection)
export const generateCSRFToken = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Detect suspicious patterns
export const detectSuspiciousActivity = (attempts) => {
  if (attempts.length < 3) return { suspicious: false };

  // Check rapid successive failures
  const timeBetweenAttempts = attempts.slice(-3).map((attempt, i, arr) => {
    if (i === 0) return null;
    return attempt.timestamp - arr[i - 1].timestamp;
  }).filter(Boolean);

  const avgTime = timeBetweenAttempts.reduce((a, b) => a + b, 0) / timeBetweenAttempts.length;

  // Less than 500ms between attempts = bot
  if (avgTime < 500) {
    return { 
      suspicious: true, 
      reason: 'rapid-attempts',
      message: 'Attività sospetta rilevata. Attendi qualche secondo.' 
    };
  }

  return { suspicious: false };
};

// Secure localStorage wrapper (encryption basic XOR)
export const secureStorage = {
  set: (key, value) => {
    const encrypted = btoa(JSON.stringify(value)); // Base64 encoding (not true encryption, but obscures)
    localStorage.setItem(key, encrypted);
  },
  
  get: (key) => {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    try {
      return JSON.parse(atob(encrypted));
    } catch {
      return null;
    }
  },
  
  remove: (key) => {
    localStorage.removeItem(key);
  }
};
