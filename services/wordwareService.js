const axios = require('axios');
const FormData = require('form-data');

const generateLegalDocument = async (docName, purpose, law, onChunk) => {
  if (!process.env.WORDWARE_API_KEY) {
    throw new Error('WORDWARE_API_KEY is not configured');
  }

  try {
    console.log('Generating legal document with params:', { docName, purpose, law });
    
    const response = await axios({
      method: 'post',
      url: 'https://app.wordware.ai/api/released-app/a0747fc6-c819-429e-b307-e64eb330f9f3/run',
      data: {
        inputs: {
          doc_name: docName,
          purpose: purpose,
          law: law
        },
        version: "^1.0"
      },
      headers: {
        'Authorization': process.env.WORDWARE_API_KEY,
        'Content-Type': 'application/json',
      },
      responseType: 'stream'
    });

    let buffer = '';
    
    // Process the stream
    response.data.on('data', chunk => {
      buffer += chunk.toString();
      
      // Process any complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep the last incomplete line in the buffer
      
      for (const line of lines) {
        if (!line) continue;
        
        try {
          const parsed = JSON.parse(line);
          if (parsed.type === 'chunk') {
            let content = '';
            if (parsed.value.type === 'tool' && parsed.value.output) {
              content = parsed.value.output;
            } else if (parsed.value.type === 'chunk' && parsed.value.value) {
              content = parsed.value.value;
            }
            if (content && onChunk) {
              onChunk(content);
            }
          }
        } catch (e) {
          // If it's not JSON, send it directly
          if (onChunk) {
            onChunk(line);
          }
        }
      }
    });

    // Return a promise that resolves when the stream ends
    return new Promise((resolve, reject) => {
      let finalContent = '';
      
      response.data.on('data', chunk => {
        finalContent += chunk.toString();
      });

      response.data.on('end', () => {
        resolve({ content: finalContent.trim() });
      });

      response.data.on('error', error => {
        reject(error);
      });
    });
  } catch (error) {
    if (error.response) {
      throw new Error(`API request failed: ${error.response.data.message || error.response.statusText}`);
    }
    throw error;
  }
};

