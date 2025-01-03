const express = require('express');
const systemService = require('../services/systemService');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    const response = await systemService.generateSystemResponse(message);
    res.json(response);
  } catch (error) {
    console.error('System command error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to execute system command' 
    });
  }
});

module.exports = router;
