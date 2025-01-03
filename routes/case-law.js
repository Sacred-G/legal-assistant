const express = require('express');
const router = express.Router();
const wordwareService = require('../services/wordwareService');

router.post('/research', async (req, res) => {
  const { query, jurisdiction, timeFrame, sources, includeKeywords, excludeKeywords } = req.body;

  try {
    // Set up streaming response
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Use wordwareService to perform research with streaming results
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

    res.end();
  } catch (error) {
    console.error('Error in case law research:', error);
    res.status(500).json({ error: 'An error occurred while performing research' });
  }
});

module.exports = router;
