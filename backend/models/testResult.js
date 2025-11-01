const mongoose = require('mongoose');

const TestResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // referenzia l'utente trmaite ref:User
  area: { type: String, required: true },
  numQuestions: { type: Number, required: true }, //Number
  answers: [ // vettore di single answer : domanda, rispostaUtente, rispostaCorretta, isCorrect (false se si , true se no), time
    {
      question: String,
      userAnswer: String,
      correctAnswer: String,
      isCorrect: Boolean,
      time: Number // tempo di una singola risposta
    }
  ],
  correctCount: { type: Number, required: true },
  totalTime: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

TestResultSchema.index({ userId: 1, area: 1, createdAt: -1 }); //indice composto su 3 campi
// ottimizzazione query per velocizzare ordinandoli dal più recenti

TestResultSchema.index({ area: 1, createdAt: -1 }); // indice composto su 2 campi


//createdAt = 1 (ordine crescente) e -1 (ordine decrescente)
module.exports = mongoose.model('TestResult', TestResultSchema, 'testResults');
