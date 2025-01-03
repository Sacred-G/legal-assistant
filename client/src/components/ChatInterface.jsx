import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'framer-motion';
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

// Function to format AI response with headings and bullets
const formatAIResponse = (text) => {
  // Split into lines
  const lines = text.split('\n');
  let formattedHtml = '';
  let inList = false;
  let inSection = false;

  lines.forEach(line => {
    // Clean the line
    const cleanLine = line.trim();

    if (cleanLine === '') {
      formattedHtml += '<br/>';
      return;
    }

    // Handle section headings (lines with **)
    if (cleanLine.startsWith('**') && cleanLine.endsWith('**')) {
      if (inList) {
        formattedHtml += '</ul>';
        inList = false;
      }
      const headingText = cleanLine.replace(/\*\*/g, '');
      formattedHtml += `<h2 class="font-bold text-xl mt-4 mb-3">${headingText}</h2>`;
      inSection = true;
      return;
    }

    // Handle sub-headings (numbered or with single *)
    if ((cleanLine.match(/^\d+\.\s/) || cleanLine.startsWith('*')) && !cleanLine.startsWith('**')) {
      if (inList) {
        formattedHtml += '</ul>';
        inList = false;
      }
      const headingText = cleanLine.replace(/^\d+\.\s/, '').replace(/\*/g, '');
      formattedHtml += `<h3 class="font-bold text-lg mt-3 mb-2">${headingText}</h3>`;
      return;
    }

    // Handle bullet points (lines starting with - or •)
    if (cleanLine.startsWith('-') || cleanLine.startsWith('•')) {
      if (!inList) {
        formattedHtml += '<ul class="list-disc pl-6 space-y-1">';
        inList = true;
      }
      formattedHtml += `<li>${cleanLine.substring(1).trim()}</li>`;
    }
    // Regular text
    else {
      if (inList) {
        formattedHtml += '</ul>';
        inList = false;
      }
      formattedHtml += `<p class="mb-2">${cleanLine}</p>`;
    }
  });

  if (inList) {
    formattedHtml += '</ul>';
  }

  return formattedHtml;
};

