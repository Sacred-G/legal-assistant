const mcpService = require('./mcpService');

class GoogleSearchService {
  async search(query, numResults = 5) {
    try {
      const result = await mcpService.useTool('google-search', 'search', {
        query,
        num: numResults
      });
      return result;
    } catch (error) {
      console.error('Google search error:', error);
      throw error;
    }
  }
}

module.exports = new GoogleSearchService();
