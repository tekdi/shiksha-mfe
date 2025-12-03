import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to proxy downloads with Content-Disposition: attachment
 * This forces browsers to download files instead of opening them in a new tab
 * 
 * Usage: /api/download?url=<encoded-url>&filename=<optional-filename>
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const assetUrl = searchParams.get('url');
    const filename = searchParams.get('filename');

    if (!assetUrl) {
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400 }
      );
    }

    // Decode the URL if it's encoded
    const decodedUrl = decodeURIComponent(assetUrl);

    // Fetch the asset from the original source
    const response = await fetch(decodedUrl, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch asset: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get the content type from the original response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Get the filename from query param, or extract from URL, or use default
    let downloadFilename = filename;
    if (!downloadFilename) {
      // Try to extract filename from URL
      const urlPath = new URL(decodedUrl).pathname;
      const urlFilename = urlPath.split('/').pop() || 'download';
      downloadFilename = urlFilename.includes('.') ? urlFilename : `${urlFilename}.mp4`;
    }

    // Get the file data as a blob
    const blob = await response.blob();

    // Return the file with Content-Disposition: attachment to force download
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${downloadFilename}"`,
        'Content-Length': blob.size.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Download API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

