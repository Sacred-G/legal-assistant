const getApiUrl = () => {
  // In production, use relative URLs
  if (process.env.NODE_ENV === 'production') {
    return '';
  }
  // In development, point to the local backend server
  return 'http://localhost:4006';
};

export const API_URL = getApiUrl();
