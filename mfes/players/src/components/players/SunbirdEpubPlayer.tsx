import React, { useRef, useEffect } from 'react';
import { getTelemetryEvents } from '../../services/TelemetryService';
import { handleExitEvent } from '../utils/Helper';

interface PlayerConfigProps {
  playerConfig: any;
  relatedData?: any;
  configFunctionality?: any;
  mode?: string;
}

const basePath = process.env.NEXT_PUBLIC_ASSETS_CONTENT || '/sbplayer';

const SunbirdEpubPlayer = ({
  playerConfig,
  relatedData: { courseId, unitId, userId },
  configFunctionality,
  mode,
}: PlayerConfigProps) => {
  const sunbirdEpubPlayerRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const playerElement: any = sunbirdEpubPlayerRef.current;
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
            // playerElement.contentWindow.setData(playerConfig);
            const epubElement = document.createElement('sunbird-epub-player');
            epubElement.setAttribute(
              'player-config',
              JSON.stringify(playerConfig)
            );
            epubElement.addEventListener('playerEvent', (event: any) => {
              if (event?.detail?.edata?.type === 'EXIT') {
                event.preventDefault();
                handleExitEvent();
              }
            });
            epubElement.addEventListener(
              'telemetryEvent',
              async (event: any) => {
                console.log('On telemetryEvent', event);
                try {
                  await getTelemetryEvents(event.detail, 'epub', {
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
              myPlayer.appendChild(epubElement);
            }
          }
        }, 200);
      };

      playerElement.addEventListener('load', handleLoad);

      return () => {
        playerElement.removeEventListener('load', handleLoad);
      };
    }
  }, [playerConfig]);

  return (
    <iframe
      ref={sunbirdEpubPlayerRef}
      id="contentPlayer"
      title="Content Player"
      src={`${basePath}/libs/sunbird-epub-player/index.html?webview=true`}
      aria-label="Content Player"
      style={{ border: 'none' }}
      width={'100%'}
      height={'100%'}
    ></iframe>
  );
};

export default SunbirdEpubPlayer;
