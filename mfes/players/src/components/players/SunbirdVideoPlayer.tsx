/* eslint-disable no-useless-escape */
import React, { useRef, useEffect } from 'react';
import { getTelemetryEvents } from '../../services/TelemetryService';
import { handleExitEvent } from '../utils/Helper';

interface PlayerConfigProps {
  playerConfig: any;
  relatedData?: any;
  configFunctionality?: any;
}

const basePath = process.env.NEXT_PUBLIC_ASSETS_CONTENT || '/sbplayer';

/**
 * Intercepts download attempts from the iframe to force downloads instead of opening tabs
 * Uses multiple interception methods to catch all download attempts
 */
const setupDownloadInterceptor = (iframe: HTMLIFrameElement, artifactUrl?: string) => {
  if (!iframe.contentWindow || !iframe.contentDocument) return;

  const downloadViaAPI = (url: string) => {
    const encodedUrl = encodeURIComponent(url);
    const filename = url.split('/').pop()?.split('?')[0] || 'download';
    const apiDownloadUrl = `/api/download?url=${encodedUrl}&filename=${encodeURIComponent(filename)}`;
    
    // Create a link in the parent window to trigger download
    const link = document.createElement('a');
    link.href = apiDownloadUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
  };

  // Method 1: Override window.open in iframe
  try {
    const originalOpen = iframe.contentWindow.open;
    iframe.contentWindow.open = function(url: string, target?: string, features?: string) {
      if (url && (artifactUrl || url.match(/\.(mp4|mp3|wav|webm|pdf|epub|avi|mov)(\?|$)/i))) {
        const downloadUrl = artifactUrl || url;
        downloadViaAPI(downloadUrl);
        return null;
      }
      return originalOpen.call(this, url, target, features);
    };
  } catch (e) {
    console.warn('Could not override window.open:', e);
  }

  // Method 2: Inject script into iframe to intercept downloads
  try {
    const script = iframe.contentDocument.createElement('script');
    script.textContent = `
      (function() {
        const artifactUrl = ${artifactUrl ? `"${artifactUrl}"` : 'null'};
        
        // Override window.open
        const originalOpen = window.open;
        window.open = function(url, target, features) {
          if (url && (artifactUrl || /\.(mp4|mp3|wav|webm|pdf|epub|avi|mov)(\\?|$)/i.test(url))) {
            const downloadUrl = artifactUrl || url;
            const encodedUrl = encodeURIComponent(downloadUrl);
            const filename = downloadUrl.split('/').pop().split('?')[0] || 'download';
            const apiUrl = '/api/download?url=' + encodedUrl + '&filename=' + encodeURIComponent(filename);
            
            // Post message to parent to trigger download
            if (window.parent && window.parent !== window) {
              window.parent.postMessage({ type: 'DOWNLOAD_FILE', url: apiUrl, filename: filename }, '*');
            }
            return null;
          }
          return originalOpen.call(this, url, target, features);
        };
        
        // Intercept anchor clicks with download attributes or media files
        document.addEventListener('click', function(e) {
          const target = e.target;
          if (target && target.tagName === 'A') {
            const href = target.getAttribute('href') || target.href;
            if (href && /\.(mp4|mp3|wav|webm|pdf|epub|avi|mov)(\\?|$)/i.test(href)) {
              e.preventDefault();
              e.stopPropagation();
              const downloadUrl = artifactUrl || href;
              const encodedUrl = encodeURIComponent(downloadUrl);
              const filename = downloadUrl.split('/').pop().split('?')[0] || 'download';
              const apiUrl = '/api/download?url=' + encodedUrl + '&filename=' + encodeURIComponent(filename);
              
              if (window.parent && window.parent !== window) {
                window.parent.postMessage({ type: 'DOWNLOAD_FILE', url: apiUrl, filename: filename }, '*');
              }
            }
          }
        }, true);
      })();
    `;
    iframe.contentDocument.head.appendChild(script);
  } catch (e) {
    console.warn('Could not inject download interceptor script:', e);
  }

  // Method 3: Listen for postMessage from iframe
  const handleMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'DOWNLOAD_FILE') {
      const link = document.createElement('a');
      link.href = event.data.url;
      link.download = event.data.filename || 'download';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
    }
  };
  
  window.addEventListener('message', handleMessage);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('message', handleMessage);
  };
};

const SunbirdVideoPlayer = ({
  playerConfig,
  relatedData: { courseId, unitId, userId },
  configFunctionality,
}: PlayerConfigProps) => {
  const sunbirdVideoPlayerRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const playerElement: any = sunbirdVideoPlayerRef.current;
    let cleanupInterceptor: (() => void) | null = null;

    if (playerElement) {
      const originalSrc = playerElement.src;
      playerElement.src = '';
      playerElement.src = originalSrc;

      const handleLoad = () => {
        // Set up download interceptor with multiple attempts to ensure it works
        const artifactUrl = playerConfig?.metadata?.artifactUrl;
        
        // Try immediately
        if (artifactUrl && playerElement.contentDocument) {
          cleanupInterceptor = setupDownloadInterceptor(playerElement, artifactUrl) ?? null;
        } else {
          cleanupInterceptor = null;
        }

        // Also try after a delay in case content loads asynchronously
        setTimeout(() => {
          if (artifactUrl && playerElement.contentDocument && !cleanupInterceptor) {
            const result = setupDownloadInterceptor(playerElement, artifactUrl);
            if (typeof result === 'function') {
              cleanupInterceptor = result;
            }
          }
        }, 500);

        setTimeout(() => {
          if (
            playerElement.contentWindow &&
            playerElement.contentWindow.setData
          ) {
            // playerElement.contentWindow.setData(playerConfig);
            const videoElement = document.createElement('sunbird-video-player');
            videoElement.setAttribute(
              'player-config',
              JSON.stringify(playerConfig)
            );
            videoElement.addEventListener('playerEvent', (event: any) => {
              if (event?.detail?.edata?.type === 'EXIT') {
                event.preventDefault();
                handleExitEvent();
              }
            });
            videoElement.addEventListener(
              'telemetryEvent',
              async (event: any) => {
                console.log('On telemetryEvent', event);
                try {
                  await getTelemetryEvents(event.detail, 'video', {
                    courseId,
                    unitId,
                    userId,
                    configFunctionality,
                  });
                } catch (error) {
                  console.error('Error submitting assessment:', error);
                }
              }
            );

            const myPlayer =
              playerElement.contentDocument.getElementById('my-player');
            if (myPlayer) {
              myPlayer.appendChild(videoElement);
            }
          }
        }, 200);
      };

      playerElement.addEventListener('load', handleLoad);

      return () => {
        playerElement.removeEventListener('load', handleLoad);
        if (cleanupInterceptor) {
          cleanupInterceptor();
        }
      };
    }
  }, [playerConfig]);

  return (
    <iframe
      ref={sunbirdVideoPlayerRef}
      id="contentPlayer"
      title="Content Player"
      src={`${basePath}/libs/sunbird-video-player/index.html`}
      aria-label="Content Player"
      style={{ border: 'none', aspectRatio: `16 / 9` }}
      width="100%"
    ></iframe>
  );
};

export default SunbirdVideoPlayer;
