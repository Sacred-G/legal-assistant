require('dotenv').config();
const express = require('express');
const path = require('path');
const assistantsService = require('./services/assistantsService');

const app = express();

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/dist')));
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Configure CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = ['http://localhost:5173', 'http://localhost:4006', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'];
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, Accept, Origin'
    );
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      // Add headers specifically for file uploads
      if (req.headers['access-control-request-headers']?.includes('content-type')) {
        res.setHeader(
          'Access-Control-Allow-Headers',
          'Content-Type, Authorization, X-Requested-With, Accept, Origin'
        );
      }
      return res.sendStatus(204);
    }
  }
  
  next();
});

// Add specific headers for multipart/form-data requests
app.use((req, res, next) => {
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  next();
});

// Log all requests
app.use((req, res, next) => {
  console.log('Request:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    origin: req.headers.origin
  });
  next();
});

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Increase timeout for all routes
app.use((req, res, next) => {
  res.setTimeout(300000); // 5 minutes
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Initialize assistants service
(async () => {
  try {
    console.log('Initializing assistants service...');
    await assistantsService.initialize();
    console.log('Assistants service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize assistants service:', error);
    process.exit(1);
  }
})();

// Import routes
const authRouter = require('./routes/auth');
const uploadRouter = require('./routes/upload').router;
const chatRouter = require('./routes/chat');
const documentsRouter = require('./routes/documents');
const pdrRouter = require('./routes/pdr');
const caseLawRouter = require('./routes/case-law');
const systemRouter = require('./routes/system');
const cloneRouter = require('./routes/clone');
const searchRouter = require('./routes/search');

// Use routes
app.use('/api/auth', authRouter);
app.use('/api', uploadRouter); // Changed to mount at /api to handle /api/chat/upload
app.use('/api/chat', chatRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/pdr', pdrRouter);
app.use('/api/case-law', caseLawRouter);
app.use('/api/system', systemRouter);
app.use('/api/clone', cloneRouter);
app.use('/api/search', searchRouter);

// Serve React app for any unknown routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
  });
}

const PORT = process.env.PORT || 4001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
