const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String },
  provider: { type: String }, // es: 'google'
  providerId: { type: String } // id dell'utente sul provider
});

// Validazione condizionale: password richiesta solo per utenti locali (senza provider)
userSchema.path('password').validate(function (value) {
  if (!this.provider) {
    return !!value; // per utenti locali, password è obbligatoria
  }
  return true; // per utenti OAuth la password non è necessaria
}, 'Password richiesta per utenti locali');

module.exports = mongoose.model('User', userSchema, 'user');
