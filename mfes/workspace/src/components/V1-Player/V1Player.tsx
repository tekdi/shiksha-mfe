/* eslint-disable @nx/enforce-module-boundaries */
import { getTelemetryEvents } from '@workspace/utils/Helper';
import React, { useRef, useEffect, useState } from 'react';

interface PlayerProps {
  playerConfig: any;
}

const V1Player = ({ playerConfig }: PlayerProps) => {
  const previewRef = useRef<HTMLIFrameElement | null>(null);
  const [isLandscape, setIsLandscape] = useState(false);

  // Detect orientation
  const handleResize = () => {
    const landscape = window.innerWidth > window.innerHeight;
    setIsLandscape(landscape);
  };

  useEffect(() => {
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const preview: any = previewRef.current;

    if (preview) {
      const originalSrc = preview.src;
      preview.src = '';
      preview.src = originalSrc;

      const handleLoad = () => {
        setTimeout(() => {
          if (
            preview.contentWindow &&
            preview.contentWindow.initializePreview
          ) {
            if (
              playerConfig.metadata.mimeType ===
              'application/vnd.ekstep.ecml-archive'
            ) {
              playerConfig.data = playerConfig.metadata?.body;
              playerConfig.config.overlay = {};
            }
            preview.contentWindow.initializePreview(playerConfig);
          }

          preview.contentWindow.addEventListener('message', (event: any) => {
            console.log('V1 player event', event);
          });

          preview.addEventListener('renderer:telemetry:event', (event: any) => {
            console.log('V1 player telemetry event ===>', event);
            if (event.detail.telemetryData.eid === 'START') {
              console.log('V1 player telemetry START event ===>', event);
            }
            if (event.detail.telemetryData.eid === 'END') {
              console.log('V1 player telemetry END event ===>', event);
            }
            getTelemetryEvents(event.detail.telemetryData, 'v1');
          });
        }, 100);
      };

      preview.addEventListener('load', handleLoad);

      return () => {
        preview.removeEventListener('load', handleLoad);
      };
    }
  }, [playerConfig]);

  return (
    <div
      style={{
        width: '100%',
        height: isLandscape ? '100vh' : 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        padding: isLandscape ? 0 : '1rem',
        backgroundColor: '#f9f9f9',
        boxSizing: 'border-box',
      }}
    >
      <iframe
        ref={previewRef}
        id="contentPlayer"
        title="Content Player"
        src="/content/preview/preview.html?webview=true"
        aria-label="Content Player"
        style={{
          width: '100%',
          height: isLandscape ? '100vh' : '600px',
          border: 'none',
        }}
      ></iframe>
    </div>
  );
};

export default V1Player;
