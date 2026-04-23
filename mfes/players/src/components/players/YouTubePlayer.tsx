import React, { useRef, useEffect, useState } from "react";
import { Box, Typography, CircularProgress, Button } from "@mui/material";
import { getTelemetryEvents } from "../../services/TelemetryService";

interface YouTubePlayerProps {
  playerConfig: any;
  relatedData?: any;
  configFunctionality?: boolean;
}

// Function to extract YouTube video ID from URL
const extractYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;

  // Enhanced regex to handle more YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    /youtu\.be\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1] && match[1].length === 11) {
      return match[1];
    }
  }

  return null;
};

const YouTubePlayer = ({
  playerConfig,
  relatedData: { courseId, unitId, userId },
  configFunctionality,
}: YouTubePlayerProps) => {
  console.log("🎯 YouTube Player: Component props:", {
    playerConfig: !!playerConfig,
    relatedData: { courseId, unitId, userId },
    configFunctionality: !!configFunctionality,
  });
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [loadingError, setLoadingError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Clean YouTube Player - Only essential tracking logs

  // Extract YouTube video ID from artifactUrl
  const artifactUrl = playerConfig?.metadata?.artifactUrl || "";
  const youtubeVideoId = extractYouTubeVideoId(artifactUrl);

  // IMMEDIATE TRACKING - Call tracking as soon as component renders
  useEffect(() => {
    console.log("🎯 YouTube Player: useEffect triggered with:", {
      youtubeVideoId,
      userId,
      courseId,
      unitId,
      contentId:
        playerConfig?.context?.contentId || playerConfig?.metadata?.identifier,
    });

    if (youtubeVideoId && userId) {
      console.log("🎯 YouTube Player: Starting tracking with data:", {
        youtubeVideoId,
        userId,
        courseId,
        unitId,
        contentId:
          playerConfig?.context?.contentId ||
          playerConfig?.metadata?.identifier,
      });

      const immediateStartEvent = {
        eid: "START",
        edata: {
          type: "content",
          mode: "play",
          pageid: "",
          duration: 1.36,
        },
        object: {
          id:
            playerConfig?.context?.contentId ||
            playerConfig?.metadata?.identifier,
          type: "Content",
          ver: "1.0",
        },
        context: {
          pdata: {
            id: "youtube-player",
            ver: "1.0",
            pid: "youtube-player",
          },
          env: "youtube",
          sid: "",
          did: "",
          uid: userId || "anonymous",
          channel: "youtube",
          cdata: [],
        },
      };

      console.log(
        "🎯 YouTube Player: Sending START event:",
        immediateStartEvent
      );

      // Send immediate START event
      getTelemetryEvents(immediateStartEvent, "video", {
        courseId,
        unitId,
        userId,
        configFunctionality,
      })
        .then(() => {
          console.log("✅ YouTube Tracking: START event sent successfully");
        })
        .catch((error) => {
          console.error("❌ YouTube Tracking: START event failed", error);
        });
    } else {
      console.warn("🎯 YouTube Player: Missing required data for tracking:", {
        youtubeVideoId: !!youtubeVideoId,
        userId: !!userId,
        courseId: !!courseId,
        unitId: !!unitId,
      });
    }
  }, [
    youtubeVideoId,
    userId,
    courseId,
    unitId,
    playerConfig,
    configFunctionality,
  ]);

  // Try to extract video ID from artifactUrl first, then streamingUrl as fallback
  const artifactUrl2 = playerConfig?.metadata?.artifactUrl;
  const streamingUrl = playerConfig?.metadata?.streamingUrl;
  const youtubeVideoId2 = extractYouTubeVideoId(
    artifactUrl2 || streamingUrl || ""
  );

  // Build YouTube embed URL
  const embedUrl = youtubeVideoId2
    ? `https://www.youtube.com/embed/${youtubeVideoId2}?enablejsapi=1&origin=${encodeURIComponent(
        window.location.origin
      )}&rel=0&modestbranding=1&fs=1&cc_load_policy=0&iv_load_policy=3&autohide=0&playsinline=1&showinfo=0&controls=1&disablekb=0&loop=0&mute=0&autoplay=0`
    : "";

  // Handle iframe loading
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe && youtubeVideoId2) {
      // Set a timeout to detect if iframe doesn't load within 30 seconds
      const timeout = setTimeout(() => {
        if (!isPlayerReady) {
          // Only set error after multiple attempts
          if (retryCount > 1) {
            setLoadingError(true);
          }
          setIsLoading(false);
        }
      }, 30000);
      setTimeoutId(timeout);

      const handleLoad = () => {
        setLoadingError(false);
        setIsPlayerReady(true);
        setIsLoading(false);
        if (timeout) {
          clearTimeout(timeout);
        }
      };

      const handleError = () => {
        // Only set error after multiple attempts
        if (retryCount > 1) {
          setLoadingError(true);
        }
        setIsPlayerReady(false);
        setIsLoading(false);
        if (timeout) {
          clearTimeout(timeout);
        }
      };

      // Additional check for iframe content
      const checkIframeContent = () => {
        try {
          // Try to access iframe content to detect blank screen
          if (iframe.contentDocument && iframe.contentDocument.body) {
            const bodyText = iframe.contentDocument.body.innerText;
            if (
              bodyText.includes("An error occurred") ||
              bodyText.includes("Video unavailable")
            ) {
              setLoadingError(true);
              setIsLoading(false);
            }
          }
        } catch (e) {
          // Cross-origin access denied - this is normal for YouTube embeds
        }
      };

      iframe.addEventListener("load", handleLoad);
      iframe.addEventListener("error", handleError);

      // Check content after a delay
      setTimeout(checkIframeContent, 3000);

      return () => {
        iframe.removeEventListener("load", handleLoad);
        iframe.removeEventListener("error", handleError);
        if (timeout) {
          clearTimeout(timeout);
        }
      };
    }
  }, [youtubeVideoId2, isPlayerReady]);

  // Handle YouTube events from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        console.log("🎯 YouTube Player: Received message:", event);

        // Only process events from YouTube iframe
        if (
          event.origin !== "https://www.youtube.com" &&
          event.origin !== window.location.origin
        ) {
          console.log(
            "🎯 YouTube Player: Ignoring message from non-YouTube origin:",
            event.origin
          );
          return;
        }

        if (typeof event.data !== "string") {
          console.log("🎯 YouTube Player: Ignoring non-string message data");
          return;
        }

        const eventData = JSON.parse(event.data);
        console.log("🎯 YouTube Player: Parsed event data:", eventData);

        // Check if this is a YouTube event
        if (eventData.from === "youtube" && eventData.eid) {
          console.log(`🎯 YouTube Tracking: ${eventData.eid} event received`);

          // Transform YouTube event to telemetry format
          const telemetryEvent = {
            eid: eventData.eid,
            edata: {
              type: "content",
              mode: "play",
              pageid: "youtube-player",
              duration: eventData.duration || 0,
              time: eventData.time || 0,
            },
            object: {
              id:
                playerConfig?.context?.contentId ||
                playerConfig?.metadata?.identifier,
              type: "Content",
              ver: "1.0",
            },
            context: {
              pdata: {
                id: "youtube-player",
                ver: "1.0",
                pid: "youtube-player",
              },
              env: "youtube",
              sid: "",
              did: "",
              uid: userId || "anonymous",
              channel: "youtube",
              cdata: [],
            },
          };

          console.log(
            "🎯 YouTube Player: Sending telemetry event:",
            telemetryEvent
          );

          // Send telemetry event
          getTelemetryEvents(telemetryEvent, "video", {
            courseId,
            unitId,
            userId,
            configFunctionality,
          })
            .then(() => {
              console.log(
                `✅ YouTube Tracking: ${eventData.eid} sent successfully`
              );
            })
            .catch((error) => {
              console.error(
                `❌ YouTube Tracking: ${eventData.eid} failed`,
                error
              );
            });
        } else {
          console.log(
            "🎯 YouTube Player: Not a YouTube event or missing eid:",
            eventData
          );
        }
      } catch (error) {
        console.error("❌ YouTube Tracking: Message processing failed", error);
      }
    };

    // Add message event listener
    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [playerConfig, courseId, unitId, userId, configFunctionality]);

  // Cleanup on unmount and send END event
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Send END event when component unmounts
      if (youtubeVideoId && userId) {
        const endEvent = {
          eid: "END",
          edata: {
            type: "content",
            mode: "play",
            pageid: "youtube-player",
            duration: 0,
            time: 0,
          },
          object: {
            id:
              playerConfig?.context?.contentId ||
              playerConfig?.metadata?.identifier,
            type: "Content",
            ver: "1.0",
          },
          context: {
            pdata: {
              id: "youtube-player",
              ver: "1.0",
              pid: "youtube-player",
            },
            env: "youtube",
            sid: "",
            did: "",
            uid: userId || "anonymous",
            channel: "youtube",
            cdata: [],
          },
        };

        console.log(
          "🎯 YouTube Player: Sending END event on unmount:",
          endEvent
        );

        getTelemetryEvents(endEvent, "video", {
          courseId,
          unitId,
          userId,
          configFunctionality,
        })
          .then(() => {
            console.log("✅ YouTube Tracking: END event sent on unmount");
          })
          .catch((error) => {
            console.error(
              "❌ YouTube Tracking: END event failed on unmount",
              error
            );
          });
      }
    };
  }, [
    timeoutId,
    youtubeVideoId,
    userId,
    courseId,
    unitId,
    playerConfig,
    configFunctionality,
  ]);

  if (loadingError) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h3>Error Loading YouTube Video</h3>
        <p>There was an error loading the YouTube video. Please try again.</p>
        <button
          onClick={() => {
            setLoadingError(false);
            setRetryCount((prev) => prev + 1);
            setIsLoading(true);
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!youtubeVideoId2) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h3>Invalid YouTube Video</h3>
        <p>No valid YouTube video ID found in the content.</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1,
          }}
        >
          <div>Loading YouTube video...</div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        width="100%"
        height="100%"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{
          border: "none",
          borderRadius: "8px",
          opacity: isLoading ? 0.5 : 1,
          transition: "opacity 0.3s ease",
        }}
        onLoad={() => {
          setIsLoading(false);
        }}
      />
    </div>
  );
};

export default YouTubePlayer;
