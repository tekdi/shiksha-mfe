import { NextApiRequest, NextApiResponse } from 'next';
import { getCookie } from '@workspace/utils/cookieHelper';
import { parseS3Url, getS3InfoFromEnv } from '@workspace/utils/s3Utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  
  if (method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = getCookie(req, 'authToken') || (process.env.AUTH_API_TOKEN as string);
  
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: Token is required' });
  }

  // Extract the path from the query parameters
  const { path } = req.query;
  const pathString = Array.isArray(path) ? path.join('/') : (path as string);
  
  if (!pathString) {
    return res.status(400).json({ error: 'Path parameter is required' });
  }

  const CLOUD_STORAGE_URL = process.env.NEXT_PUBLIC_CLOUD_STORAGE_URL;
  
  if (!CLOUD_STORAGE_URL) {
    return res.status(500).json({ error: 'Cloud storage URL not configured' });
  }

  // Parse S3 URL to get bucket info
  const s3Info = parseS3Url(CLOUD_STORAGE_URL);
  
  if (!s3Info.isS3Url) {
    return res.status(500).json({ error: 'Invalid S3 URL configuration' });
  }

  // Construct the S3 URL
  const s3Url = `${CLOUD_STORAGE_URL}/${pathString}`;
  
  console.log('S3 Assets Info:', {
    bucketName: s3Info.bucketName,
    region: s3Info.region,
    path: pathString,
    fullS3Url: s3Url,
    originalUrl: CLOUD_STORAGE_URL
  });

  try {
    // Forward the request to S3 with authentication headers
    const response = await fetch(s3Url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
        'Accept': req.headers['accept'] || '*/*',
        'Accept-Language': req.headers['accept-language'] || 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      console.error('S3 request failed:', response.status, response.statusText);
      return res.status(response.status).json({ 
        error: 'Failed to fetch from S3',
        status: response.status,
        statusText: response.statusText,
        bucketName: s3Info.bucketName,
        region: s3Info.region,
        path: pathString
      });
    }

    // Get the content type from the response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Set appropriate headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Copy other relevant headers
    const headersToForward = ['etag', 'last-modified', 'content-length'];
    headersToForward.forEach(header => {
      const value = response.headers.get(header);
      if (value) {
        res.setHeader(header, value);
      }
    });

    // Stream the response
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));

  } catch (error) {
    console.error('S3 Assets Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      bucketName: s3Info.bucketName,
      region: s3Info.region,
      path: pathString
    });
  }
}
