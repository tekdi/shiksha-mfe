import React, { useRef, useEffect } from "react";
import { getTelemetryEvents } from "../../services/TelemetryService";

interface PlayerProps {
  playerConfig: any;
  relatedData?: any;
  configFunctionality?: boolean;
}

const basePath = process.env.NEXT_PUBLIC_ASSETS_CONTENT || "/sbplayer";

const V1Player = ({
  playerConfig,
  relatedData: { courseId, unitId, userId },
  configFunctionality,
}: PlayerProps) => {
  const previewRef = useRef<HTMLIFrameElement | null>(null);
  console.log("V1Player playerConfig", playerConfig);
  useEffect(() => {
    const preview: any = previewRef.current;

    if (preview) {
      const originalSrc = preview.src;
      preview.src = "";
      preview.src = originalSrc;

      const handleLoad = () => {
        setTimeout(() => {
          if (
            preview.contentWindow &&
            preview.contentWindow.initializePreview
          ) {
            preview.contentWindow.initializePreview(playerConfig);
          }

          preview.addEventListener(
            "renderer:telemetry:event",
            async (event: any) => {
              console.log("V1 player telemetry event ===>", event);
              if (event.detail.telemetryData.eid === "START") {
                console.log("V1 player telemetry START event ===>", event);
              }
              if (event.detail.telemetryData.eid === "END") {
                console.log("V1 player telemetry END event ===>", event);
              }

              await getTelemetryEvents(event.detail.telemetryData, "v1", {
                courseId,
                unitId,
                userId,
                configFunctionality,
              });
            }
          );
        }, 100);
      };

      preview.addEventListener("load", handleLoad);

      return () => {
        preview.removeEventListener("load", handleLoad);

        // Reset iframe to prevent residual styles or memory leaks
        // Commenting below code - Content Preview is only work due to below code
        // if (preview) {
        //   preview.src = "";
        // }
      };
    }
  }, [playerConfig]);
  console.log(
    "V1Player basePath",
    `${basePath}/libs/sunbird-content-player/preview/preview.html?webview=true`
  );
  return (
    <iframe
      ref={previewRef}
      id="contentPlayer"
      title="Content Player"
      //offline android app player
      src={`${basePath}/libs/sunbird-content-player/preview/preview.html?webview=true`}
      //online cdn player
      // src={`/content/preview/preview.html?webview=true`}
      aria-label="Content Player"
      style={{ border: "none" }}
      width={"100%"}
      height={"100%"}
    ></iframe>
  );
};

export default V1Player;
