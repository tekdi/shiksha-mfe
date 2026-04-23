/* eslint-disable @typescript-eslint/ban-ts-comment */
import "reflect-metadata";
import React, { useEffect } from "react";
import { useRef } from "react";
import $ from "jquery";
// eslint-disable-next-line @nx/enforce-module-boundaries
import { getTelemetryEvents, handleExitEvent } from "@workspace/utils/Helper";
interface PlayerConfigProps {
  playerConfig: any;
}

const SunbirdQuMLPlayer = ({ playerConfig }: PlayerConfigProps) => {
  const SunbirdQuMLPlayerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.$ = window.jQuery = $;
      window.questionListUrl = "/api/question/v2/list";
    }

    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/@tekdi/sunbird-quml-player-web-component@5.0.0-beta.6/sunbird-quml-player.js";
    script.async = true;
    document.body.appendChild(script);

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://cdn.jsdelivr.net/npm/@tekdi/sunbird-quml-player-web-component@5.0.0-beta.6/styles.css";
    document.head.appendChild(link);

    const playerElement = SunbirdQuMLPlayerRef.current;

    const handlePlayerEvent = (event: any) => {
      console.log("Player Event", event.detail);
      if (event?.detail?.edata?.type === "EXIT") {
        handleExitEvent();
      }
    };
    const handleTelemetryEvent = (event: any) => {
      console.log("Telemetry Event", event.detail);
      getTelemetryEvents(event.detail, "quml");
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
    };
  }, []);

  return (
    <div className="player-grid">
      {/* @ts-ignore */}
      <sunbird-quml-player
        player-config={JSON.stringify(playerConfig)}
        ref={SunbirdQuMLPlayerRef}
      ></sunbird-quml-player>
    </div>
  );
};

export default SunbirdQuMLPlayer;
