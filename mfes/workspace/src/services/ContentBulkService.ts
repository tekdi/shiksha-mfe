import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import * as pako from 'pako';
import { getLocalStoredUserId } from './LocalStorageService';

const userId = getLocalStoredUserId();

interface ContentRecord {
  cont_title?: string;
  cont_description?: string;
  language?: string;
  resourse_type?: string;
  author?: string;
  publisher?: string;
  year?: string;
  cont_url?: string;
  cont_dwurl?: string;
  access?: string;
  image?: string;
  thumbnail?: string;
  domain?: string;
  sub_domain?: string;
  content_language?: string;
  primary_user?: string;
  target_age_group?: string;
  program?: string;
  subjects?: string;
  topic?: string;
  sub_category?: string;
  cont_tagwords?: string;
  old_system_content_id?: string;
  convertedUrl?: string;
  // Framework-specific fields
  board?: string;
  medium?: string;
  gradeLevel?: string;
  subject?: string;
}

export const getPrimaryCategory = async (channelId: string) => {
  try {
    const response = await axios.get(`/action/channel/v1/read/${channelId}`);
    return response?.data?.result;
  } catch (e) {
    console.error('getPrimaryCategory error:', e);
    return undefined;
  }
};

export const getFrameworkDetails = async (frameworkId: string) => {
  try {
    const response = await axios.get(
      `/action/framework/v3/read/${frameworkId}`
    );
    return response?.data;
  } catch (error) {
    console.error('Error in getting Framework Details', error);
    throw error;
  }
};

export const getReqBodyWithStatus = (
  status: string[],
  query: string,
  limit: number,
  offset: number,
  primaryCategory: any,
  sort_by: any,
  channel: string,
  contentType?: string,
  state?: string
) => {
  const filters: any = {
    status,
    primaryCategory,
    channel: [channel],
    ...(contentType ? { contentType: [contentType] } : {}),
    ...(state ? { state: [state] } : {}),
  };

  // CreatedBy behavior to support My/Discover/UpForReview screens
  if (contentType === 'discover-contents') {
    filters.createdBy = { '!=': userId };
  } else if (contentType === 'upReview') {
    // no createdBy filter
  } else {
    filters.createdBy = userId;
  }

  return {
    request: {
      filters,
      query,
      limit,
      offset,
      sort_by,
    },
  };
};

export const getContent = async (
  status: string[],
  query: string,
  limit: number,
  offset: number,
  primaryCategory: any,
  sort_by: any,
  channel: string,
  contentType?: string,
  state?: string
) => {
  const apiURL = '/action/composite/v3/search';
  try {
    const reqBody = getReqBodyWithStatus(
      status,
      query,
      limit,
      offset,
      primaryCategory,
      sort_by,
      channel,
      contentType,
      state
    );
    const response = await axios.post(apiURL, reqBody);
    return response?.data?.result;
  } catch (error) {
    console.error('Error fetching content:', error);
    throw error;
  }
};

export class ContentBulkService {
  private readonly middlewareUrl: string;
  private readonly framework: string;
  private readonly tenantId: string;
  private readonly channelId: string;
  private readonly imageBaseUrl: string;
  private readonly awsBucketName?: string;
  private readonly awsRegion?: string;
  private readonly fileValidationTimeout: number;
  private readonly defaultRetries: number;
  private readonly defaultRetryDelay: number;

  constructor() {
    this.middlewareUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

    // Get values from localStorage only
    this.framework =
      typeof window !== 'undefined'
        ? localStorage.getItem('frameworkId') || ''
        : '';

    this.tenantId =
      typeof window !== 'undefined'
        ? localStorage.getItem('tenantId') || ''
        : '';

    this.channelId =
      typeof window !== 'undefined'
        ? localStorage.getItem('channelId') || ''
        : '';

    this.imageBaseUrl =
      process.env.NEXT_PUBLIC_IMAGE_BASE_URL ||
      'https://atreefrontend.s3.ap-south-1.amazonaws.com';
    this.awsBucketName = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
    this.awsRegion = process.env.NEXT_PUBLIC_AWS_REGION;

    // Configurable timeout and retry settings
    this.fileValidationTimeout = parseInt(
      process.env.NEXT_PUBLIC_FILE_VALIDATION_TIMEOUT || '15000'
    );
    this.defaultRetries = parseInt(
      process.env.NEXT_PUBLIC_DEFAULT_RETRIES || '3'
    );
    this.defaultRetryDelay = parseInt(
      process.env.NEXT_PUBLIC_DEFAULT_RETRY_DELAY || '2000'
    );
  }

