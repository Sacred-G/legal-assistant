# Vector Store Files API Documentation

## Overview
Vector store files represent files inside a vector store. These files can be used by tools like file_search for efficient file access and searching.

## Create Vector Store File
### Endpoint
```
POST https://api.openai.com/v1/vector_stores/{vector_store_id}/files
```

### Description
Create a vector store file by attaching a File to a vector store.

### Path Parameters
- **vector_store_id** (string, required)
  - Description: The ID of the vector store for which to create a File

### Request Parameters
#### Required Parameters
- **file_id** (string)
  - Description: A File ID that the vector store should use
  - Used by: Tools like file_search for file access

#### Optional Parameters
- **chunking_strategy** (object)
  - Description: The strategy used to chunk the file
  - Default: Auto strategy (800 tokens max chunk size, 400 tokens overlap)
  - Properties:
    - **type** (string, required): "auto" or "static"
    - For static type:
      - **max_chunk_size_tokens** (integer, required)
        - Range: 100-4096
        - Default: 800
      - **chunk_overlap_tokens** (integer, required)
        - Must not exceed half of max_chunk_size_tokens
        - Default: 400

### Example Request
```javascript
const myVectorStoreFile = await openai.beta.vectorStores.files.create(
  "vs_abc123",
  {
    file_id: "file-abc123"
  }
);
console.log(myVectorStoreFile);
```

### Example Response
```json
{
  "id": "vsfile_abc123",
  "object": "vector_store.file",
  "created_at": 1699061420,
  "vector_store_id": "vs_abcd",
  "file_id": "file-abc123"
}
```

## List Vector Store Files
### Endpoint
```
GET https://api.openai.com/v1/vector_stores/{vector_store_id}/files
```

### Description
Returns a list of files in a vector store.

### Path Parameters
- **vector_store_id** (string, required)
  - Description: The ID of the vector store to list files from

### Query Parameters
- **limit** (integer, optional)
  - Default: 20
  - Maximum: 100
- **order** (string, optional)
  - Default: "desc"
  - Values: "asc" or "desc"
- **after** (string, optional)
  - Cursor for pagination
- **before** (string, optional)
  - Cursor for pagination

### Example Request
```javascript
const vectorStoreFiles = await openai.beta.vectorStores.files.list(
  "vs_abc123"
);
console.log(vectorStoreFiles);
```

### Example Response
```json
{
  "object": "list",
  "data": [
    {
      "id": "vsfile_abc123",
      "object": "vector_store.file",
      "created_at": 1699061420,
      "vector_store_id": "vs_abc123",
      "file_id": "file-abc123"
    }
  ],
  "has_more": false
}
```

## Retrieve Vector Store File
### Endpoint
```
GET https://api.openai.com/v1/vector_stores/{vector_store_id}/files/{file_id}
```

### Description
Retrieves a vector store file.

### Path Parameters
- **vector_store_id** (string, required)
  - Description: The ID of the vector store that the file belongs to
- **file_id** (string, required)
  - Description: The ID of the file being retrieved

### Example Request
```javascript
const vectorStoreFile = await openai.beta.vectorStores.files.retrieve(
  "vs_abc123",
  "file-abc123"
);
console.log(vectorStoreFile);
```

### Example Response
```json
{
  "id": "vsfile_abc123",
  "object": "vector_store.file",
  "created_at": 1699061420,
  "vector_store_id": "vs_abcd",
  "file_id": "file-abc123"
}
```

## Delete Vector Store File
### Endpoint
```
DELETE https://api.openai.com/v1/vector_stores/{vector_store_id}/files/{file_id}
```

### Description
Delete a file from a vector store.

### Path Parameters
- **vector_store_id** (string, required)
  - Description: The ID of the vector store to delete from
- **file_id** (string, required)
  - Description: The ID of the file to delete

### Example Request
```javascript
await openai.beta.vectorStores.files.del(
  "vs_abc123",
  "file-abc123"
);
```

### Example Response
```json
{
  "id": "vsfile_abc123",
  "object": "vector_store.file.deleted",
  "deleted": true
}