function ChatInterface() {
  const { isDark, theme, animations } = useTheme();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [context, setContext] = useState('');
  const [provider, setProvider] = useState('o1');
  const [fileId, setFileId] = useState(null);

  // Effect to trigger initial analysis when context is set
  useEffect(() => {
    if (context) {
      const analysisPrompt = provider === 'o1' 
        ? "Be Patient. Im rating this report using the Schedule for Permanent Disability (PDRS) 2005 Edition and AMA Guidelines."
        : "Please provide a detailed analysis of this medical report, including all key findings, diagnoses, treatment recommendations, and any notable medical-legal considerations.";
      handleSubmit(null, analysisPrompt);
    }
  }, [context, provider, fileId]);

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      console.log('File selected:', selectedFile.name, 'Size:', selectedFile.size, 'Type:', selectedFile.type);

      if (selectedFile.size > 50 * 1024 * 1024) { // 50MB limit
        const error = 'File size exceeds 50MB limit';
        console.error(error);
        setMessages(prev => [...prev, { text: error, sender: 'error' }]);
        return;
      }

      if (selectedFile.type !== 'application/pdf') {
        const error = 'Please select a PDF file';
        console.error(error);
        setMessages(prev => [...prev, { text: error, sender: 'error' }]);
        return;
      }

      setFile(selectedFile);
      const formData = new FormData();
      formData.append('file', selectedFile);
      console.log('Uploading file to /api/chat/upload...');

      try {
        console.log('Starting file upload...');
        const response = await api.post('/api/chat/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            console.log('Upload progress:', Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        });
        console.log('Upload successful, response:', response.data);

        if (!response.data) {
          throw new Error('No response data received from server');
        }
        
        if (!response.data.text || typeof response.data.text !== 'string') {
          console.error('Invalid response data:', response.data);
          throw new Error('Invalid text content received from server');
        }

        const textContent = response.data.text.trim();
        if (textContent.length === 0) {
          throw new Error('No text content extracted from PDF');
        }

        console.log('Setting context with text length:', textContent.length);
        setContext(textContent);

        // Show success message
        setMessages(prev => [...prev, {
          text: `PDF uploaded successfully (${response.data.pages} pages)`,
          sender: 'system'
        }]);

        // If using assistants service, process the PDF first
        if (provider === 'assistants') {
          console.log('Processing PDF with assistants service...');
          const assistantsResponse = await api.post('/api/process-pdf', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          if (assistantsResponse.data.fileId) {
            console.log('Assistants processing successful, fileId:', assistantsResponse.data.fileId);
            setFileId(assistantsResponse.data.fileId);
          }
        }
      } catch (error) {
        const errorMessage = error.response?.data?.error || error.message;
        console.error('Error uploading file:', {
          message: errorMessage,
          response: error.response?.data,
          status: error.response?.status,
          fullError: error
        });

        // Show error message to user
        setMessages(prev => [...prev, {
          text: `Error uploading file: ${errorMessage}`,
          sender: 'error'
        }]);

        // Clear file selection and state
        event.target.value = '';
        setFile(null);
        setContext('');
        setFileId(null);
      }
    }
  };

  const handleSubmit = async (e, promptText) => {
    if (e) e.preventDefault();

    const messageText = promptText || input;
    if (!messageText.trim()) return;

    // Set sender as 'system' for automatic analysis prompts
    const newMessage = {
      text: messageText,
      sender: promptText ? 'system' : 'user'
    };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Validate context is available
      if (!context) {
        throw new Error('No document context available. Please upload a PDF first.');
      }

      const useAssistants = provider === 'assistants';
      const endpoint = useAssistants ? '/api/assistants/chat' : '/api/chat';

      const payload = {
        message: messageText,
        context: typeof context === 'string' ? context : JSON.stringify(context),
        ...(useAssistants ? { fileId } : { provider })
      };

      console.log('Sending payload with context length:', payload.context.length);

      const response = await api.post(endpoint, payload);
      if (response.data.response) {
        const aiMessage = { text: response.data.response, sender: 'ai' };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error.response?.data?.error || error.message || 'An error occurred while processing your message';
      setMessages(prev => [...prev, {
        text: `Error: ${errorMessage}`,
        sender: 'error'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`route-content w-full max-w-full mx-auto p-2 rounded-lg flex flex-col h-[calc(100vh-6rem)]`}
      style={{
        boxShadow: theme.shadow.lg,
        backgroundColor: 'var(--background-main)'
      }}
    >
      <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>Medical Report Analysis</h2>

      {/* Controls Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 mb-6">
        <div>
          <label className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2`} title="Choose an AI provider for medical report analysis:
• OpenAI GPT-o1-model: Specialized for workers' comp ratings
• OpenAI GPT-4o: General medical report analysis
• Anthropic Claude: Enhanced medical terminology understanding
• Google Gemini: Comprehensive report summarization
• PDR Specialist: Advanced assistant with built-in PDRS calculations and reference data">AI Provider (hover for info)</label>
          <select
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value);
              setFileId(null);
              if (e.target.value === 'assistants' && file) {
                const formData = new FormData();
                formData.append('file', file);
                api.post('/api/process-pdf', formData, {
                  headers: { 'Content-Type': 'multipart/form-data' },
                }).then(response => {
                  if (response.data.fileId) {
                    setFileId(response.data.fileId);
                  }
                }).catch(error => {
                  console.error('Error uploading file to assistants:', error);
                });
              }
            }}
            className={`w-full py-2 px-4 border ${isDark
              ? 'bg-gray-700 border-gray-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
              } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
          >
            <option value="o1">OpenAI GPT-o1-model</option>
            <option value="openai">OpenAI GPT-4o</option>
            <option value="anthropic">Anthropic Claude</option>
            <option value="gemini">Google Gemini</option>
            <option value="assistants">OpenAI Assistant (PDR Specialist)</option>
          </select>
        </div>

        <div>
          <label className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2`}>Upload Medical Report (PDF)</label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className={`w-full py-2 px-4 border ${isDark
              ? 'bg-gray-700 border-gray-600 text-white file:text-gray-200 file:bg-gray-600'
              : 'bg-white border-gray-300 text-gray-900'
              } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
          />
        </div>
      </div>

      {/* Chat Messages Section */}
      <div
        className="rounded-lg p-2 mb-4 flex-1 overflow-y-auto scroll-smooth"
        style={{
          boxShadow: theme.shadow.lg,
          minHeight: '600px',
          height: 'calc(100vh - 300px)',
          backgroundColor: 'var(--background-secondary)'
        }}
      >
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={`mb-4 ${message.sender === 'user' ? 'flex justify-end' : 'flex justify-start'}`}
            >
              <motion.div
                whileHover={{ scale: 1.01 }}
                className={`max-w-full sm:max-w-[98%] rounded-lg p-2 relative ${message.sender === 'user'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white ml-4'
                  : isDark
                    ? 'bg-gray-900 border-gray-700 text-gray-200'
                    : 'bg-white'
                  }`}
                style={{
                  boxShadow: theme.shadow.md,
                  border: message.sender !== 'user' ? `1px solid ${theme.border}` : 'none',
                  transition: animations.transition.normal
                }}
              >
                {message.sender === 'ai' && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      navigator.clipboard.writeText(message.text)
                        .then(() => {
                          const button = document.activeElement;
                          if (button) {
                            const originalTitle = button.getAttribute('title');
                            button.setAttribute('title', 'Copied!');
                            setTimeout(() => {
                              button.setAttribute('title', originalTitle);
                            }, 1500);
                          }
                        })
                        .catch(err => console.error('Failed to copy text:', err));
                    }}
                    className={`absolute top-2 right-2 p-1.5 ${isDark
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      } rounded-md`}
                    style={{ transition: animations.transition.fast }}
                    title="Copy to clipboard"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </motion.button>
                )}
                <div className={`text-sm ${message.sender === 'user' ? 'text-white' : isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  {message.sender === 'error' ? (
                    <div className="text-red-500">{message.text}</div>
                  ) : (
                    <div
                      className={isDark ? 'dark-mode-content' : ''}
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatAIResponse(message.text)) }}
                    />
                  )}
                </div>
              </motion.div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center items-center py-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="rounded-full h-8 w-8 border-t-2 border-b-2"
                style={{
                  borderColor: theme.primary.main
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Section */}
      <motion.form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-2 sm:gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question about the medical report..."
          className={`flex-1 py-3 px-4 border ${isDark
            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
          disabled={isLoading}
        />
        <motion.button
          type="submit"
          disabled={isLoading || !input.trim()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
          style={{
            boxShadow: theme.shadow.md,
            transition: animations.transition.normal
          }}
        >
          Send
        </motion.button>
      </motion.form>
    </motion.div>
  );
}

export default ChatInterface;
