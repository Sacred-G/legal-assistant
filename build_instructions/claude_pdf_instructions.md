Build with Claude
PDF support (beta)
The Claude 3.5 Sonnet models now support PDF input and understand both text and visual content within documents.

PDF support is in public beta

To access this feature, include the anthropic-beta: pdfs-2024-09-25 header in your API requests.

We’ll be iterating on this open beta over the coming weeks, so we appreciate your feedback. Please share your ideas and suggestions using this form.

​
PDF Capabilities
Claude works with any standard PDF. You can ask Claude about any text, pictures, charts, and tables in the PDFs you provide. Some sample use cases:

Analyzing financial reports and understanding charts/tables
Extracting key information from legal documents
Translation assistance for documents
Converting document information into structured formats
​
How PDF support works
When you send a request that includes a PDF file:

1
The system extracts the contents of the document.

The system converts each page of the document into an image.
The text from each page is extracted and provided alongside the page’s image.
2
Claude analyzes both the text and images to better understand the document.

Documents are provided as a combination of text and images for analysis.
This allows users to ask for insights on visual elements of a PDF, such as charts, diagrams, and other non-textual content.
3
Use documents alongside other Claude features.

PDF support works well alongside:

Prompt caching: To improve performance for repeated analysis.
Batch processing: For high-volume document processing.
Tool use: To extract specific information from documents for use as tool inputs.
​
PDF support limitations
Before integrating PDF support into your application, ensure your files meet these requirements:

Requirement	Limit
Maximum request size	32MB
Maximum pages per request	100
Supported models	claude-3-5-sonnet-20241022, claude-3-5-sonnet-20240620
Please note that both limits are on the entire request payload, including any other content sent alongside PDFs. The provided PDFs should not have any passwords or encryption.

Since PDF support relies on Claude’s vision capabilities, it is subject to the same limitations.

​
Supported platforms and models
PDF support is currently available on both Claude 3.5 Sonnet models (claude-3-5-sonnet-20241022, claude-3-5-sonnet-20240620) via direct API access. This functionality will be supported on Amazon Bedrock and Google Vertex AI soon

​
Calculate expected token usage
The token count of a PDF file depends on the total text extracted from the document as well as the number of pages. Since each page is converted into an image, the same image-based cost calculations are applied. Each page typically uses 1,500 to 3,000 tokens, depending on content density. Standard input token pricing applies, with no additional fees for PDF processing.

You can also use token counting to determine the number of tokens in a message containing PDFs.

​
How to use PDFs in the Messages API
Here’s a simple example demonstrating how to use PDFs in the Messages API:


Shell

Python

TypeScript

import Anthropic from '@anthropic-ai/sdk';
import fetch from 'node-fetch';

// First fetch the file
const pdfURL = "https://assets.anthropic.com/m/1cd9d098ac3e6467/original/Claude-3-Model-Card-October-Addendum.pdf";

const pdfResponse = await fetch(pdfURL);

// Then convert the file to base64
const arrayBuffer = await pdfResponse.arrayBuffer();
const pdfBase64 = Buffer.from(arrayBuffer).toString('base64');

// Finally send the API request
const anthropic = new Anthropic();
const response = await anthropic.beta.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  betas: ["pdfs-2024-09-25"],
  max_tokens: 1024,
  messages: [
    {
      content: [
        {
          type: 'document',
          source: {
            media_type: 'application/pdf',
            type: 'base64',
            data: pdfBase64,
          },
        },
        {
          type: 'text',
          text: 'Which model has the highest human preference win rates across each use-case?',
        },
      ],
      role: 'user',
    },
  ],
});
console.log(response);
Here are a few other examples to help you get started:


PDF support with prompt caching

Combine PDF support with prompt caching to improve performance for repeated analysis:


Shell

Python

TypeScript

const response = await anthropic.beta.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  betas: ['pdfs-2024-09-25', 'prompt-caching-2024-07-31'],
  max_tokens: 1024,
  messages: [
    {
      content: [
        {
          type: 'document',
          source: {
            media_type: 'application/pdf',
            type: 'base64',
            data: pdfBase64,
          },
          cache_control: { type: 'ephemeral' },
        },
        {
          type: 'text',
          text: 'Which model has the highest human preference win rates across each use-case?',
        },
      ],
      role: 'user',
    },
  ],
});
console.log(response);
This example demonstrates basic prompt caching usage, caching the full PDF document as a prefix while keeping the user instruction uncached.

The first request will process & cache the document, making followup queries faster and cheaper.


PDF support with the Message Batches API

For high-volume document processing, use the Message Batches API:


Shell

Python

TypeScript

const response = await anthropic.beta.messages.batches.create({
  betas: ['pdfs-2024-09-25', 'message-batches-2024-09-24'],
  requests: [
    {
      custom_id: 'my-first-request',
      params: {
        max_tokens: 1024,
        messages: [
          {
            content: [
              {
                type: 'document',
                source: {
                  media_type: 'application/pdf',
                  type: 'base64',
                  data: pdfBase64,
                },
              },
              {
                type: 'text',
                text: 'Which model has the highest human preference win rates across each use-case?',
              },
            ],
            role: 'user',
          },
        ],
        model: 'claude-3-5-sonnet-20241022',
      },
    },
    {
      custom_id: 'my-second-request',
      params: {
        max_tokens: 1024,
        messages: [
          {
            content: [
              {
                type: 'document',
                source: {
                  media_type: 'application/pdf',
                  type: 'base64',
                  data: pdfBase64,
                },
              },
              {
                type: 'text',
                text: 'Extract 5 key insights from this document.',
              },
            ],
            role: 'user',
          },
        ],
        model: 'claude-3-5-sonnet-20241022',
      },
    }
  ],
});
console.log(response);