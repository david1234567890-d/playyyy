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
// Make sure all API routes return JSON, not HTML
app.get('/api/*', (req, res) => {
    res.json({ message: 'API response' }); // Always JSON
});

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Something went wrong!' 
    });
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'API endpoint not found' 
    });
});
// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;