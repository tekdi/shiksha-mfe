/**
 * Utility functions to parse S3 URLs and extract bucket name and path
 */

export interface S3UrlInfo {
  bucketName: string;
  region: string;
  path: string;
  fullUrl: string;
  isS3Url: boolean;
}

/**
 * Parse an S3 URL and extract bucket name, region, and path
 * Supports both virtual-hosted-style and path-style URLs
 * 
 * Examples:
 * - https://bucket-name.s3.region.amazonaws.com/path/to/file
 * - https://s3.region.amazonaws.com/bucket-name/path/to/file
 * - https://bucket-name.s3.amazonaws.com/path/to/file
 */
export function parseS3Url(url: string): S3UrlInfo {
  if (!url || typeof url !== 'string') {
    return {
      bucketName: '',
      region: '',
      path: '',
      fullUrl: url || '',
      isS3Url: false
    };
  }

  try {
    const urlObj = new URL(url);
    
    // Check if it's an S3 URL
    const isS3Url = urlObj.hostname.includes('amazonaws.com') || 
                   urlObj.hostname.includes('s3.') ||
                   urlObj.hostname.includes('.s3.');

    if (!isS3Url) {
      return {
        bucketName: '',
        region: '',
        path: urlObj.pathname.substring(1), // Remove leading slash
        fullUrl: url,
        isS3Url: false
      };
    }

    let bucketName = '';
    let region = '';
    let path = '';

    // Virtual-hosted-style URL: https://bucket-name.s3.region.amazonaws.com/path
    if (urlObj.hostname.includes('.s3.')) {
      const hostnameParts = urlObj.hostname.split('.');
      
      if (hostnameParts.length >= 3) {
        bucketName = hostnameParts[0];
        
        // Extract region from hostname
        if (hostnameParts[1] === 's3' && hostnameParts.length > 2) {
          region = hostnameParts[2];
        }
      }
      
      path = urlObj.pathname.substring(1); // Remove leading slash
    }
    // Path-style URL: https://s3.region.amazonaws.com/bucket-name/path
    else if (urlObj.hostname.startsWith('s3.')) {
      const hostnameParts = urlObj.hostname.split('.');
      
      if (hostnameParts.length >= 2) {
        region = hostnameParts[1];
      }
      
      const pathParts = urlObj.pathname.substring(1).split('/');
      if (pathParts.length > 0) {
        bucketName = pathParts[0];
        path = pathParts.slice(1).join('/');
      }
    }

    return {
      bucketName,
      region,
      path,
      fullUrl: url,
      isS3Url: true
    };
  } catch (error) {
    console.error('Error parsing S3 URL:', error);
    return {
      bucketName: '',
      region: '',
      path: '',
      fullUrl: url,
      isS3Url: false
    };
  }
}

/**
 * Get S3 bucket name and path from environment variable
 */
export function getS3InfoFromEnv(): S3UrlInfo {
  const cloudStorageUrl = process.env.NEXT_PUBLIC_CLOUD_STORAGE_URL || '';
  return parseS3Url(cloudStorageUrl);
}

/**
 * Construct S3 URL from bucket name, region, and path
 */
export function constructS3Url(bucketName: string, region: string, path: string, useVirtualHostedStyle = true): string {
  if (!bucketName || !path) {
    return '';
  }

  if (useVirtualHostedStyle) {
    // Virtual-hosted-style: https://bucket-name.s3.region.amazonaws.com/path
    const regionPart = region ? `.${region}` : '';
    return `https://${bucketName}.s3${regionPart}.amazonaws.com/${path}`;
  } else {
    // Path-style: https://s3.region.amazonaws.com/bucket-name/path
    const regionPart = region ? `.${region}` : '';
    return `https://s3${regionPart}.amazonaws.com/${bucketName}/${path}`;
  }
}

/**
 * Extract bucket name from various S3 URL formats
 */
export function extractBucketName(url: string): string {
  const s3Info = parseS3Url(url);
  return s3Info.bucketName;
}

/**
 * Extract path from S3 URL
 */
export function extractS3Path(url: string): string {
  const s3Info = parseS3Url(url);
  return s3Info.path;
}

/**
 * Check if a URL is an S3 URL
 */
export function isS3Url(url: string): boolean {
  const s3Info = parseS3Url(url);
  return s3Info.isS3Url;
}

// Example usage and common S3 URLs found in the codebase
export const COMMON_S3_URLS = {
  // From KaTableComponent.tsx
  SAAS_PROD: 'https://s3.ap-south-1.amazonaws.com/saas-prod',
  
  // From ContentBulkService.ts
  ATREE_FRONTEND: 'https://atreefrontend.s3.ap-south-1.amazonaws.com',
  
  // From playerMetadata.js
  KNOWLG_PUBLIC: 'https://knowlg-public.s3.ap-south-1.amazonaws.com',
  
  // From multipart upload APIs
  DEFAULT_BUCKET: 'shiksha2', // Used as fallback in admin-app-repo
};

// Parse common S3 URLs
export const PARSED_S3_URLS = {
  SAAS_PROD: parseS3Url(COMMON_S3_URLS.SAAS_PROD),
  ATREE_FRONTEND: parseS3Url(COMMON_S3_URLS.ATREE_FRONTEND),
  KNOWLG_PUBLIC: parseS3Url(COMMON_S3_URLS.KNOWLG_PUBLIC),
};
