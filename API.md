# RAG System API Documentation

This document describes the REST API endpoints provided by the RAG system's Express server.

## Base URL

```
http://localhost:3000
```

## Endpoints

### Health Check

#### GET /health

Check if the server is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-05T09:11:23.142Z"
}
```

**Status Codes:**
- `200 OK` - Server is healthy

---

### Collections

#### GET /api/collections

List all available collections with metadata.

**Response:**
```json
[
  {
    "name": "default",
    "embeddings": 1952,
    "chunks": 1952,
    "size": 15234567,
    "lastModified": "2026-05-05T10:30:00.000Z"
  },
  {
    "name": "project-a",
    "embeddings": 450,
    "chunks": 450,
    "size": 3456789,
    "lastModified": "2026-05-04T15:20:00.000Z"
  }
]
```

**Response Fields:**
- `name` - Collection identifier
- `embeddings` - Number of embedding vectors stored
- `chunks` - Number of text chunks
- `size` - Total size in bytes of embeddings file
- `lastModified` - ISO 8601 timestamp of last modification

**Status Codes:**
- `200 OK` - Collections retrieved successfully
- `500 Internal Server Error` - Server error

---

#### DELETE /api/collections/:name

Delete a collection and all its data.

**Parameters:**
- `name` (path) - Collection name to delete

**Response:**
```json
{
  "message": "Collection 'project-a' deleted successfully"
}
```

**Status Codes:**
- `200 OK` - Collection deleted successfully
- `400 Bad Request` - Invalid collection name
- `404 Not Found` - Collection does not exist
- `500 Internal Server Error` - Server error

---

### Document Upload

#### POST /api/collections/:name/upload

Upload PDF documents to a collection.

**Parameters:**
- `name` (path) - Collection name
- `files` (form-data) - One or more PDF files (max 50MB each)

**Request:**
```
Content-Type: multipart/form-data

