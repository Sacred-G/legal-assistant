const express = require('express');
const router = express.Router();
const pdrService = require('../services/pdrService');
const assistantsService = require('../services/assistantsService');
const { uploadMiddleware } = require('./upload');
const pdfParse = require('pdf-parse');

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

// Process PDF endpoint
router.post('/process-pdf', async (req, res) => {
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
router.post('/search', async (req, res) => {
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

// Code execution endpoint
router.post('/execute-code', async (req, res) => {
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

module.exports = router;
