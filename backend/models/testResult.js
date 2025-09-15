const mongoose = require('mongoose');

const TestResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  area: { type: String, required: true },
  numQuestions: { type: Number, required: true },
  answers: [
    {
      question: String,
      userAnswer: String,
      correctAnswer: String,
      isCorrect: Boolean,
      time: Number
    }
  ],
  correctCount: { type: Number, required: true },
  totalTime: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('TestResult', TestResultSchema, 'testResults');
