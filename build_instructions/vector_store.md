# Vector Store API Documentation

## Create Vector Store
### Endpoint
```
POST https://api.openai.com/v1/vector_stores
```

### Description
Create a vector store to manage and search through file collections.

### Request Parameters

#### Required Parameters
- **file_ids** (array)
  - Description: A list of File IDs that the vector store should use
  - Used by: Tools like file_search for file access
  - Maximum: 10000 files per vector store

#### Optional Parameters
- **name** (string)
  - Description: The name of the vector store
  - Maximum Length: 256 characters

- **description** (string)
  - Description: A description of the vector store
  - Maximum Length: 512 characters

- **expiration_policy** (object)
  - Description: The expiration policy for a vector store
  - Properties:
    - **type** (string, required)
      - Value: "never_expire" or "time_based"
    - **time_based** (object, required if type is "time_based")
      - Properties:
        - **ttl_seconds** (integer, required)
          - Description: Time to live in seconds

### Example Request
```javascript
const vectorStore = await openai.beta.vectorStores.create({
  file_ids: ["file-abc123"]
});
console.log(vectorStore);
```

### Example Response
```json
{
  "id": "vs-abc123",
  "object": "vector_store",
  "created_at": 1699061420,
  "description": null,
  "name": null,
  "file_ids": ["file-abc123"]
}
```

## List Vector Stores
### Endpoint
```
GET https://api.openai.com/v1/vector_stores
```

### Description
Returns a list of vector stores.

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
const vectorStores = await openai.beta.vectorStores.list();
console.log(vectorStores);
```

### Example Response
```json
{
  "object": "list",
  "data": [
    {
      "id": "vs-abc123",
      "object": "vector_store",
      "created_at": 1699061420,
      "description": null,
      "name": null,
      "file_ids": ["file-abc123"]
    },
    {
      "id": "vs-def456",
      "object": "vector_store",
      "created_at": 1699061421,
      "description": null,
      "name": null,
      "file_ids": ["file-def456"]
    }
  ],
  "has_more": false
}
```

## Retrieve Vector Store
### Endpoint
```
GET https://api.openai.com/v1/vector_stores/{vector_store_id}
```

### Description
Retrieves a specific vector store by ID.

### Path Parameters
- **vector_store_id** (string, required)
  - Description: The ID of the vector store to retrieve

### Example Request
```javascript
const vectorStore = await openai.beta.vectorStores.retrieve(
  "vs-abc123"
);
console.log(vectorStore);
```

### Example Response
```json
{
  "id": "vs-abc123",
  "object": "vector_store",
  "created_at": 1699061420,
  "description": null,
  "name": null,
  "file_ids": ["file-abc123"]
}