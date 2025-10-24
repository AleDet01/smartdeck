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
// Helpful indexes for common queries
TestResultSchema.index({ userId: 1, area: 1, createdAt: -1 });
TestResultSchema.index({ area: 1, createdAt: -1 });

module.exports = mongoose.model('TestResult', TestResultSchema, 'testResults');
