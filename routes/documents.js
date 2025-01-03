const express = require('express');
const router = express.Router();
const wordwareService = require('../services/wordwareService');
const { uploadMiddleware } = require('./upload');

// Generate legal document endpoint
router.post('/generate', async (req, res) => {
  const { docName, purpose, law } = req.body;

  if (!docName || !purpose || !law) {
    return res.status(400).json({ error: 'Document name, purpose, and applicable law are required' });
  }

  try {
    // Set headers for streaming response
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    console.log('Starting legal document generation...');

    // Stream chunks as they arrive
    await wordwareService.generateLegalDocument(
      docName,
      purpose,
      law,
      (chunk) => {
        res.write(chunk);
      }
    );

    // End the response when complete
    res.end();
  } catch (error) {
    console.error('Legal document generation error:', error);
    // Only send error if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({
        error: error.message || 'Error generating legal document',
        details: error.response?.data || error.stack
      });
    } else {
      // If headers were sent, end the stream with an error message
      res.write('\nError: ' + (error.message || 'Error generating legal document'));
      res.end();
    }
  }
});

// Case law research endpoint
router.post('/case-law', async (req, res) => {
  const { query, jurisdiction, timeFrame, sources, includeKeywords, excludeKeywords } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    // Set headers for streaming response
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    console.log('Starting case law research...');

    // Stream results as they arrive
    await wordwareService.performCaseLawResearch(
      query,
      jurisdiction,
      timeFrame,
      sources,
      includeKeywords,
      excludeKeywords,
      (chunk) => {
        res.write(JSON.stringify(chunk) + '\n');
      }
    );

    // End the response when complete
    res.end();
  } catch (error) {
    console.error('Case law research error:', error);
    // Only send error if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({
        error: error.message || 'Error performing case law research',
        details: error.response?.data || error.stack
      });
    } else {
      // If headers were sent, end the stream with an error message
      res.write(JSON.stringify({ error: error.message || 'Error performing case law research' }));
      res.end();
    }
  }
});

// Document review endpoint
router.post('/review', async (req, res) => {
  try {
    console.log('Document review request received', {
      headers: req.headers,
      method: req.method
    });
    
    // Use the promise-based upload middleware
    await uploadMiddleware(req, res);

    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Request body:', req.body);

    console.log('File received:', {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(req.file.mimetype)) {
      console.error('Invalid file type:', req.file.mimetype);
      return res.status(400).json({ error: 'Invalid file type. Please upload a PDF or Word document.' });
    }

    const party = req.body.party;
    if (!party) {
      console.error('No party information provided');
      return res.status(400).json({ error: 'Party information is required' });
    }

    console.log('Processing document review:', {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      party
    });

    // Use the appropriate AI service for document review
    const reviewResults = await wordwareService.reviewLegalDocument(req.file, party);
    
    console.log('Document review completed');
    res.json(reviewResults);
  } catch (error) {
    console.error('Document review error:', {
      message: error.message,
      stack: error.stack,
      details: error.response?.data
    });
    
    if (error instanceof multer.MulterError) {
      return res.status(400).json({ 
        error: 'File upload error',
        details: error.message
      });
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to review document',
      details: error.response?.data || error.stack
    });
  }
});

module.exports = router;
