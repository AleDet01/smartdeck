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
    match: [/^[a-z0-9_]+$/, 'Username può contenere solo lettere minuscole, numeri e underscore'],
    index: true // Indice per query veloci
  },
  password: { 
    type: String, 
    required: [true, 'Password richiesta'],
    minlength: [8, 'Password deve essere almeno 8 caratteri'],
    select: false // Non restituire password di default
  }
}, {
  timestamps: true,
  versionKey: false // Rimuovi __v per cleaner data
});

// Compound index per query ottimizzate
userSchema.index({ username: 1, createdAt: -1 });

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
