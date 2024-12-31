const getApiUrl = () => {
  // Use the environment variable if available
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // In production, use relative URLs to work with the proxy
  if (import.meta.env.PROD) {
    return '';  // Use relative URLs in production
  }
  // Fallback to default development URL
  return 'http://localhost:4006';
};

export const API_URL = getApiUrl();
