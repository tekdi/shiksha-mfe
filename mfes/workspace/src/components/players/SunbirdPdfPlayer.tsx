/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @nx/enforce-module-boundaries */
import "reflect-metadata";
import React, { useEffect } from "react";
import { useRef } from "react";
import { getTelemetryEvents, handleExitEvent } from "@workspace/utils/Helper";

interface PlayerConfigProps {
  playerConfig: any;
}

const SunbirdPdfPlayer = ({ playerConfig }: PlayerConfigProps) => {
  const sunbirdPdfPlayerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Dynamically load the Sunbird PDF Player script from CDN
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/@project-sunbird/sunbird-pdf-player-web-component@1.4.0/sunbird-pdf-player.js";
    script.async = true;
    document.body.appendChild(script);

    if (!document.getElementById("sunbird-pdf-player-css")) {
      const link = document.createElement("link");
      link.id = "sunbird-pdf-player-css";
      link.rel = "stylesheet";
      link.href =
        "https://cdn.jsdelivr.net/npm/@project-sunbird/sunbird-pdf-player-web-component@1.4.0/styles.css";
      document.head.appendChild(link);
    }
    const playerElement = sunbirdPdfPlayerRef.current;

    const handlePlayerEvent = (event: any) => {
      console.log("Player Event", event.detail);
      if (event?.detail?.edata?.type === "EXIT") {
        handleExitEvent();
      }
    };
    const handleTelemetryEvent = (event: any) => {
      console.log("Telemetry Event", event.detail);
      getTelemetryEvents(event.detail, "pdf");
    };

    // Ensure the script has loaded before adding event listeners
    script.onload = () => {
      playerElement?.addEventListener("playerEvent", handlePlayerEvent);
      playerElement?.addEventListener("telemetryEvent", handleTelemetryEvent);
    };

    return () => {
      playerElement?.removeEventListener("playerEvent", handlePlayerEvent);
      playerElement?.removeEventListener(
        "telemetryEvent",
        handleTelemetryEvent
      );
      document.body.removeChild(script);
      const pdfPlayerCss = document.getElementById("sunbird-pdf-player-css");
      if (pdfPlayerCss) document.head.removeChild(pdfPlayerCss);
    };
  }, []);

  return (
    <div className="player-grid">
      {/* @ts-ignore */}
      <sunbird-pdf-player
        player-config={JSON.stringify(playerConfig)}
        ref={sunbirdPdfPlayerRef}
      ></sunbird-pdf-player>
    </div>
  );
};

export default SunbirdPdfPlayer;
