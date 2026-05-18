import React from 'react';
import dynamic from 'next/dynamic';

const Player = dynamic(() => import('../../../../../mfes/players/src/pages/play'), {
  ssr: false,
});

interface SunbirdPlayerProps {
  identifier: string;
  playerConfig?: any;
  fromShortVideo?: boolean;
}

export const SunbirdPlayer: React.FC<SunbirdPlayerProps> = ({ identifier, playerConfig, fromShortVideo }) => {
  return (
    <div style={{ height: '100%' }}>
      <Player identifier={identifier} playerConfig={playerConfig} fromShortVideo={fromShortVideo} />
    </div>
  );
};

export default SunbirdPlayer;
