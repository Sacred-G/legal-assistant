import { useState } from 'react';

const IframePage = () => {
  const [iframeUrl, setIframeUrl] = useState('');

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    // Basic URL validation
    if (iframeUrl && (iframeUrl.startsWith('http://') || iframeUrl.startsWith('https://'))) {
      setIframeUrl(iframeUrl);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <form onSubmit={handleUrlSubmit} className="mb-4">
        <div className="flex gap-2">
          <input
            type="url"
            value={iframeUrl}
            onChange={(e) => setIframeUrl(e.target.value)}
            placeholder="Enter website URL (https://...)"
            className="flex-1 p-2 border rounded"
            required
          />
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Load
          </button>
        </div>
      </form>
      
      {iframeUrl && (
        <div className="w-full h-[800px] border rounded">
          <iframe
            src={iframeUrl}
            className="w-full h-full"
            title="External Content"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>
      )}
    </div>
  );
};

export default IframePage;
