/* eslint-disable @nx/enforce-module-boundaries */
import dynamic from 'next/dynamic';
import React from 'react';

const SunbirdPdfPlayer = dynamic(
  () => import('@workspace/components/players/SunbirdPdfPlayer'),
  {
    ssr: false,
  }
);

const SunbirdVideoPlayer = dynamic(
  () => import('@workspace/components/players/SunbirdVideoPlayer'),
  {
    ssr: false,
  }
);
const SunbirdEpubPlayer = dynamic(
  () => import('@workspace/components/players/SunbirdEpubPlayer'),
  {
    ssr: false,
  }
);

const SunbirdQuMLPlayer = dynamic(
  () => import('@workspace/components/players/SunbirdQuMLPlayer'),
  {
    ssr: false,
  }
);

const SunbirdV1Player = dynamic(
  () => import('@workspace/components/V1-Player/V1Player'),
  {
    ssr: false,
  }
);

interface PlayerProps {
  'player-config': any;
  identifier: string;
}

const SunbirdPlayers = ({ 'player-config': playerConfig }: PlayerProps) => {
  console.log('workspace playerconfig', playerConfig);

  const mimeType = playerConfig?.metadata?.mimeType;
  console.log('Player mimeType ==>', mimeType);
  switch (mimeType) {
    case 'application/pdf':
      return <SunbirdPdfPlayer playerConfig={playerConfig} />;
    case 'video/mp4':
      return <SunbirdVideoPlayer playerConfig={playerConfig} />;
    case 'application/vnd.sunbird.questionset':
      return <SunbirdQuMLPlayer playerConfig={playerConfig} />;
    case 'application/epub':
      return <SunbirdEpubPlayer playerConfig={playerConfig} />;
    case 'application/vnd.ekstep.h5p-archive':
    case 'application/vnd.ekstep.html-archive':
    case 'video/youtube':
    case 'video/x-youtube':
    case 'application/vnd.ekstep.ecml-archive':
      // return <SunbirdV1Player playerConfig={playerConfig} />;
      return <SunbirdV1Player playerConfig={playerConfig} />;
    default:
      return <div>Unsupported media type</div>;
  }
};

export default SunbirdPlayers;
