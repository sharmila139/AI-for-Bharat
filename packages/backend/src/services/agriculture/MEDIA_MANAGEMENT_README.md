# Multi-Format Content Delivery System

## Overview

The Media Management Service provides comprehensive multi-format content delivery for the RuralConnect AI knowledge base. It supports images, videos, and audio files with optimization, adaptive quality selection, and efficient delivery for low-bandwidth environments.

## Features

### 1. Multi-Format Support
- **Images**: JPEG, PNG, WebP, GIF
- **Videos**: MP4, WebM, QuickTime
- **Audio**: MP3, WAV, OGG, MP4

### 2. Media Optimization

#### Image Optimization
- Automatic compression to target size (default: 500KB)
- Progressive JPEG encoding for faster loading
- Automatic resizing (max width: 1920px)
- Quality adjustment based on file size

#### Video Optimization
- Multiple quality variants (360p, 480p, 720p)
- Automatic thumbnail generation
- Adaptive bitrate streaming support
- Bandwidth-aware quality selection

#### Audio Optimization
- Format conversion support
- Compression for reduced file size
- Streaming support for large files

### 3. Adaptive Delivery

The system provides bandwidth-aware content delivery:

- **Low Bandwidth** (2G/3G): 360p video, compressed images
- **Medium Bandwidth** (3G/4G): 480p video, standard images
- **High Bandwidth** (4G/WiFi): 720p video, high-quality images

### 4. CDN Integration

- S3 storage with CloudFront CDN
- Global content delivery
- Automatic caching (1-year cache control)
- Signed URLs for secure access

### 5. Multi-Language Support

All media items support multi-language metadata:
- Captions in 15+ Indian languages
- Alt text for accessibility
- Localized descriptions

## API Endpoints

### Upload Media

```http
POST /api/knowledge-base/articles/:id/media
Content-Type: multipart/form-data

file: <binary>
caption: {"en": "Caption", "hi": "शीर्षक"}
altText: {"en": "Alt text", "hi": "वैकल्पिक पाठ"}
```

**Response:**
```json
{
  "media_id": "uuid",
  "article_id": "uuid",
  "media_type": "image",
  "file_url": "https://cdn.example.com/...",
  "file_size": 450000,
  "mime_type": "image/jpeg",
  "caption": {"en": "Caption", "hi": "शीर्षक"},
  "alt_text": {"en": "Alt text", "hi": "वैकल्पिक पाठ"},
  "thumbnail_url": null,
  "processing_status": "completed",
  "uploaded_at": "2024-01-15T10:30:00Z"
}
```

### Get Article Media

```http
GET /api/knowledge-base/articles/:id/media
```

**Response:**
```json
{
  "images": [
    {
      "url": "https://cdn.example.com/image1.jpg",
      "caption": {"en": "Image 1", "hi": "छवि 1"},
      "alt_text": {"en": "Alt 1", "hi": "वैकल्पिक 1"}
    }
  ],
  "videos": [
    {
      "url": "https://cdn.example.com/video1.mp4",
      "caption": {"en": "Video 1", "hi": "वीडियो 1"},
      "thumbnail_url": "https://cdn.example.com/thumb1.jpg",
      "duration": 120
    }
  ],
  "audio": [
    {
      "url": "https://cdn.example.com/audio1.mp3",
      "caption": {"en": "Audio 1", "hi": "ऑडियो 1"},
      "duration": 180
    }
  ]
}
```

### Update Media Metadata

```http
PUT /api/knowledge-base/media/:id
Content-Type: application/json

{
  "caption": {"en": "Updated caption", "hi": "अद्यतन शीर्षक"},
  "altText": {"en": "Updated alt", "hi": "अद्यतन वैकल्पिक"},
  "duration": 240
}
```

### Delete Media

```http
DELETE /api/knowledge-base/media/:id
```

**Response:**
```json
{
  "message": "Media deleted successfully"
}
```

### Get Adaptive Media URL

```http
GET /api/knowledge-base/media/:id/adaptive?bandwidth=low|medium|high
```

**Response:**
```json
{
  "url": "https://cdn.example.com/video-360p.mp4"
}
```

### Get Signed URL

```http
GET /api/knowledge-base/media/:id/signed-url?expiresIn=3600
```

**Response:**
```json
{
  "url": "https://cdn.example.com/video.mp4?signature=...",
  "expiresIn": 3600
}
```

### Get Video Qualities

```http
GET /api/knowledge-base/media/:id/qualities
```

**Response:**
```json
{
  "qualities": [
    {
      "quality": "360p",
      "url": "https://cdn.example.com/video-360p.mp4",
      "bitrate": "500kbps"
    },
    {
      "quality": "480p",
      "url": "https://cdn.example.com/video-480p.mp4",
      "bitrate": "1000kbps"
    },
    {
      "quality": "720p",
      "url": "https://cdn.example.com/video-720p.mp4",
      "bitrate": "2500kbps"
    }
  ]
}
```

## Usage Examples

### Frontend Integration

#### Upload Image with Multi-Language Caption

```typescript
const formData = new FormData();
formData.append('file', imageFile);
formData.append('caption', JSON.stringify({
  en: 'Organic pest control method',
  hi: 'जैविक कीट नियंत्रण विधि',
  ta: 'இயற்கை பூச்சி கட்டுப்பாடு முறை'
}));
formData.append('altText', JSON.stringify({
  en: 'Farmer applying neem spray',
  hi: 'किसान नीम का छिड़काव कर रहा है',
  ta: 'விவசாயி வேப்பம் தெளிக்கிறார்'
}));

const response = await fetch('/api/knowledge-base/articles/article-123/media', {
  method: 'POST',
  body: formData,
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const media = await response.json();
console.log('Uploaded:', media.file_url);
```

