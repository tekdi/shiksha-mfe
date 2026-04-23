/* eslint-disable @nx/enforce-module-boundaries */
import React from "react";
import SunbirdPdfPlayer from "@workspace/components/players/SunbirdPdfPlayer";
import SunbirdVideoPlayer from "@workspace/components/players/SunbirdVideoPlayer";
import SunbirdEpubPlayer from "@workspace/components/players/SunbirdEpubPlayer";
import SunbirdQuMLPlayer from "@workspace/components/players/SunbirdQuMLPlayer";
interface PlayerProps {
  playerConfig: any;
}

const Players = ({ playerConfig }: PlayerProps) => {
  const mimeType = playerConfig?.metadata?.mimeType;
  switch (mimeType) {
    case "application/pdf":
      return <SunbirdPdfPlayer playerConfig={playerConfig} />;
    case "video/webm":
      return <SunbirdVideoPlayer playerConfig={playerConfig} />;
    case "video/mp4":
      return <SunbirdVideoPlayer playerConfig={playerConfig} />;
    case "application/vnd.sunbird.questionset":
      return <SunbirdQuMLPlayer playerConfig={playerConfig} />;
    case "application/epub":
      return <SunbirdEpubPlayer playerConfig={playerConfig} />;
    default:
      return <div>Unsupported media type</div>;
  }
};

export default Players;
