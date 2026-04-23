import React, { useRef, useEffect, useState } from 'react';
import { getTelemetryEvents } from '../../services/TelemetryService';
import { handleExitEvent } from '../utils/Helper';

interface PlayerConfigProps {
  playerConfig: any;
  relatedData?: any;
  configFunctionality?: any;
}

const basePath = process.env.NEXT_PUBLIC_ASSETS_CONTENT || '/sbplayer';

const SunbirdPdfPlayer = ({
  playerConfig,
  relatedData: { courseId, unitId, userId },
  configFunctionality,
}: PlayerConfigProps) => {
  
  const sunbirdPdfPlayerRef = useRef<HTMLIFrameElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bottom, setBottom] = useState(10);

  useEffect(() => {
    const handleResize = () => {
      setBottom(window.matchMedia('(max-width: 655px)').matches ? 35 : 10);
    };

    window.addEventListener('resize', handleResize);

    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const playerElement: any = sunbirdPdfPlayerRef.current;
    if (playerElement) {
      const originalSrc = playerElement.src;
      playerElement.src = '';
      playerElement.src = originalSrc;

      const handleLoad = () => {
        setTimeout(() => {
          if (
            playerElement.contentWindow &&
            playerElement.contentWindow.setData
          ) {
            const pdfElement = document.createElement('sunbird-pdf-player');
            pdfElement.setAttribute(
              'player-config',
              JSON.stringify(playerConfig)
            );
            pdfElement.addEventListener('playerEvent', (event: any) => {
              if (event?.detail?.edata?.type === 'EXIT') {
                event.preventDefault();
                handleExitEvent();
              }
            });
            pdfElement.addEventListener(
              'telemetryEvent',
              async (event: any) => {
              
                try {
                  await getTelemetryEvents(event.detail, 'pdf', {
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
              myPlayer.appendChild(pdfElement);
            }
          }
        }, 200);
      };

      playerElement.addEventListener('load', handleLoad);

      return () => {
        playerElement.removeEventListener('load', handleLoad);
      };
    }
  }, [playerConfig, courseId, unitId, userId]);

  const toggleFullscreen = () => {
    const playerContainer: any =
      document.getElementById('pdf-player') ||
      document.getElementById('sunbird-pdf-player');
    if (!playerContainer) {
      alert('PDF player not found!');
      return;
    }

    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      if (playerContainer.requestFullscreen) {
        playerContainer.requestFullscreen();
      } else if (playerContainer.webkitRequestFullscreen) {
        playerContainer.webkitRequestFullscreen(); // Safari
      } else if (playerContainer.msRequestFullscreen) {
        playerContainer.msRequestFullscreen(); // IE
      } else {
        alert('Fullscreen not supported in this browser');
      }
      setIsFullscreen(true);
    }
  };

  return (
    <div
      id="pdf-player"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      <iframe
        ref={sunbirdPdfPlayerRef}
        id="contentPlayer"
        sunbird-pdf-player
        title="Content Player"
        src={`${basePath}/libs/sunbird-pdf-player/index.html`}
        aria-label="Content Player"
        style={{ border: 'none', width: '100%', height: '100%' }}
      ></iframe>
      <button
        onClick={toggleFullscreen}
        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        style={{
          position: 'absolute',
          bottom: '4px',
          left: '4px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '6px',
          transition: 'background 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseOver={(e) =>
          (e.currentTarget.style.background = 'rgba(0,0,0,0.1)')
        }
        onFocus={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.1)')}
        onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
        onBlur={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        {isFullscreen ? (
          // Exit Fullscreen Icon (improved)
          <svg
            width="25"
            height="25"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
            style={{ fill: 'black' }}
          >
            <rect x="0" fill="none" width="20" height="20" />

            <g>
              <path d="M3.4 2L2 3.4l2.8 2.8L3 8h5V3L6.2 4.8 3.4 2zm11.8 4.2L18 3.4 16.6 2l-2.8 2.8L12 3v5h5l-1.8-1.8zM4.8 13.8L2 16.6 3.4 18l2.8-2.8L8 17v-5H3l1.8 1.8zM17 12h-5v5l1.8-1.8 2.8 2.8 1.4-1.4-2.8-2.8L17 12z" />
            </g>
          </svg>
        ) : (
          // Enter Fullscreen Icon
          <svg
            width="25"
            height="25"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
            style={{ fill: 'black' }}
          >
            <rect x="0" fill="none" width="20" height="20" />

            <g>
              <path d="M7 2H2v5l1.8-1.8L6.5 8 8 6.5 5.2 3.8 7 2zm6 0l1.8 1.8L12 6.5 13.5 8l2.7-2.7L18 7V2h-5zm.5 10L12 13.5l2.7 2.7L13 18h5v-5l-1.8 1.8-2.7-2.8zm-7 0l-2.7 2.7L2 13v5h5l-1.8-1.8L8 13.5 6.5 12z" />
            </g>
          </svg>
        )}
      </button>
    </div>
  );
};

export default SunbirdPdfPlayer;
