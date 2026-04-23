/**
 * Utility functions to download content files (MP4, MP3, PDF, etc.)
 * Forces download instead of opening in a new tab
 */

/**
 * Downloads a file by fetching it as a blob and creating a download link
 * This works for same-origin and CORS-enabled URLs
 */
export const downloadFile = async (
  url: string,
  filename?: string
): Promise<void> => {
  try {
    // Extract filename from URL if not provided
    if (!filename) {
      const urlPath = new URL(url).pathname;
      filename = urlPath.split('/').pop() || 'download';
      // Ensure filename has extension
      if (!filename.includes('.')) {
        // Try to detect extension from content type or default to mp4
        filename = `${filename}.mp4`;
      }
    }

    // Fetch the file
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    // Convert to blob
    const blob = await response.blob();

    // Create a temporary download link
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Error downloading file:', error);
    // Fallback: open in new tab if download fails
    window.open(url, '_blank');
  }
};

/**
 * Downloads a file using the API proxy route
 * This is more reliable for cross-origin URLs and ensures proper headers
 */
export const downloadFileViaAPI = (
  assetUrl: string,
  filename?: string
): void => {
  try {
    // Encode the URL for the API route
    const encodedUrl = encodeURIComponent(assetUrl);
    const apiUrl = `/api/download?url=${encodedUrl}${
      filename ? `&filename=${encodeURIComponent(filename)}` : ''
    }`;

    // Create a temporary link to trigger download
    const link = document.createElement('a');
    link.href = apiUrl;
    link.download = filename || 'download';
    link.style.display = 'none';

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
  } catch (error) {
    console.error('Error downloading file via API:', error);
    // Fallback: open in new tab if download fails
    window.open(assetUrl, '_blank');
  }
};

/**
 * Smart download function that tries API first, falls back to direct download
 */
export const smartDownload = async (
  url: string,
  filename?: string
): Promise<void> => {
  // Try API route first (more reliable for cross-origin)
  try {
    downloadFileViaAPI(url, filename);
  } catch (error) {
    console.warn('API download failed, trying direct download:', error);
    // Fallback to direct download
    await downloadFile(url, filename);
  }
};

