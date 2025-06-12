const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const printRoutes = require('./routes/print');
const deviceRoutes = require('./routes/device');
const statusRoutes = require('./routes/status');

// Check if app should run in background mode
const isBackgroundMode = process.argv.includes('--background');

// Hide console output in background mode
if (isBackgroundMode) {
  console.log = () => {};
  console.error = () => {};
  console.warn = () => {};
  console.info = () => {};
}

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3310;
let server; // Store server reference for terminate functionality

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Set view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

// Swagger setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Routes
app.use('/api/print', printRoutes);
app.use('/api/device', deviceRoutes);
app.use('/api/status', statusRoutes);

// Terminate endpoint
app.post('/api/terminate', (req, res) => {
  const { terminationKey } = req.body;
  
  // Generate a unique key for this server instance (could be more sophisticated in production)
  const validKey = `terminate-${process.pid}`;
  
  if (terminationKey === validKey) {
    res.json({
      success: true,
      message: 'Application terminating...'
    });
    
    // Delay shutdown to allow response to be sent
    setTimeout(() => {
      if (server) {
        server.close(() => {
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    }, 500);
  } else {
    res.status(403).json({
      success: false,
      message: 'Invalid termination key'
    });
  }
});

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start server
server = app.listen(PORT, () => {
  if (!isBackgroundMode) {
    console.log(`Print agent server is running on port ${PORT}`);
    console.log(`Termination key: terminate-${process.pid}`);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Export termination key for status API
app.set('terminationKey', `terminate-${process.pid}`);

module.exports = app; 