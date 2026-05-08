# DMP 2026 API Gateway Documentation

## Overview

The API Gateway is the central entry point for all microservices in the LMS platform. It provides:
- Request routing to appropriate services
- Authentication and authorization
- Rate limiting and caching
- Async job management
- Error handling and logging

**Base URL:** `http://localhost:8000`
**API Version:** `v1`

---

## Authentication

### JWT Token

All requests (except health check) require a JWT token in the Authorization header:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8000/v1/endpoint
```

### Get Token

```http
POST /v1/auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400
}
```

---

## Core Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "services": {
    "ingestion": "healthy",
    "assessment": "healthy",
    "multimedia": "healthy",
    "database": "healthy",
    "cache": "healthy"
  },
  "timestamp": "2026-05-08T23:35:48Z"
}
```

---

## Module A: Ingestion Service

### 1. Upload Document

Process PDF or PPT files into structured JSON.

```http
POST /v1/ingestion/upload
Content-Type: multipart/form-data
Authorization: Bearer {token}

file=@document.pdf
title=Learning Module Title
```

**Parameters:**
- `file` (required): PDF or PPT file (max 50MB)
- `title` (optional): Document title
- `tenant_id` (optional): Tenant identifier

**Response:**
```json
{
  "job_id": "ingestion_job_abc123",
  "status": "processing",
  "filename": "document.pdf",
  "file_type": "pdf",
  "created_at": "2026-05-08T23:35:48Z",
  "estimated_completion": "2026-05-08T23:36:18Z"
}
```

### 2. Check Ingestion Status

```http
GET /v1/ingestion/jobs/{job_id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "job_id": "ingestion_job_abc123",
  "status": "completed",
  "progress": 100,
  "result": {
    "title": "Learning Module Title",
    "sections": [
      {
        "heading": "Section 1",
        "body": "Section content...",
        "page_numbers": [1, 2]
      }
    ],
    "key_takeaways": [
      "Takeaway 1",
      "Takeaway 2"
    ],
    "glossary": [
      {
        "term": "Key Term",
        "definition": "Definition of the term"
      }
    ],
    "narration_script": "Slide 1: Section 1. Content...",
    "metadata": {
      "total_pages": 10,
      "estimated_reading_time": 15,
      "language": "en"
    }
  },
  "created_at": "2026-05-08T23:35:48Z",
  "completed_at": "2026-05-08T23:36:15Z"
}
```

### 3. List Recent Ingestions

```http
GET /v1/ingestion/jobs?limit=10&offset=0
Authorization: Bearer {token}
```

**Response:**
```json
{
  "total": 42,
  "limit": 10,
  "offset": 0,
  "jobs": [
    {
      "job_id": "ingestion_job_abc123",
      "status": "completed",
      "filename": "document.pdf",
      "created_at": "2026-05-08T23:35:48Z"
    }
  ]
}
```

---

## Module B: Assessment Service

### 1. Generate Assessment

Generate MCQs, Fill-in-the-blanks, and Match-pairs from content.

```http
POST /v1/assessment/generate
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "Assessment Title",
  "source_text": "Raw content or extracted from ingestion job...",
  "ingestion_job_id": "ingestion_job_abc123",
  "options": {
    "mcq_count": 15,
    "fill_blank_count": 15,
    "match_pair_count": 10,
    "difficulty": "mixed"
  }
}
```

**Response:**
```json
{
  "job_id": "assessment_job_xyz789",
  "status": "processing",
  "title": "Assessment Title",
  "created_at": "2026-05-08T23:35:48Z"
}
```

### 2. Get Assessment Results

