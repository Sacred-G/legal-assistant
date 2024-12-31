require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const path = require('path');
const openaiService = require('./services/openaiService');
const anthropicService = require('./services/anthropicService');
const geminiService = require('./services/geminiService');
const wordwareService = require('./services/wordwareService');
const assistantsService = require('./services/assistantsService');
const pdrService = require('./services/pdrService');

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
app.use(cors());

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size is too large. Maximum size is 50MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  next(err);
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    fieldSize: 100 * 1024 * 1024 // 100MB limit
  }
}).single('pdf');

// Wrap multer in a promise-based handler with better error handling
const uploadMiddleware = (req, res) => {
  return new Promise((resolve, reject) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          reject({ status: 400, message: 'File size is too large. Maximum size is 100MB.' });
        } else {
          reject({ status: 400, message: err.message });
        }
      } else if (err) {
        reject({ status: 500, message: 'Error uploading file' });
      }
      resolve();
    });
  });
};

app.use(handleMulterError);

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

// Handle file uploads for both assistants and chat context
app.post('/api/chat/upload', async (req, res) => {
  try {
    console.log('File upload request received');

    await uploadMiddleware(req, res);

    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File details:', {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      encoding: req.file.encoding
    });

    if (req.file.mimetype !== 'application/pdf') {
      console.error('Invalid file type:', req.file.mimetype);
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    if (req.file.size > 100 * 1024 * 1024) {
      console.error('File too large:', req.file.size);
      return res.status(400).json({ error: 'File size exceeds 100MB limit' });
    }

    console.log('Starting PDF parsing...');

    const pdfData = await Promise.race([
      pdfParse(req.file.buffer, {
        max: 0,
        pagerender: function (pageData) {
          return pageData.getTextContent().then(textContent => {
            return textContent.items.map(item => item.str).join(' ');
          });
        }
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('PDF parsing timeout')), 30000)
      )
    ]);

    console.log('PDF parsed successfully:', {
      pages: pdfData.numpages,
      rawTextLength: pdfData.text.length,
      info: pdfData.info
    });

    const cleanedText = pdfData.text
      .replace(/\s{3,}/g, '\n')
      .replace(/Page \d+ of \d+/g, '')
      .replace(/\b(DWC-CA form.*?)\b/gi, '')
      .replace(/\[object Object\]/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    console.log('Text cleaned, final length:', cleanedText.length);

    if (!cleanedText || cleanedText.length === 0) {
      console.error('No text extracted from PDF');
      return res.status(400).json({ error: 'Could not extract text from PDF' });
    }

    res.json({
      text: cleanedText,
      pages: pdfData.numpages,
      originalName: req.file.originalname
    });
  } catch (error) {
    console.error('Error processing PDF:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    let errorMessage = 'Error processing PDF';
    if (error.message === 'PDF parsing timeout') {
      errorMessage = 'PDF processing timed out. Please try again with a simpler document.';
    } else if (error.message.includes('Invalid PDF structure')) {
      errorMessage = 'Invalid or corrupted PDF file';
    }

    res.status(500).json({ error: errorMessage });
  }
});

app.post('/api/chat', async (req, res) => {
  const { provider, message, context } = req.body;

  try {
    if (!context || context.trim() === '') {
      return res.status(400).json({
        error: 'No context provided. Please upload a document first.'
      });
    }

    console.log('Context length:', context?.length || 0);
    console.log('Message:', message);
    console.log('Provider:', provider);

    let response;
    try {
      switch (provider) {
        case 'openai':
          response = await openaiService.generateResponse(message, context);
          break;
        case 'anthropic':
          response = await anthropicService.generateResponse(message, context);
          break;
        case 'gemini':
          response = await geminiService.generateResponse(message, context);
          break;
        default:
          throw new Error('Invalid provider specified');
      }
    } catch (error) {
      console.error('Provider error:', error);
      throw error;
    }

    res.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(error.status || 500).json({
      error: error.message || 'An error occurred while processing your request'
    });
  }
});

app.post('/api/assistants/chat', async (req, res) => {
  const { message, context, fileId } = req.body;

  try {
    let response = await assistantsService.generateResponse(message, context, fileId);

    if (response && typeof response === 'string') {
      if (response.includes('Please ensure your response includes all required elements in this exact format')) {
        response = response.split('Please ensure your response includes all required elements in this exact format')[0].trim();
      }

      if (response.includes('{"type":"object"')) {
        response = response.split('{"type":"object"}')[0].trim();
      }
    }

    res.json({ response });
  } catch (error) {
    console.error('Assistants chat error:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack,
      response: error.response?.data
    });
    res.status(500).json({
      error: 'Error generating response',
      details: error.message,
      type: error.type,
      code: error.code
    });
  }
});

