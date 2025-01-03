const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');

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
}).single('file');

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

router.use(handleMulterError);

// Handle file uploads for both assistants and chat context
router.post('/chat/upload', async (req, res) => {
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

    console.log('Starting PDF text extraction...');
    const pdfData = await Promise.race([
      pdfParse(req.file.buffer, {
        max: 0,
        pagerender: function (pageData) {
          console.log('Processing page...');
          return pageData.getTextContent().then(textContent => {
            const text = textContent.items.map(item => item.str).join(' ');
            console.log('Page text extracted, length:', text.length);
            return text;
          });
        }
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('PDF parsing timeout')), 300000) // 5 minutes timeout
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

module.exports = {
  router,
  uploadMiddleware
};
