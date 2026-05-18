import dynamic from "next/dynamic";
import { MIME_TYPE } from "../../utils/url.config";
import React, { useEffect, useState } from "react";
import { offlineService } from "@shared-lib-v2/utils/OfflineService";
const SunbirdPdfPlayer = dynamic(() => import("./SunbirdPdfPlayer"), {
  ssr: false,
});

const SunbirdVideoPlayer = dynamic(() => import("./SunbirdVideoPlayer"), {
  ssr: false,
});
const SunbirdEpubPlayer = dynamic(() => import("./SunbirdEpubPlayer"), {
  ssr: false,
});

// const SunbirdQuMLPlayer = dynamic(() => import("./SunbirdQuMLPlayer"), {
//   ssr: false,
// });
const SunbirdQuMLPlayer = dynamic(() => import("./TekdiQuMLPlayer"), {
  ssr: false,
});

const SunbirdV1Player = dynamic(() => import("../V1-Player/V1Player"), {
  ssr: false,
});

// const YouTubePlayer = dynamic(() => import("./YouTubePlayer"), {
//   ssr: false,
// });
const SunbirdEcmlPlayer = dynamic(() => import("./SunbirdEcmlPlayer"), {
  ssr: false,
});
interface PlayerProps {
  "player-config": any;
  courseId?: string;
  unitId?: string;
  userId?: string;
  configFunctionality?: any;
  mode?: string;
}

