import React from "react";
interface PlayerProps {
  playerConfig: any;
  relatedData?: any;
  configFunctionality?: boolean;
  mode?: string;
}
const SunbirdEcmlPlayer = ({
  playerConfig,
  relatedData,
  configFunctionality,
  mode,
}: PlayerProps) => {
  // const iframeUrl = `${process.env.NEXT_PUBLIC_ECML_PLAYER_URL}?identifier=${playerConfig.context.contentId}.zip`;
  const iframeUrl = `${process.env.NEXT_PUBLIC_ECML_PLAYER_URL}?identifier=${playerConfig.context.contentId}`;

  return (
    <div>
      <iframe
        id="contentPlayer"
        title="Content Player"
        // src={`/sbplayer/libs/sunbird-content-player/preview/preview.html?webview=true`}
        src={iframeUrl}
        frameBorder="0"
        width="100%"
        height="500"
        allowFullScreen
      />
    </div>
  );
};

export default SunbirdEcmlPlayer;
