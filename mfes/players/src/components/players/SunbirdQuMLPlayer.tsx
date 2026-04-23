import "reflect-metadata";
import React, { useEffect, useRef } from "react";
// import axios from 'axios';
import { handleTelemetryEventQuml } from "../../services/TelemetryService";
import { handleExitEvent } from "../utils/Helper";
import { createAssessmentTracking } from "../../services/PlayerService";

interface PlayerConfigProps {
  playerConfig: any;
  relatedData?: any;
  configFunctionality?: boolean;
}

const basePath = process.env.NEXT_PUBLIC_ASSETS_CONTENT || "/sbplayer";

const SunbirdQuMLPlayer = ({
  playerConfig,
  relatedData: { courseId, unitId, userId },
  configFunctionality,
}: PlayerConfigProps) => {
  const SunbirdQuMLPlayerRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const playerElement: any = SunbirdQuMLPlayerRef.current;
    if (playerElement) {
      const originalSrc = playerElement.src;
      playerElement.src = "";
      playerElement.src = originalSrc;

      const handleLoad = async () => {
        console.log("QuML Player loading with config:", playerConfig);

        // Validate the configuration
        if (
          !playerConfig?.metadata?.maxScore &&
          !playerConfig?.metadata?.totalScore
        ) {
          console.warn("QuML Player: No maxScore found, setting default");
        }

        setTimeout(() => {
          if (
            playerElement.contentWindow &&
            playerElement.contentWindow.setData
          ) {
            // Sanitize and validate questions data
            const rawQuestions =
              playerConfig?.data?.questions ||
              playerConfig?.metadata?.questions ||
              [];
            console.log("Raw questions data:", rawQuestions);

            const sanitizedQuestions = rawQuestions.map(
              (q: any, index: number) => {
                // Log each question to identify problematic properties
                console.log(`Processing question ${index}:`, q);

                const sanitized = {
                  identifier: q.identifier || `question_${index}`,
                  name: q.name || q.title || `Question ${index + 1}`,
                  objectType: q.objectType || "AssessmentItem",
                  status: q.status || "Live",
                  mimeType: q.mimeType || "application/vnd.ekstep.question",
                  primaryCategory: q.primaryCategory || "MCQ",
                  language: q.language || ["English"],
                  title: q.title || q.name || `Question ${index + 1}`,
                  description: q.description || "",
                  category: q.category || "MCQ",
                  // Ensure all string properties are strings and not undefined/null
                  ...Object.fromEntries(
                    Object.entries(q).map(([key, value]) => {
                      const sanitizedValue =
                        value === null || value === undefined
                          ? ""
                          : String(value);
                      return [key, sanitizedValue];
                    })
                  ),
                };

                console.log(`Sanitized question ${index}:`, sanitized);
                return sanitized;
              }
            );

            // Set up the questions data
            const questionsData = {
              questions_data: {
                result: {
                  questions: sanitizedQuestions,
                },
              },
            };

            // Ensure we have valid configuration values
            const maxScore =
              playerConfig?.metadata?.maxScore ||
              playerConfig?.metadata?.totalScore ||
              sanitizedQuestions.length;

            const totalQuestions =
              playerConfig?.metadata?.totalQuestions ||
              sanitizedQuestions.length;

            // Set up the QuML player configuration
            const qumlPlayerObject = {
              qumlPlayerConfig: {
                ...playerConfig,
                config: {
                  ...playerConfig?.data?.config,
                  maxScore: maxScore,
                  totalQuestions: totalQuestions,
                  allowSkip: String(
                    playerConfig?.metadata?.allowSkip !== false
                  ),
                  showFeedback: String(
                    playerConfig?.metadata?.showFeedback !== false
                  ),
                  shuffleQuestions: String(
                    playerConfig?.metadata?.shuffleQuestions || false
                  ),
                  shuffleOptions: String(
                    playerConfig?.metadata?.shuffleOptions || false
                  ),
                },
              },
              questionListUrl: `${process.env.NEXT_PUBLIC_MIDDLEWARE_URL}/api/question/v2/list`,
            };

            console.log("Setting QuML localStorage data:", questionsData);
            console.log("Setting QuML player object:", qumlPlayerObject);

            try {
              playerElement.contentWindow?.localStorage.setItem(
                "questions_data",
                JSON.stringify(questionsData)
              );
              playerElement.contentWindow?.localStorage.setItem(
                "qumlPlayerObject",
                JSON.stringify(qumlPlayerObject)
              );

              // Set the data with proper configuration
              const finalConfig = {
                ...playerConfig,
                config: qumlPlayerObject.qumlPlayerConfig.config,
                // Ensure all string properties in metadata are properly defined
                metadata: {
                  ...playerConfig.metadata,
                  name: playerConfig.metadata?.name || "Question Set",
                  title:
                    playerConfig.metadata?.title ||
                    playerConfig.metadata?.name ||
                    "Question Set",
                  description: playerConfig.metadata?.description || "",
                  language: playerConfig.metadata?.language || ["English"],
                  primaryCategory:
                    playerConfig.metadata?.primaryCategory || "Question Set",
                  // Ensure boolean properties are strings for QuML player
                  allowSkip: String(
                    playerConfig?.metadata?.allowSkip !== false
                  ),
                  showFeedback: String(
                    playerConfig?.metadata?.showFeedback !== false
                  ),
                  shuffleQuestions: String(
                    playerConfig?.metadata?.shuffleQuestions || false
                  ),
                  shuffleOptions: String(
                    playerConfig?.metadata?.shuffleOptions || false
                  ),
                },
              };

              console.log("Calling setData with:", finalConfig);
              playerElement.contentWindow.setData(finalConfig);
            } catch (error) {
              console.error("Error setting QuML player data:", error);
            }
          } else {
            console.error(
              "QuML Player iframe not ready or setData function not available"
            );
          }
        }, 200);
      };

      playerElement.addEventListener("load", handleLoad);

      return () => {
        playerElement.removeEventListener("load", handleLoad);
      };
    }
  }, [playerConfig]);

  React.useEffect(() => {
    const handleMessage = (event: any) => {
      try {
        // Validate that event.data is a string before parsing
        if (typeof event?.data !== "string") {
          console.warn(
            "Received non-string data in message event:",
            event?.data
          );
          return;
        }

        // Check if the data is already an object (stringified object)
        let data;
        if (event.data === "[object Object]") {
          console.warn("Received [object Object] string, skipping parse");
          return;
        }

        try {
          data = JSON.parse(event.data);
        } catch (parseError) {
          console.warn("Failed to parse message data:", event.data, parseError);
          return;
        }

        console.log("Parsed message data:", data);

        if (data?.maxScore !== undefined) {
          createAssessmentTracking({
            ...data,
            courseId,
            unitId,
            userId,
          });
        } else if (data?.data?.edata?.type === "EXIT") {
          handleExitEvent();
        } else if (data?.data?.mid) {
          handleTelemetryEventQuml(data, {
            courseId,
            unitId,
            userId,
            configFunctionality,
          });
        }
      } catch (error) {
        console.error("Error handling message event:", error, event);
      }
    };

    window.addEventListener("message", handleMessage, false);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <iframe
      ref={SunbirdQuMLPlayerRef}
      id="contentPlayer"
      title="Content Player"
      src={`${basePath}/libs/sunbird-quml-player/index.html`}
      aria-label="Content Player"
      style={{ border: "none" }}
      width={"100%"}
      height={"100%"}
    ></iframe>
  );
};

export default SunbirdQuMLPlayer;
