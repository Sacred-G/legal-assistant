import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import { API_URL } from '../config/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json',
  },
});

function CaseLawResearcher() {
  const [isDark, setIsDark] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    // Check system preference on mount
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(prefersDark);
  }, []);
  const [jurisdiction, setJurisdiction] = useState('California');
  const [timeFrame, setTimeFrame] = useState('2010-2024');
  const [sources, setSources] = useState('Case Law, Statutes');
  const [includeKeywords, setIncludeKeywords] = useState('');
  const [excludeKeywords, setExcludeKeywords] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResults([]);

    try {
      const response = await api.post('/api/case-law-research', {
        query,
        jurisdiction,
        timeFrame,
        sources,
        includeKeywords,
        excludeKeywords
      }, {
        responseType: 'text',
        onDownloadProgress: (progressEvent) => {
          const text = progressEvent.event.target.responseText;
          const lines = text.split('\n').filter(line => line.trim());
          
          const newResults = lines.map(line => {
            try {
              const parsed = JSON.parse(line);
              return parsed.results?.[0];
            } catch (e) {
              console.error('Error parsing line:', e);
              return null;
            }
          }).filter(Boolean);

          setResults(prevResults => {
            const uniqueResults = [...prevResults];
            newResults.forEach(newResult => {
              if (!uniqueResults.some(r => r.url === newResult.url)) {
                uniqueResults.push(newResult);
              }
            });
            return uniqueResults;
          });
        }
      });
    } catch (error) {
      console.error('Error fetching results:', error);
      setResults({ error: 'An error occurred while fetching results. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full max-w-full mx-auto ${isDark ? 'bg-gray-900/95 backdrop-blur-sm' : 'bg-white'} rounded-lg shadow-lg p-2 min-h-screen flex flex-col transition-colors duration-200`}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h2 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Case Law & Statute Researcher
        </h2>
        <button
          onClick={() => setIsDark(!isDark)}
          className={`p-2 rounded-lg ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'} hover:opacity-80 transition-colors duration-200`}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3 flex-none">
        <div>
          <label className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Query:</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`mt-1 block w-full p-2 border ${isDark ? 'border-gray-700 bg-gray-800/80 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 backdrop-blur-sm`}
            required
            placeholder="Enter your search query"
            disabled={loading}
          />
        </div>
        <div>
          <label className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Jurisdiction:</label>
          <input
            type="text"
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value)}
            className={`mt-1 block w-full p-2 border ${isDark ? 'border-gray-700 bg-gray-800/80 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 backdrop-blur-sm`}
            placeholder="California"
            disabled={loading}
          />
        </div>
        <div>
          <label className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Time Frame:</label>
          <input
            type="text"
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value)}
            className={`mt-1 block w-full p-2 border ${isDark ? 'border-gray-700 bg-gray-800/80 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 backdrop-blur-sm`}
            placeholder="2010-2024"
            disabled={loading}
          />
        </div>
        <div>
          <label className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Sources:</label>
          <input
            type="text"
            value={sources}
            onChange={(e) => setSources(e.target.value)}
            className={`mt-1 block w-full p-2 border ${isDark ? 'border-gray-700 bg-gray-800/80 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 backdrop-blur-sm`}
            placeholder="Case Law, Statutes"
            disabled={loading}
          />
        </div>
        <div>
          <label className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Keywords to Include:</label>
          <input
            type="text"
            value={includeKeywords}
            onChange={(e) => setIncludeKeywords(e.target.value)}
            className={`mt-1 block w-full p-2 border ${isDark ? 'border-gray-700 bg-gray-800/80 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 backdrop-blur-sm`}
            disabled={loading}
          />
        </div>
        <div>
          <label className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Keywords to Exclude:</label>
          <input
            type="text"
            value={excludeKeywords}
            onChange={(e) => setExcludeKeywords(e.target.value)}
            className={`mt-1 block w-full p-2 border ${isDark ? 'border-gray-700 bg-gray-800/80 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 backdrop-blur-sm`}
            placeholder="Enter keywords to exclude (optional)"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          className={`w-full px-4 py-2 rounded-md transition duration-300 ${loading || !query
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-90 text-white'
            }`}
          disabled={loading || !query}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
      {loading && (
        <div className="mt-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Searching for relevant cases...</p>
        </div>
      )}
      {!loading && results && (
        <div className="mt-4 flex-1 overflow-auto">
          <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Results:</h3>
          <div className={`${isDark ? 'bg-gray-800/80 backdrop-blur-sm' : 'bg-gray-100'} p-2 rounded-md whitespace-pre-wrap overflow-y-auto transition-colors duration-200`}>
            {results.error && <p className="text-red-500">{results.error}</p>}
            {!results.error && Array.isArray(results) && results.length === 0 && (
              <p>No results found</p>
            )}
            {!results.error && Array.isArray(results) && results.length > 0 && (
              <div className="space-y-6">
                {results.map((result, index) => (
                  <div key={index} className={`${isDark ? 'bg-gray-900/90 border-gray-700' : 'bg-white border-gray-200'} p-2 rounded-lg shadow-lg border backdrop-blur-sm transition-colors duration-200`}>
                    <h4 className={`text-lg font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'} mb-2`}>{result.title}</h4>
                    <div className="mb-2 overflow-hidden">
                      <a href={result.url} target="_blank" rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:underline break-all">
                        {result.url}
                      </a>
                    </div>
                    {result.publishedAt && (
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                        Published: {new Date(result.publishedAt).toLocaleDateString()}
                      </p>
                    )}
                    {result.excerpts && (
                      <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} overflow-hidden`}>
                        <p className="font-medium mb-1">Excerpts:</p>
                        <p className="whitespace-pre-wrap break-words">{result.excerpts}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CaseLawResearcher;
