require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Plag Market API is running!' });
});

// Auth routes
app.post('/api/register', (req, res) => {
  res.json({ message: 'Register endpoint' });
});

app.post('/api/login', (req, res) => {
  res.json({ message: 'Login endpoint' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;