app.post('/api/generate-legal-document', async (req, res) => {
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

app.post('/api/case-law-research', async (req, res) => {
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

// PDF Processing endpoint with streaming
app.post('/api/process-pdf', async (req, res) => {
  try {
    await uploadMiddleware(req, res);

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    if (req.file.size > 100 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds 100MB limit' });
    }

    console.log('Starting PDF processing...', {
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype
    });

    // Parse PDF text for processing
    console.log('Parsing PDF text...');
    const pdfData = await pdfParse(req.file.buffer);
    console.log('PDF text extracted, length:', pdfData.text.length);

    // Clean up the extracted text
    const cleanedText = pdfData.text
      .replace(/\s{3,}/g, '\n')
      .replace(/Page \d+ of \d+/g, '')
      .replace(/\b(DWC-CA form.*?)\b/gi, '')
      .trim();

    console.log('Cleaned text sample:', cleanedText.substring(0, 200));

    // Get occupation and age from form data
    const occupation = req.body.occupation || '';
    const age = req.body.age || '';
    const useAssistant = req.body.useAssistant === 'true';
    console.log('Processing PDR with:', { occupation, age, useAssistant });

    // Process the medical report using appropriate service
    let analysis;
    if (useAssistant) {
      analysis = await assistantsService.processMedicalReport(cleanedText, occupation, age);
    } else {
      analysis = await pdrService.processMedicalReport(cleanedText, occupation, age);
    }

    // Send the initial response
    res.json({
      status: 'processing',
      analysis
    });

  } catch (error) {
    console.error('Error processing PDF:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Error processing PDF',
      details: error.message,
      type: error.type,
      code: error.code
    });
  }
});

// File search endpoint
app.post('/api/search', async (req, res) => {
  try {
    const { query, fileType } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const results = await pdrService.searchFiles(query, fileType);
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
});

// Code interpretation endpoint
app.post('/api/execute-code', async (req, res) => {
  try {
    const { code, language, inputData } = req.body;
    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required' });
    }

    const result = await pdrService.executeCode(code, language, inputData);
    res.json(result);
  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json({ error: 'Failed to execute code' });
  }
});

// Validate PDR response format
function validatePDRResponse(content) {
  const requiredElements = [
    /\d{2}\.\d{2}\.\d{2}\.\d{2}/,
    /WPI/,
    /FEC/,
    /GroupVariant/,
    /Combined Rating \d+%/,
    /Total Weeks of PD \d+/,
    /Age on DOI/,
    /Average Weekly Earnings/,
    /PD Weekly Rate/,
    /Total PD Payout/,
    /FM:/
  ];

  const missingElements = requiredElements.filter(regex => !regex.test(content));

  if (missingElements.length > 0) {
    return {
      isValid: false,
      missingElements,
      error: 'Missing required elements in response'
    };
  }

  const combinedRatingMatches = content.match(/(\d+(?:\.\d+)?%)\s+C\s+(\d+(?:\.\d+)?%)\s+=\s+(\d+(?:\.\d+)?%)/g);
  if (!combinedRatingMatches) {
    return {
      isValid: false,
      error: 'No combined ratings found or invalid format'
    };
  }

  for (const match of combinedRatingMatches) {
    const [a, b, result] = match.match(/(\d+(?:\.\d+)?)/g).map(Number);
    const expectedResult = Math.round((a + (b * (1 - (a / 100)))) * 100) / 100;

    if (Math.abs(result - expectedResult) > 0.1) {
      return {
        isValid: false,
        error: `Invalid combination calculation: ${a}% C ${b}% = ${result}%. Expected ${expectedResult}%`
      };
    }
  }

  const spineMatch = content.match(/spine|cervical|thoracic|lumbar/i);
  const upperExtremityMatch = content.match(/shoulder|elbow|wrist|hand|finger/i);
  const lowerExtremityMatch = content.match(/hip|knee|ankle|foot|toe/i);

  if (spineMatch) {
    const spineAdditions = content.match(/Table 15-7|Range of Motion|Spinal Disorder/g);
    if (!spineAdditions) {
      return {
        isValid: false,
        error: 'Spine ratings must specify Table 15-7, Range of Motion, or Spinal Disorder'
      };
    }
  }

  if (upperExtremityMatch || lowerExtremityMatch) {
    const romMatch = content.match(/ROM|range of motion/i);
    if (romMatch && !content.match(/add|added|addition/i)) {
      return {
        isValid: false,
        error: 'Range of motion impairments for same joint should be added, not combined'
      };
    }
  }

  return {
    isValid: true
  };
}

// Serve React app for any unknown routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
  });
}

const PORT = process.env.PORT || 4006;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
