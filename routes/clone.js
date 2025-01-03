const express = require('express');
const cloneService = require('../services/cloneService');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    const response = await cloneService.generateCloneResponse(message);
    res.json(response);
  } catch (error) {
    console.error('Clone service error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to process clone request' 
    });
  }
});

module.exports = router;
