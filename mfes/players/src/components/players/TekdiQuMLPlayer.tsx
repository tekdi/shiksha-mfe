import React, { useEffect, useState } from "react";
import { QumlPlayer } from "@tekdi/react-quml-player";
import { handleTelemetryEventQuml } from "../../services/TelemetryService";
import { createAssessmentTracking } from "../../services/PlayerService";
import { handleExitEvent } from "../utils/Helper";

interface PlayerConfigProps {
  playerConfig: any;
  relatedData?: any;
  configFunctionality?: boolean;
}

function MyAssessment({
  playerConfig,
  relatedData: { courseId, unitId, userId },
  configFunctionality,
}: PlayerConfigProps) {
  const [newPlayerConfig, setPlayerConfig] = useState<any>();

  useEffect(() => {
    setPlayerConfig({
      ...playerConfig,
      config: {
        ...playerConfig.config,
        host: process.env.NEXT_PUBLIC_MIDDLEWARE_URL,
        listApiEndpoint: "/api/question/v2/list",
      },
    });
  }, [playerConfig]);

  if (!newPlayerConfig?.config?.host) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <QumlPlayer
        config={newPlayerConfig}
        onExit={() => {
          handleExitEvent();
        }}
        getTelemetryEvents={async (event: any) => {
          console.log("Telemetry Events:sagar", event);
          try {
            if (event?.maxScore !== undefined) {
              createAssessmentTracking({
                ...event,
                courseId,
                unitId,
                userId,
              });
            } else {
              handleTelemetryEventQuml(
                { data: event },
                {
                  courseId,
                  unitId,
                  userId,
                  configFunctionality,
                }
              );
            }
          } catch (error) {
            console.error("Error submitting assessment:", error);
          }
        }}
      />
    </>
  );
}

export default MyAssessment;