```http
GET /v1/assessment/jobs/{job_id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "job_id": "assessment_job_xyz789",
  "status": "completed",
  "title": "Assessment Title",
  "questions": {
    "mcqs": [
      {
        "id": "mcq_001",
        "prompt": "What does this concept refer to?",
        "options": [
          { "id": "opt_001", "text": "Option A", "correct": true },
          { "id": "opt_002", "text": "Option B", "correct": false },
          { "id": "opt_003", "text": "Option C", "correct": false },
          { "id": "opt_004", "text": "Option D", "correct": false }
        ],
        "answer": "opt_001",
        "explanation": "This is the explanation...",
        "difficulty": "medium"
      }
    ],
    "fill_in_the_blanks": [
      {
        "id": "fib_001",
        "prompt": "The process of _____ is important.",
        "answer": "optimization",
        "hint": "Starts with 'opt'...",
        "difficulty": "easy"
      }
    ],
    "match_pairs": [
      {
        "id": "match_001",
        "left": "Concept A",
        "right": "Definition of Concept A"
      }
    ]
  },
  "stats": {
    "total_questions": 40,
    "avg_difficulty": "medium",
    "generation_time": 125,
    "coverage": 0.95
  },
  "created_at": "2026-05-08T23:35:48Z",
  "completed_at": "2026-05-08T23:36:45Z"
}
```

### 3. Export Assessment

Export assessment to H5P or SCORM format.

```http
POST /v1/assessment/export
Content-Type: application/json
Authorization: Bearer {token}

{
  "job_id": "assessment_job_xyz789",
  "format": "h5p",
  "output_type": "question_set"
}
```

**Formats:**
- `h5p`: H5P Question Set (interactive)
- `scorm`: SCORM 1.2 package
- `json`: Raw JSON format

**Response:**
```json
{
  "export_id": "export_abc123",
  "format": "h5p",
  "download_url": "/v1/assessment/downloads/export_abc123.h5p",
  "file_size": 245632,
  "created_at": "2026-05-08T23:36:45Z",
  "expires_at": "2026-05-15T23:36:45Z"
}
```

---

## Module C: Multimedia Service (TODO)

### 1. Upload Video/Audio

```http
POST /v1/multimedia/upload
Content-Type: multipart/form-data
Authorization: Bearer {token}

file=@video.mp4
title=Lecture Title
enable_diarization=true
enable_chaptering=true
```

**Parameters:**
- `file` (required): Video/audio file
- `title` (optional): Content title
- `enable_diarization` (optional): Enable speaker identification
- `enable_chaptering` (optional): Auto-generate chapters

**Response:**
```json
{
  "job_id": "multimedia_job_def456",
  "status": "processing",
  "filename": "video.mp4",
  "duration_seconds": 3600,
  "created_at": "2026-05-08T23:35:48Z"
}
```

### 2. Get Transcription

```http
GET /v1/multimedia/jobs/{job_id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "job_id": "multimedia_job_def456",
  "status": "completed",
  "title": "Lecture Title",
  "transcription": {
    "text": "Full transcript...",
    "segments": [
      {
        "start": 0,
        "end": 30,
        "text": "First 30 seconds of audio...",
        "speaker": "Speaker 1"
      }
    ],
    "vtt": "WEBVTT\n\n00:00:00.000 --> 00:00:30.000\nSpeaker 1: First 30 seconds..."
  },
  "chapters": [
    {
      "title": "Chapter 1",
      "start": 0,
      "end": 600,
      "summary": "Chapter summary..."
    }
  ],
  "statistics": {
    "duration": 3600,
    "word_count": 8245,
    "speaker_count": 2,
    "accuracy": 0.97
  },
  "completed_at": "2026-05-08T23:45:00Z"
}
```

---

## Module D: Micro-Lesson Builder (TODO)

### 1. Create Micro-Lesson

```http
POST /v1/lessons/create
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "Lesson Title",
  "description": "Brief description",
  "ingestion_job_id": "ingestion_job_abc123",
  "assessment_job_id": "assessment_job_xyz789",
  "multimedia_job_id": "multimedia_job_def456",
  "output_format": "h5p",
  "branding": {
    "logo_url": "https://...",
    "primary_color": "#1976d2",
    "secondary_color": "#424242"
  }
}
```

**Response:**
```json
{
  "lesson_id": "lesson_ghi789",
  "status": "draft",
  "title": "Lesson Title",
  "created_at": "2026-05-08T23:35:48Z"
}
```

### 2. Submit for Review

