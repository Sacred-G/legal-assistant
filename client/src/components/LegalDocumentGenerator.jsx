import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LegalDocumentGenerator = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check system preference on mount
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(prefersDark);
  }, []);

  const [docName, setDocName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [law, setLaw] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult('');

    console.log('Submitting form with values:', { docName, purpose, law });

    try {
      console.log('Making API request...');
      const response = await axios.post('/api/generate-legal-document', {
        docName,
        purpose,
        law
      }, {
        responseType: 'text',
        onDownloadProgress: (progressEvent) => {
          const text = progressEvent.event.target.responseText;
          setResult(text);
        }
      });
    } catch (err) {
      console.error('API request failed:', err);
      setError(
        err.response?.data?.error || 
        err.response?.data?.message || 
        err.message || 
        'An error occurred while generating the document'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full max-w-full mx-auto ${isDark ? 'bg-gray-900/95 backdrop-blur-sm' : 'bg-white'} rounded-lg shadow-lg p-2 min-h-screen flex flex-col transition-colors duration-200`}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h2 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Legal Document Generator
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
          <label className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Document Name:</label>
          <input
            type="text"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            className={`mt-1 block w-full p-2 border ${isDark ? 'border-gray-700 bg-gray-800/80 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 backdrop-blur-sm`}
            required
            placeholder="Enter document name"
            disabled={loading}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Purpose:</label>
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className={`mt-1 block w-full p-2 border ${isDark ? 'border-gray-700 bg-gray-800/80 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 backdrop-blur-sm`}
            rows="3"
            required
            placeholder="Enter document purpose"
            disabled={loading}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Applicable Law:</label>
          <textarea
            value={law}
            onChange={(e) => setLaw(e.target.value)}
            className={`mt-1 block w-full p-2 border ${isDark ? 'border-gray-700 bg-gray-800/80 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 backdrop-blur-sm`}
            rows="3"
            required
            placeholder="Enter applicable law"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full px-4 py-2 rounded-md transition duration-300 ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-90 text-white'
          }`}
        >
          {loading ? 'Generating...' : 'Generate Document'}
        </button>
      </form>

      {loading && (
        <div className="mt-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Generating document...</p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 flex-1 overflow-auto">
          <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Generated Document:</h3>
          <div className={`${isDark ? 'bg-gray-800/80 backdrop-blur-sm' : 'bg-gray-100'} p-4 rounded-md overflow-y-auto transition-colors duration-200`}>
            <div className={`${isDark ? 'bg-gray-900/90 border-gray-700' : 'bg-white border-gray-200'} p-4 rounded-lg shadow-lg border backdrop-blur-sm transition-colors duration-200`}>
              <div 
                className={`legal-content ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
              >
                <style>
                  {`
                    .legal-content {
                      font-family: 'Times New Roman', Times, serif;
                      line-height: 1.6;
                    }
                    .legal-content h1 {
                      font-size: 24px;
                      font-weight: bold;
                      margin-bottom: 16px;
                      border-bottom: 2px solid ${isDark ? '#4a5568' : '#e5e5e5'};
                      padding-bottom: 8px;
                    }
                    .legal-content h2 {
                      font-size: 20px;
                      font-weight: bold;
                      margin-top: 20px;
                      margin-bottom: 12px;
                    }
                    .legal-content h3 {
                      font-size: 18px;
                      font-weight: bold;
                      margin-top: 16px;
                      margin-bottom: 8px;
                    }
                    .legal-content p {
                      margin-bottom: 12px;
                    }
                    .legal-content ul, .legal-content ol {
                      margin-left: 24px;
                      margin-bottom: 12px;
                    }
                    .legal-content li {
                      margin-bottom: 6px;
                    }
                    .legal-content strong {
                      font-weight: 600;
                    }
                  `}
                </style>
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: result
                      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/^- (.*$)/gm, '<ul><li>$1</li></ul>')
                      .replace(/^(\d+)\. (.*$)/gm, '<ol><li>$2</li></ol>')
                      .replace(/\n\n/g, '</p><p>')
                      .replace(/^(.+)$/gm, function(match) {
                        if (!match.startsWith('<')) {
                          return '<p>' + match + '</p>';
                        }
                        return match;
                      })
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegalDocumentGenerator;
