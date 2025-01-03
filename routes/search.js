const express = require('express');
const router = express.Router();
const googleSearchService = require('../services/googleSearchService');

router.post('/', async (req, res) => {
  try {
    const { query, numResults } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const results = await googleSearchService.search(query, numResults);
    res.json(results);
  } catch (error) {
    console.error('Search route error:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
});

module.exports = router;