  private isApiSuccess(data: any): boolean {
    try {
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      return (
        data?.success === true ||
        data?.responseCode === 'OK' ||
        data?.params?.status === 'successful'
      );
    } catch (_e) {
      return false;
    }
  }

  private toArray(value: string | undefined): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item !== '');
  }

  private validateMimeType(mimeType: string): boolean {
    const allowedMimeTypes = [
      'application/vnd.ekstep.ecml-archive',
      'application/vnd.ekstep.html-archive',
      'application/vnd.android.package-archive',
      'application/vnd.ekstep.content-archive',
      'application/vnd.ekstep.content-collection',
      'application/vnd.ekstep.plugin-archive',
      'application/vnd.ekstep.h5p-archive',
      'application/epub',
      'text/x-url',
      'video/x-youtube',
      'application/octet-stream',
      'application/msword',
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/tiff',
      'image/bmp',
      'image/gif',
      'image/svg+xml',
      'video/avi',
      'video/mpeg',
      'video/quicktime',
      'video/3gpp',
      'video/mp4',
      'video/ogg',
      'video/webm',
      'audio/mp3',
      'audio/mp4',
      'audio/mpeg',
      'audio/ogg',
      'audio/webm',
      'audio/x-wav',
      'audio/wav',
      'application/json',
      'application/quiz',
    ];
    return allowedMimeTypes.includes(mimeType);
  }

  private async validateNcertUrl(url: string): Promise<boolean> {
    // Check if it's an NCERT textbook portal link
    if (url.includes('ncert.nic.in/textbook.php')) {
      return true; // Special case - these are valid textbook references
    }
    return false;
  }

  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit to accommodate larger files
  private readonly SERVER_MAX_SIZE = 10 * 1024 * 1024; // 10MB server limit

  /**
   * Compress file data using gzip compression
   */
  private compressFile(data: ArrayBuffer, mimeType: string): ArrayBuffer {
    try {
      console.log(`Compressing file data (${mimeType})...`);
      const originalSize = data.byteLength;
      console.log(`Original file size: ${originalSize} bytes`);
      
      // Convert ArrayBuffer to Uint8Array for compression
      const uint8Array = new Uint8Array(data);
      console.log(`Converted to Uint8Array: ${uint8Array.length} bytes`);
      
      // Use different compression levels based on file type
      let compressionLevel: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | -1 = 6; // Default compression level
      
      if (mimeType.includes('pdf') || mimeType.includes('application/')) {
        compressionLevel = 9; // Maximum compression for PDFs and documents
      } else if (mimeType.includes('text/')) {
        compressionLevel = 6; // Standard compression for text
      }
      
      console.log(`Using compression level: ${compressionLevel}`);
      
      // Try compression with error handling
      let compressed;
      try {
        compressed = pako.gzip(uint8Array, { level: compressionLevel });
        console.log(`Compression successful: ${compressed.length} bytes`);
      } catch (compressionError) {
        console.error('Pako compression failed:', compressionError);
        // Try with lower compression level
        console.log('Trying with lower compression level...');
        compressed = pako.gzip(uint8Array, { level: 1 });
        console.log(`Fallback compression successful: ${compressed.length} bytes`);
      }
      
      const compressedSize = compressed.byteLength;
      const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);
      
      console.log(`Compression complete: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressedSize / 1024 / 1024).toFixed(2)}MB (${compressionRatio}% reduction)`);
      
      // If compression didn't help much, return original data
      if (compressedSize >= originalSize * 0.95) {
        console.log('Compression not effective, file may already be compressed');
        console.log('Returning original data - file may need to be manually compressed');
        return data;
      }
      
      return compressed.buffer;
    } catch (error) {
      console.error('Compression failed:', error);
      console.error('Error details:', error);
      throw new Error(`Failed to compress file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if file type can be compressed effectively
   */
  private canCompressEffectively(mimeType: string): boolean {
    const compressibleTypes = [
      'text/',
      'application/json',
      'application/xml',
      'application/javascript',
      'application/x-javascript',
      'application/pdf', // PDFs can sometimes be compressed
      'application/msword',
      'application/vnd.openxmlformats-officedocument',
      'image/svg+xml',
      'application/octet-stream' // Try compression for unknown types
    ];
    
    // Always try compression for files over server limit
    return true; // Try compression for all file types
  }

  private async downloadFileFromUrl(url: string): Promise<ArrayBuffer> {
    try {
      console.log('Downloading file from URL:', url);

      // Check if it's a Google Drive URL
      if (url.includes('drive.google.com')) {
        // Extract file ID from Google Drive URL
        const fileIdMatch =
          url.match(/[?&]id=([^&]+)/) || url.match(/\/d\/([^/?]+)/);
        if (!fileIdMatch) {
          throw new Error('Could not extract file ID from Google Drive URL');
        }

        const fileId = fileIdMatch[1];
        const apiKey =
          process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY ||
          'AIzaSyD00Un42OrRpk2hEBEq7pdUGC3Ry54Wdq8';

        console.log('Using Google Drive API to download file ID:', fileId);

        // Use Google Drive API to download the file
        const response = await axios.get(
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
          {
            params: { key: apiKey },
            responseType: 'arraybuffer',
            timeout: 30000,
            maxContentLength: this.MAX_FILE_SIZE, // Use 50MB limit
          }
        );

        // Check file size and compress if needed
        let fileData = response.data;
        const originalSize = fileData.byteLength;
        
        if (originalSize > this.SERVER_MAX_SIZE) {
          console.log(`File size (${(originalSize / 1024 / 1024).toFixed(2)}MB) exceeds server limit (10MB). Attempting compression...`);
          
          // Try to get MIME type for compression decision
          const mimeType = response.headers['content-type'] || 'application/octet-stream';
          
          if (this.canCompressEffectively(mimeType)) {
            try {
              fileData = this.compressFile(fileData, mimeType);
              
              if (fileData.byteLength > this.SERVER_MAX_SIZE) {
                const compressedSizeMB = (fileData.byteLength / 1024 / 1024).toFixed(2);
                throw new Error(
                  `File is too large even after compression (${compressedSizeMB}MB). Please use a smaller file or compress it manually.`
                );
              }
              
              console.log('File compressed successfully for upload');
            } catch (compressionError: any) {
              throw new Error(
                `File size (${(originalSize / 1024 / 1024).toFixed(2)}MB) exceeds server limit and cannot be compressed. Please use a smaller file.`
              );
            }
          } else {
            throw new Error(
              `File size (${(originalSize / 1024 / 1024).toFixed(2)}MB) exceeds server limit and file type cannot be compressed effectively. Please use a smaller file.`
            );
          }
        }

        console.log(
          'File downloaded successfully via Google Drive API, size:',
          fileData.byteLength,
          'bytes'
        );
        return fileData;
      } else {
        // For non-Google Drive URLs, use direct download
        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 30000, // 30 seconds timeout
          maxContentLength: this.MAX_FILE_SIZE, // Use 50MB limit
        });

        // Check file size and compress if needed
        let fileData = response.data;
        const originalSize = fileData.byteLength;
        
        if (originalSize > this.SERVER_MAX_SIZE) {
          console.log(`File size (${(originalSize / 1024 / 1024).toFixed(2)}MB) exceeds server limit (10MB). Attempting compression...`);
          
          // Try to get MIME type for compression decision
          const mimeType = response.headers['content-type'] || 'application/octet-stream';
          
          if (this.canCompressEffectively(mimeType)) {
            try {
              fileData = this.compressFile(fileData, mimeType);
              
              if (fileData.byteLength > this.SERVER_MAX_SIZE) {
                const compressedSizeMB = (fileData.byteLength / 1024 / 1024).toFixed(2);
                throw new Error(
                  `File is too large even after compression (${compressedSizeMB}MB). Please use a smaller file or compress it manually.`
                );
              }
              
              console.log('File compressed successfully for upload');
            } catch (compressionError: any) {
              throw new Error(
                `File size (${(originalSize / 1024 / 1024).toFixed(2)}MB) exceeds server limit and cannot be compressed. Please use a smaller file.`
              );
            }
          } else {
            throw new Error(
              `File size (${(originalSize / 1024 / 1024).toFixed(2)}MB) exceeds server limit and file type cannot be compressed effectively. Please use a smaller file.`
            );
          }
        }

        console.log(
          'File downloaded successfully, size:',
          fileData.byteLength,
          'bytes'
        );
        return fileData;
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      if (axios.isAxiosError(error)) {
        console.error('Download error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });

        // Handle specific error cases
        if (error.response?.status === 404) {
          const fileIdMatch = url.match(/[?&]id=([^&]+)/) || url.match(/\/d\/([^/?]+)/);
          const fileId = fileIdMatch ? fileIdMatch[1] : 'unknown';
          throw new Error(
            `Google Drive file not found (404). Please check if the file exists and is publicly accessible. File ID: ${fileId}. Original URL: ${url}`
          );
        }
        if (error.response?.status === 403) {
          const fileIdMatch = url.match(/[?&]id=([^&]+)/) || url.match(/\/d\/([^/?]+)/);
          const fileId = fileIdMatch ? fileIdMatch[1] : 'unknown';
          throw new Error(
            `Access denied to Google Drive file (403). Please ensure the file is publicly accessible. File ID: ${fileId}. Original URL: ${url}`
          );
        }
        if (error.response?.status === 413) {
          throw new Error(
            'File size exceeds the maximum allowed size of 50MB. Please use a smaller file.'
          );
        }
      }
      throw new Error(
        `Failed to download file from ${url}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  private async validateFileUrl(
    fileUrl: string,
    record: ContentRecord
  ): Promise<boolean> {
    if (await this.validateNcertUrl(fileUrl)) {
      return true;
    }

    const SUPPORTED_FILE_TYPES = ['pdf', 'mp4', 'zip', 'mp3', 'html'];

    const isYouTubeUrl =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(fileUrl);
    const isGoogleDriveUrl = /drive\.google\.com\/file\/d\/([^/]+)\//.test(
      fileUrl
    );
    const isGoogleDriveDownloadUrl =
      /drive\.google\.com\/uc\?export=download/.test(fileUrl);

    if (isYouTubeUrl) {
      console.log(`Skipping file existence check for YouTube URL: ${fileUrl}`);
      return true;
    }

    if (isGoogleDriveUrl || isGoogleDriveDownloadUrl) {
      console.log(`Google Drive URL detected: ${fileUrl}`);

      // Convert to download URL for validation
      const downloadUrl = this.convertGoogleDriveUrl(fileUrl);
      console.log(`Converted to download URL: ${downloadUrl}`);

      // For Google Drive URLs, we'll skip the HEAD request validation
      // since they often return 403 or redirect responses
      return true;
    }

    // Handle URLs without file extensions
    let ext = '';
    try {
      const url = new URL(fileUrl);
      ext = url.pathname.split('.').pop()?.toLowerCase() || '';
    } catch (error) {
      console.warn(`Invalid URL format: ${fileUrl}`);
      return false;
    }

    // If no extension, try to infer from content-type
    if (!ext) {
      try {
        const response = await axios.head(fileUrl, { timeout: 10000 });
        const mimeType = response.headers['content-type'];
        if (mimeType) {
          const inferredExt = mime.extension(mimeType);
          if (inferredExt && SUPPORTED_FILE_TYPES.includes(inferredExt)) {
            ext = inferredExt;
            console.log(`Inferred extension from MIME type: ${ext}`);
          }
        }
      } catch (error) {
        console.warn(`Could not infer file extension for: ${fileUrl}`);
      }
    }

    try {
      // Primary check using HEAD request
      const response = await axios.head(fileUrl, { timeout: 15000 });

      if (response.status !== 200) {
        throw new Error(`Unexpected status code: ${response.status}`);
      }

      const mimeType = response.headers['content-type'];
      console.log(`File exists: ${fileUrl} (MIME: ${mimeType}, EXT: ${ext})`);

      // If we have an extension, validate it
      if (ext && !SUPPORTED_FILE_TYPES.includes(ext)) {
        throw new Error(`Unsupported file type: ${ext} for URL: ${fileUrl}`);
      }

      return true;
    } catch (headError) {
      console.warn(
        `HEAD request failed for ${fileUrl}. Attempting GET fallback...`
      );

      try {
        // Fallback check using GET request with Range header (fetch only 1st byte)
        const response = await axios.get(fileUrl, {
          headers: { Range: 'bytes=0-0' },
          timeout: 15000,
        });

        const mimeType = response.headers['content-type'];
        console.log(
          `(Fallback) File exists: ${fileUrl} (MIME: ${mimeType}, EXT: ${ext})`
        );

        // If we have an extension, validate it
        if (ext && !SUPPORTED_FILE_TYPES.includes(ext)) {
          throw new Error(`Unsupported file type: ${ext} for URL: ${fileUrl}`);
        }

        return true;
      } catch (getError) {
        const errorMessage =
          getError instanceof Error
            ? getError.message
            : 'Unknown fallback error';
        const logMessage = `❌ Fallback failed: ${fileUrl}. Title: ${record.cont_title} - ${errorMessage}`;

        console.error(logMessage);
        return false;
      }
    }
  }

  private convertGoogleDriveUrl(url: string): string {
    // Handle various Google Drive URL formats
    const patterns = [
      /\/file\/d\/([^/?]+)/, // Standard file URL
      /id=([^&]+)/, // ID parameter
      /\/open\?id=([^&]+)/, // Open URL
      /\/view\?usp=([^&]+)/, // View URL
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `https://drive.google.com/uc?export=download&id=${match[1]}`;
      }
    }

    // If no pattern matches, try to extract file ID from the URL path
    const fileIdMatch = url.match(/\/d\/([^/?]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
    }

    return url;
  }

  private getHeaders(userToken: string) {
    return {
      Authorization: `Bearer ${userToken}`,
      tenantId: this.tenantId,
      'X-Channel-Id': this.channelId,
      'Content-Type': 'application/json',
    };
  }

  private async retryRequest<T>(
    fn: () => Promise<T>,
    retries = this.defaultRetries,
    delayMs = this.defaultRetryDelay,
    label = 'API'
  ): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await fn();
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`⚠️ ${label} attempt ${attempt} failed: ${message}`);
        if (attempt < retries) {
          await new Promise((res) => setTimeout(res, delayMs));
          continue;
        }
        throw error;
      }
    }
    throw new Error(`${label} failed after ${retries} retries`);
  }

  async processContent(
    record: ContentRecord,
    userId: string,
    userToken: string
  ): Promise<string | undefined> {
    try {
      console.log('Processing content record:', record);
      const title = record.cont_title;
      const fileDownloadURL = record.cont_dwurl || '';
      const isMediaFile = fileDownloadURL.match(/\.(m4a|m4v)$/i);
      const fileUrl = isMediaFile
        ? record.convertedUrl || fileDownloadURL
        : fileDownloadURL;

      const primaryCategory = 'Learning Resource';

      if (!title) {
        throw new Error('Title is missing');
      }

      // For board-based frameworks, cont_dwurl is not required
      // Only validate fileUrl if cont_dwurl is provided in the record
      if (record.cont_dwurl && !fileUrl) {
        throw new Error('Download URL is missing');
      }

      // Only validate file URL if it's provided
      if (fileUrl) {
        const isValidFile = await this.validateFileUrl(fileUrl, record);
        if (!isValidFile) {
          throw new Error('Invalid file URL');
        }
      }

      // Create and upload content
      const createdContent = await this.createAndUploadContent(
        record,
        title,
        userId,
        fileUrl,
        primaryCategory,
        userToken
      );

      if (!createdContent) {
        throw new Error('Failed to create content');
      }

      console.log('Content created successfully:', createdContent.doId);

      // Upload media only if fileUrl exists
      if (createdContent.fileUrl) {
        const uploadedContent = await this.uploadContent(
          createdContent.doId,
          createdContent.fileUrl,
          userToken
        );
        console.log('Uploaded Content:', uploadedContent);
      } else {
        console.log('Skipping upload - no file URL provided');
      }

      // Review content
      const reviewedContent = await this.reviewContent(
        createdContent.doId,
        userToken
      );
      console.log('Reviewed Content:', reviewedContent);

      // Publish content
      const publishedContent = await this.publishContent(
        createdContent.doId,
        userToken
      );
      console.log('Published Content:', publishedContent);

      return createdContent.doId;
    } catch (error) {
      console.error('Error processing content:', error);
      throw error;
    }
  }

  private async createAndUploadContent(
    record: ContentRecord,
    title: string,
    userId: string,
    documentUrl: string,
    primaryCategory: string,
    userToken: string
  ): Promise<
    { doId: string; versionKey: string; fileUrl: string } | undefined
  > {
    try {
      const YOUTUBE_URL_REGEX =
        /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
      const isYouTubeURL = documentUrl
        ? YOUTUBE_URL_REGEX.test(documentUrl)
        : false;
      const uniqueCode = uuidv4();
      let fileUrl: string = documentUrl || '';

      // Fetch framework details to determine if it's topic-based or board-based
      let isTopicFramework = false;
      try {
        const frameworkDetails = await getFrameworkDetails(this.framework);
        const frameworkData = frameworkDetails?.result?.framework;

        if (frameworkData?.categories) {
          const hasTopic = frameworkData.categories.some(
            (cat: any) => cat.code === 'topic'
          );
          const hasBoard = frameworkData.categories.some(
            (cat: any) => cat.code === 'board'
          );
          // If framework has topic but no board, it's a topic-based framework
          isTopicFramework = hasTopic && !hasBoard;
        }
      } catch (error) {
        console.warn(
          'Could not fetch framework details, defaulting to include all fields:',
          error
        );
      }

      // Prepare additional fields
      const additionalFields: any = {
        description: record.cont_description || '',
        domain: this.toArray(record.domain),
        primaryUser: this.toArray(record.primary_user),
        program: this.toArray(record.program),
        subDomain: this.toArray(record.sub_domain),
        targetAgeGroup: this.toArray(record.target_age_group),
        contentLanguage: record.content_language || '',
        isContentMigrated: 1,
        oldSystemContentId: record.old_system_content_id || '',
        contentType: 'Resource',
        topic: this.toArray(record.topic),
        subTopic: this.toArray(record.sub_category),
        keywords: this.toArray(record.cont_tagwords),
        author: record.author || '',
        name: record.cont_title || '',
        url: record.cont_url || '',
        language: this.toArray(record.language),
        resource: record.resourse_type || '',
        access: record.access || '',
        publisher: record.publisher || '',
        year: record.year || '',
        posterImage: record.thumbnail
          ? `${this.imageBaseUrl}/thumbnail/${record.thumbnail}`
          : '',
        appicon: record.image
          ? `${this.imageBaseUrl}/detail/${record.image}`
          : '',
      };

      // Only include board, medium, gradeLevel, subject for non-topic frameworks
      if (!isTopicFramework) {
        additionalFields.board = record.board || '';
        additionalFields.medium = record.medium
          ? this.toArray(record.medium)
          : [];
        additionalFields.gradeLevel = record.gradeLevel
          ? this.toArray(record.gradeLevel)
          : [];
        additionalFields.subject = this.toArray(
          record.subject || record.subjects
        );
      }

      // Handle Google Drive URLs and file type detection
      let fileExtension = '';
      let fileId: string | null = null;

      if (documentUrl) {
        // ✅ Check if it's a Google Drive URL
        console.log('documentUrl', documentUrl);

        // Convert Google Drive URL to download URL if needed
        if (documentUrl.includes('drive.google.com')) {
          console.log('🔍 Original Google Drive URL:', documentUrl);
          documentUrl = this.convertGoogleDriveUrl(documentUrl);
          console.log('🔄 Converted documentUrl to download URL:', documentUrl);
        }

        const googleDriveMatch = documentUrl.match(
          /drive\.google\.com\/file\/d\/([^/?]+)/
        );
        const googleDriveDownloadMatch = documentUrl.match(
          /drive\.google\.com\/uc\?export=download&id=([^&]+)/
        );

        console.log('🔍 Google Drive URL patterns matched:');
        console.log('  - File/d/ pattern:', googleDriveMatch);
        console.log('  - UC export pattern:', googleDriveDownloadMatch);

        if (googleDriveMatch) {
          fileId = googleDriveMatch[1];
          console.log('📁 Extracted file ID from file/d/ pattern:', fileId);
        } else if (googleDriveDownloadMatch) {
          fileId = googleDriveDownloadMatch[1];
          console.log('📁 Extracted file ID from uc export pattern:', fileId);
        } else {
          console.log('❌ No Google Drive file ID found in URL:', documentUrl);
        }

        // Skip Google Drive API validation and use URL directly
        if (fileId) {
          console.log(
            '📁 Skipping Google Drive API validation for file ID:',
            fileId
          );
          console.log(
            '📁 Using direct URL approach - server will handle file download'
          );

          // Use the converted download URL directly
          fileUrl = documentUrl; // Use the already converted URL
          console.log(`📁 Using Google Drive URL for upload: ${fileUrl}`);

          // Set default extension for Google Drive files
          fileExtension = 'pdf'; // Default to PDF for Google Drive files
          console.log('📁 Defaulting to PDF extension for Google Drive file');
        }

        // 🔄 Fallback to HEAD request if still unknown
        const knownBadExtensions = ['bin', '', undefined];

        if (!fileExtension || knownBadExtensions.includes(fileExtension)) {
          try {
            const headResponse = await axios.head(documentUrl, {
              timeout: 5000,
            });
            const mimeTypeFromHead = headResponse.headers['content-type'];

            if (
              mimeTypeFromHead &&
              mimeTypeFromHead !== 'application/octet-stream'
            ) {
              const inferred = mime.extension(mimeTypeFromHead);
              if (inferred) {
                fileExtension = inferred.toLowerCase();
                console.log(
                  `📦 Inferred from HEAD content-type: ${fileExtension}`
                );
              } else {
                console.warn(
                  `⚠️ MIME type detected but could not infer extension: ${mimeTypeFromHead}`
                );
              }
            } else {
              console.warn(
                `⚠️ HEAD response returned generic MIME type: ${mimeTypeFromHead}`
              );
            }
          } catch (err) {
            console.warn(
              `⚠️ Failed to infer file extension via HEAD:`,
              err instanceof Error ? err.message : err
            );
          }
        }

        // 🛡️ Final fallback — only override if there's no valid extension
        const SUPPORTED_FILE_TYPES = ['pdf', 'mp4', 'zip', 'mp3', 'html'];
        if (!fileExtension || !SUPPORTED_FILE_TYPES.includes(fileExtension)) {
          console.warn(
            `⚠️ Could not detect or unsupported file extension: ${fileExtension}`
          );

          try {
            const url = new URL(documentUrl);
            const extFromUrl =
              url.pathname.split('.').pop()?.toLowerCase() || '';
            if (SUPPORTED_FILE_TYPES.includes(extFromUrl)) {
              fileExtension = extFromUrl;
              console.log(
                `✅ Recovered valid extension from URL: ${fileExtension}`
              );
            } else {
              fileExtension = 'pdf'; // Safe default
              console.log(`⚠️ Defaulting to fallback extension: pdf`);
            }
          } catch (e) {
            fileExtension = 'pdf'; // Safe default
            console.log(`⚠️ Defaulting to fallback extension: pdf`);
          }
        }

        console.log(`✅ Final fileExtension resolved: [${fileExtension}]`);
      }

      // Determine MIME type based on URL type and file extension
      let mimeType: string;
      if (isYouTubeURL) {
        mimeType = 'video/x-youtube';
      } else if (fileId) {
        // For Google Drive links, default to PDF
        mimeType = 'application/pdf';
      } else if (fileExtension === 'zip') {
        mimeType = 'application/vnd.ekstep.html-archive';
      } else {
        mimeType = mime.lookup(fileExtension) || 'application/octet-stream';
      }

      if (!this.validateMimeType(mimeType)) {
        console.error(`Invalid MIME type: ${mimeType}`);
        throw new Error(`MIME type ${mimeType} is not supported by the system`);
      }

      // Create content payload
      const payload = {
        request: {
          content: {
            code: uniqueCode,
            mimeType,
            primaryCategory,
            framework: this.framework,
            createdBy: userId,
            ...additionalFields,
          },
        },
      };

      // Create content
      const createResponse = await this.retryRequest(
        () =>
          axios.post(`/action/content/v3/create`, payload, {
            headers: this.getHeaders(userToken),
          }),
        undefined,
        undefined,
        'Create Content'
      );

      if (!createResponse.data?.result) {
        throw new Error('Invalid response format from content creation API');
      }

      const { identifier: doId, versionKey } = createResponse.data.result;

      // Upload only if fileUrl exists
      if (fileUrl) {
        if (isYouTubeURL) {
          // For YouTube, only update artifact URL via PATCH if needed later
          return { doId, versionKey, fileUrl };
        }
        // If not YouTube, proceed normally (upload via proxy endpoint)
        return { doId, versionKey, fileUrl };
      } else {
        // For board-based frameworks without file URL, just return the content ID
        return { doId, versionKey, fileUrl: '' };
      }
    } catch (error) {
      console.error('Error creating content record:', error);
      throw error;
    }
  }

  private async uploadContent(
    contentId: string,
    fileUrl: string,
    userToken: string
  ) {
    try {
      console.log('Uploaded content flow start');
      console.log('File URL to upload:', fileUrl);

      // Check if it's a YouTube URL (keep as URL)
      const isYouTubeUrl =
        fileUrl.includes('youtube.com') || fileUrl.includes('youtu.be');

      if (isYouTubeUrl) {
        console.log(
          'YouTube URL detected, using multipart/form-data with fileUrl and file'
        );

        // For YouTube URLs, we need to send both fileUrl and a dummy file
        // First, let's create a dummy file (empty or minimal content)
        const dummyContent = 'YouTube video content';
        const dummyBlob = new Blob([dummyContent], { type: 'text/plain' });

        // Create form data with fileUrl, mimeType, and dummy file
        const formData = new FormData();
        formData.append('fileUrl', fileUrl);
        formData.append('mimeType', 'video/x-youtube');
        formData.append('file', dummyBlob, 'youtube_video.txt');

        console.log('📤 YouTube upload form data:');
        console.log('  - fileUrl:', fileUrl);
        console.log('  - mimeType: video/x-youtube');
        console.log('  - file: youtube_video.txt (dummy)');

        const response = await this.retryRequest(
          () =>
            axios.post(`/action/content/v3/upload/${contentId}`, formData, {
              headers: {
                ...this.getHeaders(userToken),
                'Content-Type': 'multipart/form-data',
              },
            }),
          undefined,
          undefined,
          'Upload Content'
        );
        return response.data;
      } else {
        // For all other URLs (including Google Drive), use fileUrl and mimeType (same format as YouTube)
        console.log('Using fileUrl and mimeType for upload (no file download)');

        // Determine mime type from URL extension
        let mimeType = 'application/octet-stream';

        // Try to extract file extension from URL
        try {
          const url = new URL(fileUrl);
          const pathParts = url.pathname.split('/');
          const lastPart = pathParts[pathParts.length - 1];
          if (lastPart && lastPart.includes('.')) {
            const ext = lastPart.split('.').pop()?.toLowerCase();
            if (ext) {
              mimeType = mime.lookup(ext) || 'application/octet-stream';
            }
          }
        } catch (error) {
          console.warn(
            'Could not parse URL for file extension extraction:',
            error
          );
        }

        // For Google Drive URLs, default to PDF mime type
        if (fileUrl.includes('drive.google.com')) {
          console.log(
            '📁 Google Drive URL detected in upload, defaulting to PDF mime type'
          );
          console.log('📁 Google Drive URL:', fileUrl);
          mimeType = 'application/pdf';
        }

        console.log('📤 Upload details:');
        console.log('  - File URL:', fileUrl);
        console.log('  - MIME Type:', mimeType);
        console.log('  - Content ID:', contentId);

        // Download the file first
        console.log('📥 Downloading file from URL:', fileUrl);
        const fileArrayBuffer = await this.downloadFileFromUrl(fileUrl);

        // Check file size
        if (fileArrayBuffer.byteLength > this.MAX_FILE_SIZE) {
          const sizeInMB = (fileArrayBuffer.byteLength / (1024 * 1024)).toFixed(
            2
          );
          throw new Error(
            `File size (${sizeInMB}MB) exceeds the maximum allowed size of 50MB. Please use a smaller file or compress the content.`
          );
        }

        // Determine file name
        let fileName = 'content';
        try {
          const url = new URL(fileUrl);
          const pathParts = url.pathname.split('/');
          const lastPart = pathParts[pathParts.length - 1];
          if (lastPart && lastPart.includes('.')) {
            fileName = lastPart;
          }
        } catch (error) {
          console.warn('Could not parse URL for file name extraction:', error);
        }

        // For Google Drive URLs, use a default filename
        if (fileUrl.includes('drive.google.com')) {
          fileName = 'google_drive_file.pdf';
        }

        console.log('📤 File download complete:');
        console.log('  - File Name:', fileName);
        console.log('  - File Size:', fileArrayBuffer.byteLength, 'bytes');
        console.log('  - MIME Type:', mimeType);

        // Create form data with file and mimeType (matching your working API format)
        const formData = new FormData();
        const blob = new Blob([fileArrayBuffer], { type: mimeType });
        formData.append('file', blob, fileName);
        formData.append('mimeType', mimeType);

        console.log('📤 Form data created with:');
        console.log('  - file:', fileName, '(blob)');
        console.log('  - mimeType:', mimeType);

        // Upload using multipart/form-data
        const response = await this.retryRequest(
          () =>
            axios.post(`/action/content/v3/upload/${contentId}`, formData, {
              headers: {
                ...this.getHeaders(userToken),
                'Content-Type': 'multipart/form-data',
              },
            }),
          undefined,
          undefined,
          'Upload Content'
        );
        return response.data;
      }
    } catch (error) {
      console.error('Error during file upload:', error);
      if (axios.isAxiosError(error)) {
        console.error('Upload error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method,
        });
      }
      throw error;
    }
  }

  private async reviewContent(contentId: string, userToken: string) {
    try {
      const response = await this.retryRequest(
        () =>
          axios.post(
            `/action/content/v3/review/${contentId}`,
            {},
            {
              headers: this.getHeaders(userToken),
            }
          ),
        undefined,
        undefined,
        'reviewContent'
      );
      return response.data;
    } catch (error) {
      console.error('Error during review:', error);
      throw error;
    }
  }

  private async publishContent(contentId: string, userToken: string) {
    try {
      const body = {
        request: {
          content: {
            publishChecklist: [
              'No Hate speech, Abuse, Violence, Profanity',
              'Is suitable for children',
              'Correct Board, Grade, Subject, Medium',
              'Appropriate Title, Description',
              'No Sexual content, Nudity or Vulgarity',
              'No Discrimination or Defamation',
              'Appropriate tags such as Resource Type, Concepts',
              'Relevant Keywords',
              'Audio (if any) is clear and easy to understand',
              'No Spelling mistakes in the text',
              'Language is simple to understand',
              'Can see the content clearly on Desktop and App',
              'Content plays correctly',
            ],
            lastPublishedBy: userId,
          },
        },
      };
      const response = await this.retryRequest(
        () =>
          axios.post(`/action/content/v3/publish/${contentId}`, body, {
            headers: this.getHeaders(userToken),
          }),
        undefined,
        undefined,
        'publishContent'
      );
      return response.data;
    } catch (error) {
      console.error('Error during publish:', error);
      throw error;
    }
  }
}
