const getApiUrl = () => {
  if (import.meta.env.MODE === 'production') {
    return 'https://ai-legal-assistant-mmsq7zuay-sacredgs-projects.vercel.app';
  }
  return 'http://localhost:4006';
};

export const API_URL = getApiUrl();
