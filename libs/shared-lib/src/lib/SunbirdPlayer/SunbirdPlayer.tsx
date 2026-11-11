import React from 'react';

interface SunbirdPlayerProps {
  identifier: string;
  playerConfig?: any;
  fromShortVideo?: boolean;
  PlayerComponent?: React.ComponentType<any>;
}

export const SunbirdPlayer: React.FC<SunbirdPlayerProps> = ({ 
  identifier, 
  playerConfig, 
  fromShortVideo, 
  PlayerComponent 
}) => {
  if (!PlayerComponent) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        No Player Component provided
      </div>
    );
  }

  return (
    <div style={{ height: '100%' }}>
      <PlayerComponent identifier={identifier} playerConfig={playerConfig} fromShortVideo={fromShortVideo} />
    </div>
  );
};

export default SunbirdPlayer;