#### Display Article Media

```typescript
const response = await fetch('/api/knowledge-base/articles/article-123/media');
const media = await response.json();

// Display images
media.images.forEach(image => {
  const img = document.createElement('img');
  img.src = image.url;
  img.alt = image.alt_text[userLanguage] || image.alt_text.en;
  img.title = image.caption[userLanguage] || image.caption.en;
  container.appendChild(img);
});

// Display videos with adaptive quality
media.videos.forEach(async video => {
  const bandwidth = detectBandwidth(); // 'low', 'medium', 'high'
  const adaptiveResponse = await fetch(
    `/api/knowledge-base/media/${video.media_id}/adaptive?bandwidth=${bandwidth}`
  );
  const { url } = await adaptiveResponse.json();
  
  const videoElement = document.createElement('video');
  videoElement.src = url;
  videoElement.poster = video.thumbnail_url;
  videoElement.controls = true;
  container.appendChild(videoElement);
});
```

#### Offline Download Support

```typescript
// Download media for offline access
async function downloadForOffline(articleId: string) {
  const response = await fetch(`/api/knowledge-base/articles/${articleId}/media`);
  const media = await response.json();
  
  // Download images
  for (const image of media.images) {
    const blob = await fetch(image.url).then(r => r.blob());
    await saveToLocalStorage(`media-${articleId}-${image.url}`, blob);
  }
  
  // Download low-quality videos for offline
  for (const video of media.videos) {
    const adaptiveResponse = await fetch(
      `/api/knowledge-base/media/${video.media_id}/adaptive?bandwidth=low`
    );
    const { url } = await adaptiveResponse.json();
    const blob = await fetch(url).then(r => r.blob());
    await saveToLocalStorage(`media-${articleId}-${video.url}`, blob);
  }
}
```

## Database Schema

### article_media Table

```sql
CREATE TABLE article_media (
    media_id UUID PRIMARY KEY,
    article_id UUID REFERENCES knowledge_articles(article_id),
    media_type VARCHAR(20) CHECK (media_type IN ('image', 'video', 'audio', 'document')),
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    caption JSONB,
    alt_text JSONB,
    duration INTEGER,
    thumbnail_url TEXT,
    processing_status VARCHAR(20) CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### knowledge_articles.media Field

The `knowledge_articles` table also has a `media` JSONB field for quick access:

```json
{
  "images": [
    {
      "url": "https://cdn.example.com/image1.jpg",
      "caption": {"en": "Caption", "hi": "शीर्षक"},
      "alt_text": {"en": "Alt", "hi": "वैकल्पिक"}
    }
  ],
  "videos": [...],
  "audio": [...]
}
```

## Performance Considerations

### Image Optimization

- Target size: 500KB (configurable)
- Progressive JPEG for faster perceived loading
- Automatic resizing to max 1920px width
- Quality adjustment: 90% → 20% until target size reached

### Video Streaming

- Multiple quality variants for adaptive streaming
- Thumbnail generation for preview
- Chunked transfer for large files
- CDN caching for global delivery

### Bandwidth Detection

The frontend should detect user bandwidth and request appropriate quality:

```typescript
function detectBandwidth(): 'low' | 'medium' | 'high' {
  const connection = (navigator as any).connection;
  if (!connection) return 'medium';
  
  const effectiveType = connection.effectiveType;
  if (effectiveType === '2g' || effectiveType === 'slow-2g') return 'low';
  if (effectiveType === '3g') return 'medium';
  return 'high';
}
```

## Security

### File Upload Validation

- File type validation (MIME type checking)
- File size limits (50MB max)
- Virus scanning (recommended for production)
- User authentication required

### Access Control

- Signed URLs for temporary access
- Configurable expiry times
- CDN authentication support
- Rate limiting on uploads

## Error Handling

### Upload Errors

```typescript
try {
  const media = await mediaService.uploadMedia(articleId, input);
} catch (error) {
  if (error.message === 'File too large') {
    // Handle file size error
  } else if (error.message === 'Invalid file type') {
    // Handle file type error
  } else {
    // Handle general upload error
  }
}
```

### Fallback Strategies

1. **Image Load Failure**: Show placeholder image
2. **Video Load Failure**: Fall back to lower quality or show thumbnail
3. **Audio Load Failure**: Show download link
4. **Offline Mode**: Use cached media from local storage

## Testing

### Unit Tests

Run the test suite:

```bash
npm test -- media-management.test.ts
```

### Integration Tests

Test the complete upload-retrieve-delete flow:

```bash
npm test -- media-integration.test.ts
```

### Load Testing

Test media delivery under load:

```bash
artillery run media-load-test.yml
```

## Monitoring

### Metrics to Track

- Upload success rate
- Average upload time
- Media delivery latency
- CDN cache hit rate
- Bandwidth usage by quality
- Storage usage

### Alerts

- Upload failure rate > 5%
- CDN cache hit rate < 80%
- Storage usage > 80% capacity
- Average delivery latency > 2s

## Future Enhancements

1. **Video Transcoding**: Automatic transcoding to multiple formats
2. **Image Formats**: WebP and AVIF support for better compression
3. **Progressive Loading**: Blur-up technique for images
4. **Lazy Loading**: Load media only when visible
5. **Offline Sync**: Automatic sync of media when online
6. **Media Analytics**: Track view counts, play rates, completion rates
7. **AI-Generated Captions**: Automatic caption generation for videos
8. **Image Recognition**: Auto-tagging and categorization

## Support

For issues or questions:
- GitHub Issues: https://github.com/ruralconnect/ai/issues
- Documentation: https://docs.ruralconnect.ai/media
- Email: support@ruralconnect.ai
