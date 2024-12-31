const getApiUrl = () => {
  // In production, use relative URLs to work with the proxy
  if (import.meta.env.PROD) {
    return '';  // Use relative URLs in production
  }
  // In development, point to the local backend server
  return 'http://localhost:4006';
};

export const API_URL = getApiUrl();
