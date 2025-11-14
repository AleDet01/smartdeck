const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: [true, 'Username richiesto'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username deve essere almeno 3 caratteri'],
    maxlength: [30, 'Username non può superare 30 caratteri'],
    match: [/^[a-z0-9_]+$/, 'Username può contenere solo lettere minuscole, numeri e underscore']
  },
  password: { 
    type: String, 
    required: [true, 'Password richiesta'],
    minlength: [8, 'Password deve essere almeno 8 caratteri'],
    select: false // Non restituire password di default
  },
  email: {
    type: String,
    sparse: true, // Permette null ma unique se presente
    lowercase: true,
    trim: true,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Email non valida']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true,
  versionKey: false // Rimuovi __v per cleaner data
});

// Indexes ottimizzati per produzione
userSchema.index({ username: 1 }, { unique: true }); // Login rapidi
userSchema.index({ email: 1 }, { sparse: true }); // Password recovery
userSchema.index({ createdAt: -1 }); // Ordinamento cronologico
userSchema.index({ lastLogin: -1 }); // Analytics utenti attivi
userSchema.index({ isVerified: 1, createdAt: -1 }); // Utenti da verificare

// Pre-save hook per validazioni extra (se necessario)
userSchema.pre('save', function(next) {
  // Validazioni custom qui se necessario
  next();
});

// Instance methods
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password; // Non esporre mai password in JSON
  return obj;
};

module.exports = mongoose.model('User', userSchema, 'user');
