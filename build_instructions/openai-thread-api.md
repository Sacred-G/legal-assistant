# Create Thread API Documentation

**Endpoint**: POST https://api.openai.com/v1/threads

## Overview
Creates a new thread for message interactions. Threads can contain messages, files, and tool configurations.

## Request Body Parameters

### messages (Optional)
Array of message objects to initialize the thread with. Each message contains:

- `role` (Required)
  - Values: "user" or "assistant"
  - "user": For user-generated messages
  - "assistant": For assistant-generated messages

- `content` (Required)
  Can be either:
  1. A string containing text content
  2. An array of content parts, each with:
     - Text content
     - Images (only for Vision-compatible models)
       - Can be provided via `image_url` or `image_file`

### attachments (Optional)
List of file attachments for the message:
- `file_id`: ID of the file to attach
- `tools`: Array of tools to associate with the file

### tool_resources (Optional)
Resources available to assistant's tools in the thread:

1. **Code Interpreter Tool**
   - `code_interpreter`
     - `file_ids`: Array of file IDs (max 20 files)

2. **File Search Tool**
   - `file_search`
     - `vector_store_ids`: Array of vector store IDs (max 1)
     - `vector_stores`: Configuration for creating vector stores
       - `file_ids`: Array of file IDs (max 10000)
       - `chunking_strategy`: File chunking configuration
       - `metadata`: Key-value pairs for vector store

### metadata (Optional)
- Maximum 16 key-value pairs
- Key length: ≤ 64 characters
- Value length: ≤ 512 characters

## Response
Returns a thread object containing the created thread's information.

## Content Types

### Text Content Part
```json
{
    "type": "text",
    "text": "Your text content here"
}
```

### Image Content Part
Can be specified using either:
- `image_url`: Reference to image URL
- `image_file`: Reference to uploaded image file

## Tool Types

### Code Interpreter
```json
{
    "type": "code_interpreter"
}
```

### File Search
```json
{
    "type": "file_search"
}
```