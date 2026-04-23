/* eslint-disable @nx/enforce-module-boundaries */
import { getTelemetryEvents, handleExitEvent } from '@workspace/utils/Helper';
import { Height } from '@mui/icons-material';
import React, { useEffect, useRef, useState } from 'react';
import styles from './SunbirdVideoPlayer.module.css';

interface PlayerConfigProps {
  playerConfig: any;
}

const SunbirdVideoPlayer = ({ playerConfig }: PlayerConfigProps) => {
  const sunbirdVideoPlayerRef = useRef<HTMLDivElement | null>(null);
  const [playerLoaded, setPlayerLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inject CSS styles for sunbird-video-player
  useEffect(() => {
    const styleId = 'sunbird-video-player-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        sunbird-video-player {
          width: 100% !important;
          height: 100% !important;
          min-height: 400px !important;
          display: block !important;
          position: relative !important;
        }
        sunbird-video-player video {
          width: 100% !important;
          height: 100% !important;
          object-fit: contain !important;
          background-color: #000 !important;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        sunbird-video-player .video-js {
          width: 100% !important;
          height: 100% !important;
          min-height: 400px !important;
          background-color: #000 !important;
        }
        sunbird-video-player .vjs-tech {
          width: 100% !important;
          height: 100% !important;
          object-fit: contain !important;
          display: block !important;
          visibility: visible !important;
        }
        sunbird-video-player .vjs-tech[src] {
          display: block !important;
          visibility: visible !important;
        }
        sunbird-video-player video[src] {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      const style = document.getElementById(styleId);
      if (style) {
        document.head.removeChild(style);
      }
    };
  }, []);

  useEffect(() => {
    console.log('SunbirdVideoPlayer: Initializing with config:', playerConfig);

    const script = document.createElement('script');
    script.src =
      'https://cdn.jsdelivr.net/npm/@project-sunbird/sunbird-video-player-web-component@1.2.5/sunbird-video-player.js';
    script.async = true;
    document.body.appendChild(script);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://cdn.jsdelivr.net/npm/@project-sunbird/sunbird-video-player-web-component@1.2.5/styles.css';
    document.head.appendChild(link);

    const playerElement = sunbirdVideoPlayerRef.current;

    const handlePlayerEvent = (event: any) => {
      console.log('Player Event', event.detail);
      if (event?.detail?.type === 'EXIT') {
        handleExitEvent();
      }
    };

    const handleTelemetryEvent = (event: any) => {
      console.log('Telemetry Event', event.detail);
      getTelemetryEvents(event.detail, 'video');
    };

    // Suppress the deprecated videojs.plugin warning
    const originalWarn = console.warn;
    console.warn = (...args) => {
      if (
        args[0] &&
        typeof args[0] === 'string' &&
        args[0].includes('videojs.plugin() is deprecated')
      ) {
        console.log('Suppressed deprecated videojs.plugin warning');
        return; // Suppress this specific warning
      }
      originalWarn.apply(console, args);
    };

    script.onload = () => {
      console.log('SunbirdVideoPlayer: Script loaded successfully');
      setPlayerLoaded(true);

      playerElement?.addEventListener('playerEvent', handlePlayerEvent);
      playerElement?.addEventListener('telemetryEvent', handleTelemetryEvent);

      // Restore console.warn after script loads
      console.warn = originalWarn;

      // Additional debugging for video element
      setTimeout(() => {
        const videoElement = playerElement?.querySelector('video');
        if (videoElement) {
          console.log('Video element found:', videoElement);
          console.log('Video src:', videoElement.src);
          console.log('Video readyState:', videoElement.readyState);
        } else {
          console.warn('No video element found in player');
        }
      }, 1000);
    };

    script.onerror = () => {
      console.error('Failed to load sunbird video player script');
      setError('Failed to load video player');
      console.warn = originalWarn;
    };

    return () => {
      playerElement?.removeEventListener('playerEvent', handlePlayerEvent);
      playerElement?.removeEventListener(
        'telemetryEvent',
        handleTelemetryEvent
      );

      // Restore console.warn
      console.warn = originalWarn;

      // Remove the script and CSS link
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, [playerConfig]);

  if (error) {
    return (
      <div className={styles.playerError}>
        <div>
          <p>Error loading video player: {error}</p>
          <p>Video URL: {playerConfig?.metadata?.artifactUrl}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.player}>
      {!playerLoaded && (
        <div className={styles.loadingOverlay}>Loading video player...</div>
      )}
      <div className={styles.videoContainer}>
        <sunbird-video-player
          player-config={JSON.stringify(playerConfig)}
          ref={sunbirdVideoPlayerRef}
          style={{
            width: '100%',
            height: '100%',
            minHeight: '400px',
            display: 'block',
            position: 'relative',
          }}
        ></sunbird-video-player>
      </div>
    </div>
  );
};

export default SunbirdVideoPlayer;
