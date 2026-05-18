import { useState } from 'react';
import { downloadService } from './download.service';

interface UseDownloadProps {
  contentId: string;
  url?: string;
  fileName?: string;
}

export const useDownload = ({ contentId, url, fileName }: UseDownloadProps) => {
  const [downloading, setDownloading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);

  const startDownload = async () => {
    if (downloading || completed || !url) return;

    setDownloading(true);
    setProgress(0);

    try {
      const name = fileName || `content-${contentId}`;
      const isDirectDownload = await downloadService.startDownload(url, name, (p: number) => setProgress(p));
      if (isDirectDownload) {
        setCompleted(true);
      } else {
        // Reset state for fallback cases so button is usable again
        setProgress(0);
      }
    } catch (error) {
      console.error('Download failed', error);
      setProgress(0);
    } finally {
      setDownloading(false);
    }
  };

  return { downloading, progress, completed, startDownload };
};
