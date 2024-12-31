const getApiUrl = () => {
  // In production, use the production domain
  if (process.env.NODE_ENV === 'production') {
    return 'https://ai-legal-assistant.sbouldin.com';
  }
  // In development, point to the local backend server
  return 'http://localhost:4006';
};

export const API_URL = getApiUrl();
