
export const downloadService = {
  startDownload: async (
    url: string,
    fileName: string,
    onProgress: (progress: number) => void
  ): Promise<boolean> => {
    console.log(`[API] Starting download for ${fileName} from ${url}`);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      // Progress monitoring if Content-Length is available
      const contentLength = response.headers.get("Content-Length");
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      
      if (total > 0 && response.body) {
        const reader = response.body.getReader();
        let loaded = 0;
        const chunks = [];
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          loaded += value.length;
          onProgress(Math.round((loaded / total) * 100));
        }
        
        const blob = new Blob(chunks);
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        // Fallback for cases where total size is unknown or body stream not accessible
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        onProgress(100);
      }
      return true; // Direct download success
    } catch (error) {
      console.warn("Direct download failed, falling back to opening in new tab:", error);
      // Fallback: Open in new tab if fetch fails (e.g., due to CORS)
      window.open(url, "_blank");
      return false; // Fallback success (not direct download)
    }
  },
};
