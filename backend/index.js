
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS PRIMA DI TUTTO
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json());

// Rotte autenticazione
app.use('/auth', authRoutes);

// Connessione a MongoDB
connectDB();


// Rotta di test
app.get('/', (req, res) => {
  res.send('Backend attivo e connesso a MongoDB!');
});


// Rotte flashcard
const flashRoutes = require('./routes/flash');
app.use('/flash', flashRoutes);

// Rotte test result (statistiche test)
const testResultRoutes = require('./routes/testResult');
app.use('/testresult', testResultRoutes);

app.listen(PORT, () => {
  console.log(`Server avviato sulla porta ${PORT}`);
});
