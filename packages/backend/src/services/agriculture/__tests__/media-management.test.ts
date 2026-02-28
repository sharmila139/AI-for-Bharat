/**
 * Unit Tests for Media Management Service
 * Tests multi-format content delivery functionality
 */

import { MediaManagementService } from '../media-management.service';
import { MultiLanguageText } from '../knowledge-base-types';

// Mock pg Pool
const mockQuery = jest.fn();
const mockPool: any = {
  query: mockQuery,
};

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://signed-url.example.com'),
}));

// Mock sharp
jest.mock('sharp', () => {
  return jest.fn(() => ({
    metadata: jest.fn().mockResolvedValue({ width: 2000, height: 1500 }),
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('optimized-image')),
  }));
});

describe('MediaManagementService', () => {
  let service: MediaManagementService;

  beforeEach(() => {
    service = new MediaManagementService(mockPool);
    jest.clearAllMocks();
  });

  describe('uploadMedia', () => {
    it('should upload image with optimization', async () => {
      const articleId = 'article-123';
      const imageBuffer = Buffer.from('test-image');
      const caption: MultiLanguageText = { en: 'Test Image', hi: 'परीक्षण छवि' };
      const altText: MultiLanguageText = { en: 'Alt text', hi: 'वैकल्पिक पाठ' };

      mockQuery.mockResolvedValueOnce({
        rows: [{
          media_id: 'media-123',
          article_id: articleId,
          media_type: 'image',
          file_url: 'https://cdn.example.com/articles/article-123/images/media-123-test.jpg',
          file_size: 15000,
          mime_type: 'image/jpeg',
          caption: JSON.stringify(caption),
          alt_text: JSON.stringify(altText),
          thumbnail_url: null,
          processing_status: 'completed',
          uploaded_at: new Date(),
        }],
      });

      const result = await service.uploadMedia(
        articleId,
        {
          file: imageBuffer,
          filename: 'test.jpg',
          mimeType: 'image/jpeg',
          caption,
          altText,
        },
        {
          compressImages: true,
          maxImageSize: 500,
        }
      );

      expect(result.media_type).toBe('image');
      expect(result.article_id).toBe(articleId);
      expect(result.caption).toEqual(caption);
      expect(result.alt_text).toEqual(altText);
    });
  });

  describe('getArticleMedia', () => {
    it('should retrieve and group media by type', async () => {
      const articleId = 'article-123';

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            media_id: 'media-1',
            article_id: articleId,
            media_type: 'image',
            file_url: 'https://cdn.example.com/image1.jpg',
            file_size: 15000,
            mime_type: 'image/jpeg',
            caption: JSON.stringify({ en: 'Image 1' }),
            alt_text: JSON.stringify({ en: 'Alt 1' }),
            thumbnail_url: null,
            processing_status: 'completed',
            uploaded_at: new Date(),
          },
          {
            media_id: 'media-2',
            article_id: articleId,
            media_type: 'video',
            file_url: 'https://cdn.example.com/video1.mp4',
            file_size: 5000000,
            mime_type: 'video/mp4',
            caption: JSON.stringify({ en: 'Video 1' }),
            alt_text: null,
            thumbnail_url: 'https://cdn.example.com/thumb1.jpg',
            duration: 120,
            processing_status: 'completed',
            uploaded_at: new Date(),
          },
          {
            media_id: 'media-3',
            article_id: articleId,
            media_type: 'audio',
            file_url: 'https://cdn.example.com/audio1.mp3',
            file_size: 2000000,
            mime_type: 'audio/mpeg',
            caption: JSON.stringify({ en: 'Audio 1' }),
            alt_text: null,
            thumbnail_url: null,
            duration: 180,
            processing_status: 'completed',
            uploaded_at: new Date(),
          },
        ],
      });

      const result = await service.getArticleMedia(articleId);

      expect(result.images).toHaveLength(1);
      expect(result.videos).toHaveLength(1);
      expect(result.audio).toHaveLength(1);
      expect(result.images[0].url).toBe('https://cdn.example.com/image1.jpg');
      expect(result.videos[0].duration).toBe(120);
      expect(result.audio[0].duration).toBe(180);
    });
  });

  describe('updateMediaMetadata', () => {
    it('should update caption and alt text', async () => {
      const mediaId = 'media-123';
      const newCaption: MultiLanguageText = { en: 'Updated Caption', hi: 'अद्यतन शीर्षक' };
      const newAltText: MultiLanguageText = { en: 'Updated Alt', hi: 'अद्यतन वैकल्पिक' };

      mockQuery.mockResolvedValueOnce({
        rows: [{
          media_id: mediaId,
          article_id: 'article-123',
          media_type: 'image',
          file_url: 'https://cdn.example.com/image.jpg',
          file_size: 15000,
          mime_type: 'image/jpeg',
          caption: JSON.stringify(newCaption),
          alt_text: JSON.stringify(newAltText),
          thumbnail_url: null,
          processing_status: 'completed',
          uploaded_at: new Date(),
        }],
      });

      const result = await service.updateMediaMetadata(mediaId, {
        caption: newCaption,
        altText: newAltText,
      });

      expect(result.caption).toEqual(newCaption);
      expect(result.alt_text).toEqual(newAltText);
    });
  });

  describe('deleteMedia', () => {
    it('should delete media and return true', async () => {
      const mediaId = 'media-123';

      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            media_id: mediaId,
            file_url: 'https://cdn.example.com/image.jpg',
            thumbnail_url: null,
          }],
        })
        .mockResolvedValueOnce({ rows: [] });

      const result = await service.deleteMedia(mediaId);

      expect(result).toBe(true);
    });
  });

  describe('getAdaptiveMediaUrl', () => {
    it('should return 360p URL for low bandwidth', async () => {
      const mediaId = 'media-123';

      mockQuery.mockResolvedValueOnce({
        rows: [{
          media_id: mediaId,
          media_type: 'video',
          file_url: 'https://cdn.example.com/video.mp4',
        }],
      });

      const result = await service.getAdaptiveMediaUrl(mediaId, 'low');

      expect(result).toContain('360p');
    });
  });

  describe('getVideoQualities', () => {
    it('should return all quality variants', async () => {
      const videoUrl = 'https://cdn.example.com/video.mp4';

      const result = await service.getVideoQualities(videoUrl);

      expect(result).toHaveLength(3);
      expect(result[0].quality).toBe('360p');
      expect(result[1].quality).toBe('480p');
      expect(result[2].quality).toBe('720p');
    });
  });
});
