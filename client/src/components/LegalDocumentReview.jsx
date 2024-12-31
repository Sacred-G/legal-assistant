import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';

const LegalDocumentReview = () => {
  const { isDark, theme } = useTheme();
  const fileInputRef = React.useRef(null);
  const [file, setFile] = useState(null);
  const [party, setParty] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Reset state when component unmounts
  React.useEffect(() => {
    return () => {
      setFile(null);
      setParty('');
      setResult(null);
      setError(null);
    };
  }, []);

  const handleFileChange = (e) => {
    try {
      const input = e.target;
      if (input && input.files && input.files.length > 0) {
        const selectedFile = input.files[0];
        if (selectedFile) {
          // Validate file type
          const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
          if (!validTypes.includes(selectedFile.type)) {
            setError('Please upload a PDF or Word document');
            setFile(null);
            return;
          }
          setFile(selectedFile);
          setError(null);
        }
      }
    } catch (err) {
      console.error('File selection error:', err);
      setError('Error selecting file');
      setFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!file) {
        setError('Please select a file to review');
        return;
      }
      if (!party) {
        setError('Please enter the party name');
        return;
      }

      setLoading(true);
      setError(null);

      // Create FormData with file and party info
      const formData = new FormData();
      formData.append('file', file);
      formData.append('party', party);

      console.log('Sending file:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      // Send to review endpoint using proxy
      const reviewResponse = await fetch('/api/review-document', {
        method: 'POST',
        body: formData
      });

      console.log('Review response:', {
        status: reviewResponse.status,
        statusText: reviewResponse.statusText
      });

      if (reviewResponse.status === 403) {
        throw new Error('Access forbidden. Please check server configuration.');
      }

      if (!reviewResponse.ok) {
        const errorData = await reviewResponse.json();
        throw new Error(errorData.error || 'Failed to review document');
      }

      const data = await reviewResponse.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-6 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`max-w-4xl mx-auto p-6 rounded-lg shadow-lg ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}
        style={{ boxShadow: theme.shadow.lg }}
      >
        <h1 className="text-2xl font-bold mb-6">Legal Document Review</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 font-medium">Upload Document</label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
              className={`w-full p-2 rounded border ${
                isDark 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-gray-50 border-gray-300'
              }`}
            />
            <p className="text-sm text-gray-500 mt-1">
              Supported formats: PDF, DOC, DOCX
            </p>
          </div>

          <div>
            <label className="block mb-2 font-medium">Party Name</label>
            <input
              type="text"
              value={party}
              onChange={(e) => setParty(e.target.value)}
              placeholder="Enter party name"
              className={`w-full p-2 rounded border ${
                isDark 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-gray-50 border-gray-300'
              }`}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm mt-2">
              {error}
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded font-medium ${
              loading
                ? 'bg-gray-400'
                : isDark
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white transition-colors`}
          >
            {loading ? 'Reviewing...' : 'Review Document'}
          </motion.button>
        </form>

        {result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8"
          >
            <h2 className="text-xl font-bold mb-4">Review Results</h2>
            <pre className={`p-4 rounded ${
              isDark ? 'bg-gray-700' : 'bg-gray-100'
            } overflow-auto`}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default LegalDocumentReview;