const performCaseLawResearch = async (query, jurisdiction, timeFrame, sources, includeKeywords, excludeKeywords, onChunk) => {
  if (!process.env.WORDWARE_API_KEY) {
    throw new Error('WORDWARE_API_KEY is not configured');
  }

  try {
    const response = await axios({
      method: 'post',
      url: 'https://app.wordware.ai/api/released-app/2b146324-34f7-496a-9968-8dd3dd3c8fe2/run',
      data: {
        inputs: {
          Query: query,
          Jurisdiction: jurisdiction,
          "Time Frame": timeFrame,
          Sources: sources,
          "Keywords to include": includeKeywords || query,
          "Keywords to exclude": excludeKeywords
        },
        version: "^1.0"
      },
      headers: {
        'Authorization': process.env.WORDWARE_API_KEY,
        'Content-Type': 'application/json',
      },
      responseType: 'stream'
    });

    let buffer = '';
    let caseLawResults = [];

    // Process the stream
    response.data.on('data', chunk => {
      buffer += chunk.toString();
      
      // Process any complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep the last incomplete line in the buffer
      
      for (const line of lines) {
        if (!line) continue;
        
        try {
          const parsed = JSON.parse(line);
          if (parsed.type === 'chunk' && parsed.value.type === 'tool' && parsed.value.output) {
            // Extract case information from the tool output
            const matches = parsed.value.output.match(/## \[(.*?)\]\((.*?)\)\n#### Published at (.*?)\n\n#### From: \[source\]\((.*?)\)\n\n#### Excerpts: \n\n([\s\S]*?)(?=\n\n##|$)/g);

            if (matches) {
              matches.forEach(match => {
                const [_, title, url, publishedAt, source, excerpts] = match.match(/## \[(.*?)\]\((.*?)\)\n#### Published at (.*?)\n\n#### From: \[source\]\((.*?)\)\n\n#### Excerpts: \n\n([\s\S]*?)(?=\n\n##|$)/);

                const result = {
                  title,
                  url,
                  publishedAt,
                  source,
                  excerpts: excerpts.trim()
                };
                
                caseLawResults.push(result);
                if (onChunk) {
                  onChunk({ results: [result] });
                }
              });
            }
          }
        } catch (e) {
          console.error('Error parsing chunk:', e);
        }
      }
    });

    // Return a promise that resolves when the stream ends
    return new Promise((resolve, reject) => {
      response.data.on('end', () => {
        resolve({ results: caseLawResults });
      });

      response.data.on('error', error => {
        reject(error);
      });
    });
  } catch (error) {
    if (error.response) {
      throw new Error(`API request failed: ${error.response.data.message || error.response.statusText}`);
    }
    throw error;
  }
};

const reviewLegalDocument = async (file, party) => {
  console.log('Checking Wordware API key...');
  const apiKey = process.env.WORDWARE_API_KEY;
  if (!apiKey) {
    console.error('WORDWARE_API_KEY is not configured');
    throw new Error('WORDWARE_API_KEY is not configured');
  }
  if (!apiKey.startsWith('ww-')) {
    console.error('Invalid Wordware API key format - should start with ww-');
    throw new Error('Invalid Wordware API key format');
  }
  console.log('Wordware API key is configured');

  try {
    console.log('Starting document review process for:', file.originalname);
    console.log('Testing Wordware API connection...');
    
    // Test the API connection first
    try {
      await axios.get('https://app.wordware.ai/api/apps', {
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json'
        }
      });
      console.log('Wordware API connection successful');
    } catch (error) {
      console.error('Wordware API connection failed:', error.response?.status, error.response?.statusText);
      console.error('Error details:', error.response?.data);
      console.error('API Key used:', apiKey);
      console.error('Full error:', error);
      throw new Error(`Failed to connect to Wordware API: ${error.response?.data?.message || error.message}`);
    }
    
    // Create form data for file upload
    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype
    });

    console.log('Uploading file to Wordware...');
    
    // Upload file to Vercel Blob Storage through Wordware
    const uploadResponse = await axios.post('https://app.wordware.ai/api/upload', formData, {
      headers: {
        'Authorization': process.env.WORDWARE_API_KEY,
        ...formData.getHeaders()
      }
    });

    console.log('File uploaded successfully, URL:', uploadResponse.data.url);

    console.log('Sending document review request...');
    
    // Send the document review request with the file URL
    const response = await axios({
      method: 'post',
      url: 'https://app.wordware.ai/api/released-app/c83ed60f-a5fb-4c9b-a6e6-23cf0d15a41e/run',
      data: {
        inputs: {
          documentParser: {
            file: {
              type: "file",
              file_url: uploadResponse.data.url,
              file_type: file.mimetype,
              file_name: file.originalname
            },
            includePagesAsImages: false,
            fileLanguages: "en",
            model: "llama-cloud"
          },
          party: party
        },
        version: "^1.0"
      },
      headers: {
        'Authorization': process.env.WORDWARE_API_KEY,
        'Content-Type': 'application/json'
      },
      responseType: 'stream'
    });

    console.log('Document review response received, processing stream...');
    
    return new Promise((resolve, reject) => {
      let buffer = '';
      let result = null;
      
      response.data.on('data', chunk => {
        buffer += chunk.toString();
        
        // Process any complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep the last incomplete line in the buffer
        
        for (const line of lines) {
          if (!line) continue;
          
          try {
            const parsed = JSON.parse(line);
            if (parsed.type === 'chunk' && parsed.value.type === 'tool' && parsed.value.output) {
              result = parsed.value.output;
            }
          } catch (e) {
            console.error('Error parsing line:', e);
            console.log('Problematic line:', line);
          }
        }
      });

      response.data.on('end', () => {
        // Process any remaining data in buffer
        if (buffer) {
          try {
            const parsed = JSON.parse(buffer);
            if (parsed.type === 'chunk' && parsed.value.type === 'tool' && parsed.value.output) {
              result = parsed.value.output;
            }
          } catch (e) {
            console.error('Error parsing final buffer:', e);
            console.log('Final buffer content:', buffer);
          }
        }
        
        if (!result) {
          reject(new Error('No valid result found in response stream'));
        } else {
          resolve(result);
        }
      });

      response.data.on('error', error => {
        reject(error);
      });
    });
  } catch (error) {
    if (error.response) {
      throw new Error(`API request failed: ${error.response.data.message || error.response.statusText}`);
    }
    throw error;
  }
};

module.exports = {
  performCaseLawResearch,
  generateLegalDocument,
  reviewLegalDocument
};
