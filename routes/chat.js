const express = require('express');
const router = express.Router();
const openaiService = require('../services/openaiService');
const anthropicService = require('../services/anthropicService');
const geminiService = require('../services/geminiService');
const o1Service = require('../services/o1Service');
const assistantsService = require('../services/assistantsService');

// Regular chat endpoint
router.post('/', async (req, res) => {
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
        case 'o1':
          response = await o1Service.generateResponse(message, context);
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

// Assistants chat endpoint
router.post('/assistants', async (req, res) => {
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

module.exports = router;
