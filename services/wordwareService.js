const axios = require('axios');

const performCaseLawResearch = async (query, jurisdiction, timeFrame, sources, includeKeywords, excludeKeywords) => {
  if (!process.env.WORDWARE_API_KEY) {
    throw new Error('WORDWARE_API_KEY is not configured');
  }

  try {
    const response = await axios.post(
      'https://app.wordware.ai/api/released-app/2b146324-34f7-496a-9968-8dd3dd3c8fe2/run',
      {
        inputs: {
          Query: query,
          Jurisdiction: jurisdiction,
          "Time Frame": timeFrame,
          Sources: sources,
          "Keywords to include": includeKeywords || query, // Use query as default if no keywords provided
          "Keywords to exclude": excludeKeywords
        },
        version: "^1.0"
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.WORDWARE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        responseType: 'text'
      }
    );

    // Parse the streaming response
    const chunks = response.data.split('\n').filter(Boolean);
    let caseLawResults = [];
    let currentCase = {};

    for (const chunk of chunks) {
      try {
        const parsed = JSON.parse(chunk);
        if (parsed.type === 'chunk' && parsed.value.type === 'tool' && parsed.value.output) {
          // Extract case information from the tool output
          const matches = parsed.value.output.match(/## \[(.*?)\]\((.*?)\)\n#### Published at (.*?)\n\n#### From: \[source\]\((.*?)\)\n\n#### Excerpts: \n\n([\s\S]*?)(?=\n\n##|$)/g);

          if (matches) {
            matches.forEach(match => {
              const [_, title, url, publishedAt, source, excerpts] = match.match(/## \[(.*?)\]\((.*?)\)\n#### Published at (.*?)\n\n#### From: \[source\]\((.*?)\)\n\n#### Excerpts: \n\n([\s\S]*?)(?=\n\n##|$)/);

              caseLawResults.push({
                title,
                url,
                publishedAt,
                source,
                excerpts: excerpts.trim()
              });
            });
          }
        }
      } catch (e) {
        console.error('Error parsing chunk:', e);
      }
    }

    return {
      results: caseLawResults.map(result => ({
        title: result.title,
        url: result.url,
        publishedAt: result.publishedAt,
        excerpts: result.excerpts
      }))
    };
  } catch (error) {
    if (error.response) {
      throw new Error(`API request failed: ${error.response.data.message || error.response.statusText}`);
    }
    throw error;
  }
};

module.exports = {
  performCaseLawResearch
};
