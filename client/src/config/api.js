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

export const sendCloneMessage = async (message) => {
  const response = await fetch(`${API_URL}/api/clone`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return response.text();
};

export const sendSystemMessage = async (message) => {
  const response = await fetch(`${API_URL}/api/system`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return response.text();
};
