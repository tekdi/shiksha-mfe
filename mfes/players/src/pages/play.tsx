import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import {
  fetchContent,
  getHierarchy,
  getQumlData,
  getUserId,
  getQuestions,
} from "../services/PlayerService";
import { Box, Typography } from "@mui/material";
import { MIME_TYPE } from "../utils/url.config";
import {
  PlayerConfig,
  V1PlayerConfig,
  V2PlayerConfig,
} from "../utils/url.config";
import Loader from "../components/Loader";

const extractQuestionIds = (items: any[]): string[] => {
  let ids: string[] = [];
  items?.forEach((item) => {
    if (item.mimeType === "application/vnd.sunbird.question" || 
        item.mimeType === "application/vnd.ekstep.question") {
      ids.push(item.identifier);
    }
    if (item.children) {
      ids = [...ids, ...extractQuestionIds(item.children)];
    }
  });
  return ids;
};

const SunbirdPlayers = dynamic(() => import("../components/players/Players"), {
  ssr: false,
});

interface SunbirdPlayerProps {
  identifier?: string; // Allow identifier as a prop
  playerConfig?: PlayerConfig; // Optional playerConfig prop
  fromShortVideo?: boolean;
}

import { offlineService } from "@shared-lib-v2/utils/OfflineService";
import { Button, CircularProgress } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const Players: React.FC<SunbirdPlayerProps> = ({
  identifier: propIdentifier,
  playerConfig: propPlayerConfig,
  fromShortVideo: propFromShortVideo,
}) => {
  const params = useParams();

  const queryIdentifier = params?.identifier; // string | string[] | undefined
  const identifier = propIdentifier || queryIdentifier; // Prefer prop over query
  const [playerConfig, setPlayerConfig] = useState<PlayerConfig | undefined>(
    propPlayerConfig
  );
  const [loading, setLoading] = useState(!propPlayerConfig);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    // Check if already downloaded
    if (identifier) {
      offlineService.getStoredMetadata(identifier.toString()).then(stored => {
        if (stored) setIsDownloaded(true);
      });
    }

    // Fetch userId from API
    const fetchUserId = async () => {
      try {
        const userData = await getUserId();
        setUserId(userData?.id || userData?.userId || "");
        console.log("Fetched userId from API:", userData);
      } catch (error) {
        console.warn("Failed to fetch userId from API, using fallback:", error);
        setUserId("anonymous-user");
      }
    };

    fetchUserId();
  }, [identifier]);

  const handleDownload = async () => {
    if (!identifier || !playerConfig) return;
    setIsDownloading(true);
    try {
      console.log("[Player] Starting download...");
      
      // 1. Save metadata and hierarchy
      await offlineService.downloadContentMetadata(
        identifier.toString(), 
        playerConfig.metadata, 
        playerConfig.metadata // In this player, hierarchy is often merged into metadata
      );

      // 2. Identify and download assets
      const assetsToDownload: string[] = [];
      const metadata: any = playerConfig.metadata || {};

      // Add main content URL
      if (metadata.artifactUrl) assetsToDownload.push(metadata.artifactUrl);
      if (metadata.streamingUrl) assetsToDownload.push(metadata.streamingUrl);
      if (metadata.appIcon) assetsToDownload.push(metadata.appIcon);
      if (metadata.posterImage) assetsToDownload.push(metadata.posterImage);

      // For interactive content, there might be many assets. 
      // This is a simplified version. A full implementation would parse the ECML/QuestionSet.
      
      console.log(`[Player] Downloading ${assetsToDownload.length} assets...`);
      for (const url of assetsToDownload) {
        await offlineService.downloadAsset(url);
      }

      setIsDownloaded(true);
      console.log("[Player] Download complete!");
    } catch (error) {
      console.error("[Player] Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Sync state with props when they change
  useEffect(() => {
    if (propPlayerConfig) {
      setPlayerConfig(propPlayerConfig);
      setLoading(false);
    }
  }, [propPlayerConfig]);

  useEffect(() => {
    if (!identifier || propPlayerConfig || playerConfig) return;

    const loadContent = async () => {
      setLoading(true);
      try {
        const data = await fetchContent(identifier);
        let config: PlayerConfig;
        
        // ... (rest of the loadContent logic is same, so I'll just use a targetContent that includes it)

        if (
          data.mimeType === MIME_TYPE.QUESTION_SET_MIME_TYPE ||
          data.mimeType === "application/vnd.ekstep.questionset"
        ) {
          config = { ...V2PlayerConfig };
          const Q1 = await getHierarchy(identifier);
          const Q2 = await getQumlData(identifier);
          
          // Q1 is likely { questionset: {...} } or { content: {...} } or the object itself
          // Q2 (getQumlData) already unwraps questionset/content
          const h1 = Q1?.questionset || Q1?.content || Q1 || {};
          const r1 = Q2 || {};
          
          let children = (h1.children && h1.children.length > 0) ? h1.children : (r1.children || []);
          
          // FETCH FULL QUESTION BODIES
          const questionIds = extractQuestionIds(children);
          if (questionIds.length > 0) {
            console.log("Fetching full bodies for questions:", questionIds);
            try {
              const fullQuestions = await getQuestions(questionIds);
              // Merge full bodies into children recursively or flat list? 
              // TekdiQuMLPlayer flattens anyway. We can just pass the full questions list in config.
              // But strictly speaking, we should try to update the children tree if possible, 
              // OR just rely on TekdiQuMLPlayer using the `questions` prop we pass below.
              
              // Let's create a map for easy lookup
              const questionMap = new Map(fullQuestions.map((q: any) => [q.identifier, q]));
              
              // Recursive merge helper
              const mergeQuestions = (items: any[]): any[] => {
                return items.map(item => {
                   const fullQuestion = questionMap.get(item.identifier);
                   if (fullQuestion) {
                     // Merge, prioritizing the full body data but keeping structural info from hierarchy
                     return { ...item, ...fullQuestion };
                   }
                   if (item.children) {
                     return { ...item, children: mergeQuestions(item.children) };
                   }
                   return item;
                });
              };
              
              children = mergeQuestions(children);
              
              children.forEach((c: any) => {
                  if (c.children) {
                      c.children.forEach((q:any) => {
                          console.log(`Question ${q.identifier} body present:`, !!q.body);
                      });
                  }
              });

            } catch (e) {
              console.error("Failed to fetch full question bodies", e);
            }
          }

          const metadata = { 
            ...(typeof h1 === 'object' ? h1 : {}), 
            ...(typeof r1 === 'object' ? r1 : {}), 
            children: children
          };
          config.metadata = metadata;
          
          // Pass the questions data if available
          config.data = {
            questions: metadata.children || []
          };
          //@ts-ignore
          config.context["contentId"] = identifier;
        } else if (
          MIME_TYPE.INTERACTIVE_MIME_TYPE.includes(data?.mimeType) ||
          data?.mimeType === MIME_TYPE.QUESTION_MIME_TYPE
        ) {

          // router.push(
          //   `${process.env.NEXT_PUBLIC_ECML_PLAYER_URL}?identifier=${identifier}`
          // );

          config = { ...V1PlayerConfig, metadata: data, data: data.body || {} };
          //@ts-ignore
          config.context["contentId"] = identifier;
        } else {
          config = { ...V2PlayerConfig, metadata: data };
          //@ts-ignore
          config.context["contentId"] = identifier;
        }
        if ((propPlayerConfig as any)?.fromShortVideo || propFromShortVideo) {
          config.fromShortVideo = true;
        }
        setPlayerConfig(config);
      } catch (error) {
        console.error("Error loading content:", error);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [identifier, propPlayerConfig]);

  if (!identifier) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Typography color="error">No identifier provided</Typography>
      </Box>
    );
  }
  console.log("SunbirdPlayers playerConfig", playerConfig);
  console.log("Current userId:", userId);

  return (
    <Box>
      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="100vh"
        >
          <Loader showBackdrop={false} />
        </Box>
      ) : (
        <Box height="100%" width="100%" sx={{ p: { xs: 0, md: 0 }, boxSizing: 'border-box', backgroundColor: 'transparent' }}>
          <SunbirdPlayers
            player-config={playerConfig}
            courseId={identifier?.toString()}
            unitId={identifier?.toString()}
            userId={userId}
            configFunctionality={{
              trackable: true,
              isGenerateCertificate: false,
              fromShortVideo: playerConfig?.fromShortVideo
            }}
            onDownload={handleDownload}
          />
        </Box>
      )}
    </Box>
  );
};

export default Players;