files=@document1.pdf
files=@document2.pdf
```

**Response:**
```json
{
  "count": 2,
  "files": [
    {
      "filename": "1714905600000-document1.pdf",
      "originalName": "document1.pdf",
      "size": 1234567
    },
    {
      "filename": "1714905600001-document2.pdf",
      "originalName": "document2.pdf",
      "size": 987654
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Files uploaded successfully
- `400 Bad Request` - No files provided or invalid file type
- `413 Payload Too Large` - File exceeds 50MB limit
- `500 Internal Server Error` - Upload failed

**Notes:**
- Only PDF files are accepted
- Files are prefixed with timestamp to avoid conflicts
- Uploaded files are stored in `documents/temp-uploads/{collection}/`

---

### Indexing

#### POST /api/collections/:name/index

Index uploaded documents and generate embeddings. Uses Server-Sent Events for progress streaming.

**Parameters:**
- `name` (path) - Collection name

**Response:** Server-Sent Events stream

**Event Types:**

**Start Event:**
```
data: {"type":"start","message":"Starting document indexing..."}
```

**Info Event:**
```
data: {"type":"info","message":"Found 8 documents"}
```

**Progress Event:**
```
data: {"type":"progress","current":50,"total":1952,"percentage":3,"message":"Processing chunk 50/1952"}
```

**Complete Event:**
```
data: {"type":"complete","message":"Indexing complete! Generated 1952 embeddings"}
```

**Error Event:**
```
data: {"type":"error","message":"Failed to read document: error details"}
```

**Status Codes:**
- `200 OK` - SSE stream started (even if indexing fails, check events for errors)
- `500 Internal Server Error` - Failed to start indexing

**Notes:**
- Keep the connection open to receive progress updates
- Client should parse SSE format: `data: {json}\n\n`
- Connection closes automatically when indexing completes or fails

---

### Query

#### POST /api/collections/:name/query

Query a collection with a question and get an AI-generated answer.

**Parameters:**
- `name` (path) - Collection name

**Request:**
```json
{
  "question": "What is the main topic of the documents?",
  "topK": 5,
  "temperature": 0.8
}
```

**Request Fields:**
- `question` (required) - The question to ask
- `topK` (optional) - Number of chunks to retrieve (1-20, default from settings)
- `temperature` (optional) - LLM creativity (0.0-1.0, default from settings)

**Response:**
```json
{
  "answer": "The documents primarily discuss fairy tales collected by the Brothers Grimm, including stories like Cinderella, Hansel and Gretel, and Sleeping Beauty. These stories explore themes of family, magic, and moral lessons through traditional folklore."
}
```

**Status Codes:**
- `200 OK` - Answer generated successfully
- `400 Bad Request` - Missing question or invalid parameters
- `404 Not Found` - Collection not found or no embeddings
- `500 Internal Server Error` - Query failed

**Notes:**
- Requires embeddings to exist for the collection
- Uses cosine similarity to find relevant chunks
- Combines top-K chunks with the question to build LLM prompt

---

### Settings

#### GET /api/settings

Retrieve current system configuration.

**Response:**
```json
{
  "chunkSize": 500,
  "chunkOverlap": 50,
  "topK": 3,
  "temperature": 0.7,
  "maxTokens": 2048
}
```

**Response Fields:**
- `chunkSize` - Characters per text chunk (100-2000)
- `chunkOverlap` - Overlapping characters between chunks (0 to chunkSize)
- `topK` - Number of chunks to retrieve during query (1-20)
- `temperature` - LLM creativity parameter (0.0-1.0)
- `maxTokens` - Maximum response length (100-8192)

**Status Codes:**
- `200 OK` - Settings retrieved successfully
- `500 Internal Server Error` - Failed to load settings

---

#### PUT /api/settings

Update system configuration.

**Request:**
```json
{
  "chunkSize": 800,
  "chunkOverlap": 100,
  "topK": 5,
  "temperature": 0.8,
  "maxTokens": 3000
}
```

**Request Fields:** (all optional, only include fields to update)
- `chunkSize` - Characters per text chunk (100-2000, integer)
- `chunkOverlap` - Overlapping characters (0 to chunkSize, integer)
- `topK` - Number of chunks to retrieve (1-20, integer)
- `temperature` - LLM creativity (0.0-1.0, float)
- `maxTokens` - Maximum response length (100-8192, integer)

**Response:**
```json
{
  "chunkSize": 800,
  "chunkOverlap": 100,
  "topK": 5,
  "temperature": 0.8,
  "maxTokens": 3000
}
```

**Status Codes:**
- `200 OK` - Settings updated successfully
- `400 Bad Request` - Validation error (invalid value or out of range)
- `500 Internal Server Error` - Failed to save settings

**Validation Rules:**
- `chunkSize`: Must be integer between 100 and 2000
- `chunkOverlap`: Must be integer, 0 ≤ overlap < chunkSize
- `topK`: Must be integer between 1 and 20
- `temperature`: Must be float between 0.0 and 1.0
- `maxTokens`: Must be integer between 100 and 8192

**Error Response:**
```json
{
  "error": "chunkSize: Chunk size must be between 100 and 2000; chunkOverlap: Chunk overlap must be less than chunk size (currently 800)",
  "details": [
    {
      "field": "chunkSize",
      "message": "Chunk size must be between 100 and 2000",
      "value": 5000
    },
    {
      "field": "chunkOverlap",
      "message": "Chunk overlap must be less than chunk size (currently 800)",
      "value": 850
    }
  ]
}
```

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "error": "Error message describing what went wrong"
}
```

In development mode, errors may include stack traces:

```json
{
  "error": "Error message",
  "stack": "Error: ...\n    at ..."
}
```

## CORS

CORS is enabled for all origins in development mode. For production deployment, configure specific allowed origins in `src/server/middleware/cors.ts`.

## File Upload Limits

- Maximum file size: 50MB per file
- Accepted file types: PDF only (`.pdf` extension, `application/pdf` MIME type)
- Multiple files: Supported via form-data

## Server-Sent Events (SSE)

The indexing endpoint uses SSE for real-time progress updates. SSE connection details:

- **Content-Type**: `text/event-stream`
- **Format**: `data: {JSON}\n\n`
- **Connection**: Stays open until completion or error
- **Buffering**: Disabled via headers for immediate updates

**Example SSE Stream:**
```
data: {"type":"start","message":"Starting indexing..."}

data: {"type":"progress","current":50,"total":1952,"percentage":3,"message":"Processing chunk 50/1952"}

data: {"type":"progress","current":100,"total":1952,"percentage":5,"message":"Processing chunk 100/1952"}

data: {"type":"complete","message":"Indexing complete! Generated 1952 embeddings"}
```