const SunbirdPlayers = ({
  "player-config": playerConfig,
  courseId,
  unitId,
  userId,
  configFunctionality,
  mode,
}: PlayerProps) => {
  const [processedConfig, setProcessedConfig] = useState(playerConfig);

  useEffect(() => {
    const processConfig = async () => {
      if (!playerConfig || offlineService.isOnline()) {
        setProcessedConfig(playerConfig);
        return;
      }

      console.log("[SunbirdPlayers] Offline: Resolving assets...");
      const config = JSON.parse(JSON.stringify(playerConfig)); // Deep clone
      const metadata = config.metadata || {};

      if (metadata.artifactUrl) {
        metadata.artifactUrl = await offlineService.resolveOfflineURL(metadata.artifactUrl);
      }
      if (metadata.streamingUrl) {
        metadata.streamingUrl = await offlineService.resolveOfflineURL(metadata.streamingUrl);
      }
      if (metadata.appIcon) {
        metadata.appIcon = await offlineService.resolveOfflineURL(metadata.appIcon);
      }
      if (metadata.posterImage) {
        metadata.posterImage = await offlineService.resolveOfflineURL(metadata.posterImage);
      }

      setProcessedConfig(config);
    };

    processConfig();
  }, [playerConfig]);

  console.log("🎯 SunbirdPlayers: Received parameters:", {
    courseId,
    unitId,
    userId,
    configFunctionality: !!configFunctionality,
    playerConfig: !!playerConfig,
  });

  // Handle ECML content configuration - ONLY for actual ECML content
  console.log(
    "Checking ECML condition:",
    playerConfig?.metadata?.mimeType === "application/vnd.ekstep.ecml-archive"
  );
  if (
    playerConfig?.metadata?.mimeType === "application/vnd.ekstep.ecml-archive"
  ) {
    // Check if this ECML content contains question sets
    const hasQuestionSet =
      playerConfig?.data?.theme?.stage?.[0]?.["org.ekstep.questionset"] ||
      playerConfig?.metadata?.questions?.length > 0;

    console.log("ECML content analysis:");
    console.log("- Original mimeType:", playerConfig?.metadata?.mimeType);
    console.log("- Has question set:", hasQuestionSet);
    console.log(
      "- Questions in metadata:",
      playerConfig?.metadata?.questions?.length || 0
    );
    console.log(
      "- Questionset in data:",
      !!playerConfig?.data?.theme?.stage?.[0]?.["org.ekstep.questionset"]
    );

    if (hasQuestionSet) {
      // This is a question set, route to QuML player
      console.log("ECML content contains question set, routing to QuML player");

      // Transform ECML question set data to QuML format
      const questions = playerConfig?.metadata?.questions || [];
      const questionSetData =
        playerConfig?.data?.theme?.stage?.[0]?.["org.ekstep.questionset"]?.[0];

      // Extract questions from ECML data structure
      let extractedQuestions = [];
      if (questionSetData?.data?.__cdata) {
        try {
          const parsedData = JSON.parse(questionSetData.data.__cdata);
          extractedQuestions = parsedData || [];
        } catch (e) {
          console.warn("Failed to parse ECML question data:", e);
          extractedQuestions = questions;
        }
      } else {
        extractedQuestions = questions;
      }

      // Ensure questions have the proper structure for QuML player
      const formattedQuestions = extractedQuestions.map(
        (q: any, index: number) => ({
          identifier: q.identifier || `question_${index}`,
          name: q.name || q.title || `Question ${index + 1}`,
          objectType: q.objectType || "AssessmentItem",
          status: q.status || "Live",
          // Add required properties that QuML player expects
          mimeType: q.mimeType || "application/vnd.ekstep.question",
          primaryCategory: q.primaryCategory || "MCQ",
          language: q.language || ["English"],
          // Ensure all string properties are defined
          title: q.title || q.name || `Question ${index + 1}`,
          description: q.description || "",
          category: q.category || "MCQ",
          // Add any missing required fields
          ...q,
        })
      );

      // Parse the config from ECML
      let questionSetConfig = {};
      if (questionSetData?.config?.__cdata) {
        try {
          questionSetConfig = JSON.parse(questionSetData.config.__cdata);
        } catch (e) {
          console.warn("Failed to parse ECML config:", e);
        }
      }

      // Create proper QuML configuration
      const qumlConfig = {
        ...playerConfig,
        metadata: {
          ...playerConfig.metadata,
          mimeType: "application/vnd.sunbird.questionset",
          // Extract questions from ECML data
          children: formattedQuestions.map((q: any) => ({
            identifier: q.identifier,
            name: q.name,
            objectType: q.objectType,
            status: q.status,
            mimeType: q.mimeType,
            primaryCategory: q.primaryCategory,
          })),
          // Set required QuML properties
          maxScore:
            playerConfig?.metadata?.totalScore || formattedQuestions.length,
          totalQuestions: formattedQuestions.length,
          allowSkip: "true",
          showFeedback: "true",
          shuffleQuestions: "false",
          shuffleOptions: "false",
        },
        // Extract question data from ECML structure
        data: {
          questions: formattedQuestions,
          config: {
            ...questionSetConfig,
            title: playerConfig.metadata.name,
            max_score:
              playerConfig.metadata.totalScore || formattedQuestions.length,
            allow_skip: "true",
            show_feedback: "true",
            shuffle_questions: "false",
            shuffle_options: "false",
            total_items: formattedQuestions.length,
          },
        },
      };

      // Replace the playerConfig with the transformed QuML config
      Object.assign(playerConfig, qumlConfig);

      console.log("- Updated mimeType to:", playerConfig.metadata.mimeType);
      console.log("- QuML config created with", questions.length, "questions");
    } else {
      // This is regular ECML content, use V1Player
      const dynamicArtifactUrl = `/ecml-content/${playerConfig?.context?.contentId}`;
      playerConfig.metadata.artifactUrl = dynamicArtifactUrl;

      // Ensure ECML content has proper configuration for the player
      if (!playerConfig.metadata.body) {
        playerConfig.metadata.body = "";
      }

      // Set proper content type for ECML
      playerConfig.metadata.contentType = "Resource";
      playerConfig.metadata.resourceType = "Learn";

      // Ensure the content has an identifier
      if (!playerConfig.metadata.identifier) {
        playerConfig.metadata.identifier = playerConfig?.context?.contentId;
      }

      console.log(
        "ECML content configured with artifactUrl:",
        dynamicArtifactUrl
      );
      console.log("ECML playerConfig:", playerConfig);
    }
  }

  const mimeType = processedConfig?.metadata?.mimeType;

  console.log("Player routing decision:");
  console.log("- Final mimeType:", mimeType);
  console.log("- Content ID:", processedConfig?.context?.contentId);

  switch (mimeType) {
    case "application/pdf":
      return (
        <SunbirdPdfPlayer
          playerConfig={processedConfig}
          relatedData={{ courseId, unitId, userId }}
          configFunctionality={configFunctionality}
          mode={mode}
        />
      );
    case "video/mp4":
    case "video/webm":
    case "video/ogg":
    case "audio/mp3":
    case "audio/wav":
      console.log("Routing to Video Player");
      return (
        <SunbirdVideoPlayer
          playerConfig={processedConfig}
          relatedData={{ courseId, unitId, userId }}
          configFunctionality={configFunctionality}
          mode={mode}
        />
      );
    case MIME_TYPE.QUESTION_MIME_TYPE:
    case MIME_TYPE.QUESTION_SET_MIME_TYPE:
      return (
        <SunbirdQuMLPlayer
          playerConfig={processedConfig}
          relatedData={{ courseId, unitId, userId }}
          configFunctionality={configFunctionality}
          mode={mode}
        />
      );
    case "application/epub+zip":
    case "application/epub":
      console.log("Routing to EPUB Player");
      return (
        <SunbirdEpubPlayer
          playerConfig={processedConfig}
          relatedData={{ courseId, unitId, userId }}
          configFunctionality={configFunctionality}
          mode={mode}
        />
      );
    case "application/vnd.ekstep.h5p-archive":
    case "application/vnd.ekstep.html-archive":
    case "video/youtube":
    case "video/x-youtube":
      console.log("Routing to V1 Player");
      return (
        <SunbirdV1Player
          playerConfig={processedConfig}
          relatedData={{ courseId, unitId, userId }}
          configFunctionality={configFunctionality}
          mode={mode}
        />
      );
    case "application/vnd.ekstep.ecml-archive":
      console.log("Routing to V1 Player");
      return (
        <SunbirdEcmlPlayer
          playerConfig={processedConfig}
          relatedData={{ courseId, unitId, userId }}
          configFunctionality={configFunctionality}
          mode={mode}
        />
      );
    default:
      console.log("No matching player found, showing unsupported message");
      console.log("Default case matched! mimeType:", mimeType);
      return <div>Unsupported media type: {mimeType}</div>;
  }
};

export default SunbirdPlayers;
