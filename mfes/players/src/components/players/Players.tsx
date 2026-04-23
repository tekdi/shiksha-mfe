import dynamic from "next/dynamic";
import React from "react";
import { useRouter } from "next/router";
const SunbirdPdfPlayer = dynamic(() => import("./SunbirdPdfPlayer"), {
  ssr: false,
});

const SunbirdVideoPlayer = dynamic(() => import("./SunbirdVideoPlayer"), {
  ssr: false,
});
const SunbirdEpubPlayer = dynamic(() => import("./SunbirdEpubPlayer"), {
  ssr: false,
});

const SunbirdQuMLPlayer = dynamic(() => import("./SunbirdQuMLPlayer"), {
  ssr: false,
});
const TekdiQuMLPlayer = dynamic(() => import("./TekdiQuMLPlayer"), {
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
}

const SunbirdPlayers = ({
  "player-config": playerConfig,
  courseId,
  unitId,
  userId,
  configFunctionality,
}: PlayerProps) => {
  const router = useRouter();

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

  const mimeType = playerConfig?.metadata?.mimeType;

  console.log("Player routing decision:");
  console.log("- Final mimeType:", mimeType);
  console.log("- Content ID:", playerConfig?.context?.contentId);
  console.log("- About to switch on mimeType:", mimeType);
  console.log("- Switch statement mimeType type:", typeof mimeType);
  console.log("- Switch statement mimeType length:", mimeType?.length);
  console.log(
    "- MimeType charCodes:",
    mimeType
      ? Array.from(mimeType).map((c: any) => (c as string).charCodeAt(0))
      : "null"
  );
  console.log(
    "- Exact comparison video/x-youtube:",
    mimeType === "video/x-youtube"
  );
  console.log(
    "- Exact comparison video/youtube:",
    mimeType === "video/youtube"
  );
  console.log("- Trimmed comparison:", mimeType?.trim() === "video/x-youtube");
  console.log(
    "- Full playerConfig metadata:",
    JSON.stringify(playerConfig?.metadata, null, 2)
  );

  // Check for YouTube content with multiple possible mimeType formats
  // const isYouTubeContent =
  //   mimeType === "video/x-youtube" ||
  //   mimeType === "video/youtube" ||
  //   (typeof mimeType === "string" && mimeType.includes("youtube"));

  // if (isYouTubeContent) {
  //   console.log("🎯 YouTube Player: Routing to YouTube Player with data:", {
  //     courseId,
  //     unitId,
  //     userId,
  //     configFunctionality: !!configFunctionality,
  //   });

  //   return (
  //     <YouTubePlayer
  //       playerConfig={playerConfig}
  //       relatedData={{ courseId, unitId, userId }}
  //       configFunctionality={configFunctionality}
  //     />
  //   );
  // }

  switch (mimeType) {
    case "application/pdf":
     
      return (
        <SunbirdPdfPlayer
          playerConfig={playerConfig}
          relatedData={{ courseId, unitId, userId }}
          configFunctionality={configFunctionality}
        />
      );
    case "video/mp4":
    case "video/webm":
    case "audio/mp3":
    case "audio/wav":
      console.log("Routing to Video Player");
      return (
        <SunbirdVideoPlayer
          playerConfig={playerConfig}
          relatedData={{ courseId, unitId, userId }}
          configFunctionality={configFunctionality}
        />
      );
    case "application/vnd.sunbird.questionset":
      return (
        <SunbirdQuMLPlayer
          playerConfig={playerConfig}
          relatedData={{ courseId, unitId, userId }}
          configFunctionality={configFunctionality}
        />
      );
    case "application/epub":
      console.log("Routing to EPUB Player");
      return (
        <SunbirdEpubPlayer
          playerConfig={playerConfig}
          relatedData={{ courseId, unitId, userId }}
          configFunctionality={configFunctionality}
        />
      );
    case "application/vnd.ekstep.h5p-archive":
    case "application/vnd.ekstep.html-archive":
    case "video/youtube":
    case "video/x-youtube":
      // case "application/vnd.ekstep.ecml-archive":
      console.log("Routing to V1 Player");
      console.log("V1 Player case matched! mimeType:", mimeType);
      return (
        <SunbirdV1Player
          playerConfig={playerConfig}
          relatedData={{ courseId, unitId, userId }}
          configFunctionality={configFunctionality}
        />
      );
    case "application/vnd.ekstep.ecml-archive":
      console.log("Routing to V1 Player");
      return (
        <SunbirdEcmlPlayer
          playerConfig={playerConfig}
          relatedData={{ courseId, unitId, userId }}
          configFunctionality={configFunctionality}
        />
      );
    default:
      console.log("No matching player found, showing unsupported message");
      console.log("Default case matched! mimeType:", mimeType);
      return <div>Unsupported media type: {mimeType}</div>;
  }
};

export default SunbirdPlayers;