```http
POST /v1/lessons/{lesson_id}/submit
Authorization: Bearer {token}

{
  "reviewer_notes": "Optional notes for reviewer"
}
```

**Response:**
```json
{
  "lesson_id": "lesson_ghi789",
  "status": "pending_review",
  "submitted_at": "2026-05-08T23:35:48Z",
  "assigned_reviewer": "reviewer@example.com"
}
```

### 3. Publish Lesson

```http
POST /v1/lessons/{lesson_id}/publish
Authorization: Bearer {token}

{
  "approval_notes": "Approved"
}
```

**Response:**
```json
{
  "lesson_id": "lesson_ghi789",
  "status": "published",
  "published_url": "https://lms.example.com/lessons/lesson_ghi789",
  "tracking_enabled": true,
  "published_at": "2026-05-08T23:35:48Z"
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Human-readable error message",
    "details": {
      "field": "error details"
    },
    "request_id": "req_abc123"
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Access denied |
| NOT_FOUND | 404 | Resource not found |
| INVALID_REQUEST | 400 | Invalid request parameters |
| FILE_TOO_LARGE | 413 | File exceeds size limit |
| SERVICE_ERROR | 500 | Internal server error |
| SERVICE_UNAVAILABLE | 503 | Service temporarily unavailable |

### Examples

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token",
    "request_id": "req_xyz789"
  }
}
```

---

## Rate Limiting

Rate limits are applied per user:
- **Default**: 100 requests per minute
- **Assessment**: 10 jobs per hour
- **Ingestion**: 5 files per hour

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1620000000
```

**When limited (429):**
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please retry after 60 seconds.",
    "retry_after": 60
  }
}
```

---

## Async Job Management

### Job States

```
pending → processing → completed/failed
```

### Polling for Results

```bash
# Check status
curl http://localhost:8000/v1/{service}/jobs/{job_id}

# Keep checking every 5 seconds until status changes
```

### Webhooks (Optional)

Register a webhook to be notified when jobs complete:

```http
POST /v1/webhooks
Authorization: Bearer {token}

{
  "url": "https://your-server.com/webhook",
  "events": ["assessment.completed", "ingestion.completed"]
}
```

---

## Pagination

Endpoints returning lists support pagination:

```http
GET /v1/resource?limit=20&offset=40
```

**Parameters:**
- `limit`: Items per page (default: 10, max: 100)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "total": 425,
  "limit": 20,
  "offset": 40,
  "items": [...]
}
```

---

## Filtering

Some endpoints support filtering:

```http
GET /v1/ingestion/jobs?status=completed&created_after=2026-05-01
```

---

## SDK

### Node.js/TypeScript

```typescript
import { LMSClient } from '@tekdi/lms-sdk';

const client = new LMSClient({
  baseUrl: 'http://localhost:8000',
  token: 'your-jwt-token'
});

// Upload document
const job = await client.ingestion.upload({
  file: fs.createReadStream('document.pdf'),
  title: 'My Document'
});

// Wait for completion
const result = await client.ingestion.waitForCompletion(job.job_id);
console.log(result);
```

### Python

```python
from tekdi_lms import LMSClient

client = LMSClient(
    base_url='http://localhost:8000',
    token='your-jwt-token'
)

# Upload and process
job = client.ingestion.upload(
    file=open('document.pdf', 'rb'),
    title='My Document'
)

# Generate assessment
assessment = client.assessment.generate(
    ingestion_job_id=job['job_id'],
    mcq_count=15
)
```

---

## Best Practices

1. **Always use HTTPS** in production
2. **Cache responses** where appropriate
3. **Implement exponential backoff** for retries
4. **Log request IDs** for debugging
5. **Monitor rate limits** and adjust accordingly
6. **Use connection pooling** for performance
7. **Validate responses** before using
8. **Handle timeouts** gracefully

---

## Support

- **Issues**: https://github.com/tekdi/shiksha-mfe/issues
- **Documentation**: https://github.com/tekdi/shiksha-mfe/docs
- **Email**: support@tekdi.io
