import React, { useEffect, useState } from "react";
import { TekdiQuMLPlayer } from "@namita_k/react-quml-player";
import { handleTelemetryEventQuml } from "../../services/TelemetryService";
import { createAssessmentTracking } from "../../services/PlayerService";
import { handleExitEvent } from "../utils/Helper";
import { Box } from "@mui/material";
interface PlayerConfigProps {
  playerConfig: any;
  relatedData?: any;
  configFunctionality?: any;
  mode?: string;
}
function MyAssessment({
  playerConfig,
  relatedData: { courseId, unitId, userId },
  configFunctionality,
  mode,
}: PlayerConfigProps) {
  const [newPlayerConfig, setPlayerConfig] = useState<any>();
  useEffect(() => {
    const isFromShortVideo = configFunctionality?.fromShortVideo;
    // Version 1.0.18 Fix: Separate API and Multipart endpoints
    setPlayerConfig({
      ...playerConfig,
      context: {
        ...playerConfig.context,
        mode: mode || playerConfig.context?.mode || "play",
      },
      config: {
        ...playerConfig.config,
        ...(isFromShortVideo ? {
          showStartPage: false,
          showSectionInfo: false,
        } : {}),
        host: process.env.NEXT_PUBLIC_MIDDLEWARE_URL,
        uploadConfig: {
          enabled: true,
          activeProvider: "sunbird",
          // Support for all question types
          uploadAllowForQuestionTypes: ["sa", "la", "mcq", "mmcq", "mtf", "asq"],
          providers: {
            sunbird: {
              // Action APIs (Create) go to your Middleware
              apiEndpoint: process.env.NEXT_PUBLIC_MIDDLEWARE_URL, 
              // Multipart APIs (Upload) go directly to Sunbird
              multipartApiEndpoint: "https://admin.sunbirdsaas.com", 
              s3BaseUrl: "https://saas-prod.s3-ap-south-1.amazonaws.com",
            }
          }
        },
      },
    });
  }, [playerConfig, mode]);

  if (!newPlayerConfig?.config?.host) {
    return <div>Loading...</div>;
  }

  const isFromShortVideo = configFunctionality?.fromShortVideo;

  return (
    <Box height="100%">
      <TekdiQuMLPlayer
        // @ts-ignore
        id={newPlayerConfig?.metadata?.identifier || newPlayerConfig?.context?.contentId}
        // @ts-ignore
        questionSetId={newPlayerConfig?.metadata?.identifier || newPlayerConfig?.context?.contentId}
        // @ts-ignore
        // height={isFromShortVideo ? "40%" : "100%"}
        // @ts-ignore
        width="100%"
        // @ts-ignore
        style={{ 
          // height: isFromShortVideo ? "40%" : "100%", 
          width: '100%', 
          border: 'none',
          backgroundColor: '#fff' 
        }}
        config={newPlayerConfig}
        onExit={() => {
          handleExitEvent(isFromShortVideo);
        }}
        getTelemetryEvents={async (event: any) => {
          console.log("Telemetry Events:", event);
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
    </Box>
  );
}
export default MyAssessment;