
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

import {
  fetchContent,
  getHierarchy,
  getQumlData,
  getUserId,
} from "../services/PlayerService";
import { Box, Typography } from "@mui/material";
import { MIME_TYPE } from "../utils/url.config";
import {
  PlayerConfig,
  V1PlayerConfig,
  V2PlayerConfig,
} from "../utils/url.config";
import Loader from "../components/Loader";
import { Router, useRouter } from "next/router";

const SunbirdPlayers = dynamic(() => import("../components/players/Players"), {
  ssr: false,
});

interface SunbirdPlayerProps {
  identifier?: string; // Allow identifier as a prop
  playerConfig?: PlayerConfig; // Optional playerConfig prop
}

const Players: React.FC<SunbirdPlayerProps> = ({
  identifier: propIdentifier,
  playerConfig: propPlayerConfig,
}) => {
  const params = useParams();

  const router = useRouter();

  const queryIdentifier = params?.identifier; // string | string[] | undefined
  const identifier = propIdentifier || queryIdentifier; // Prefer prop over query
  const [playerConfig, setPlayerConfig] = useState<PlayerConfig | undefined>(
    propPlayerConfig
  );
  const [loading, setLoading] = useState(!propPlayerConfig);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (playerConfig || !identifier) return;

    const loadContent = async () => {
      setLoading(true);
      try {
        const data = await fetchContent(identifier);
        let config: PlayerConfig;

        if (data.mimeType === MIME_TYPE.QUESTION_SET_MIME_TYPE) {
          config = { ...V2PlayerConfig };
          const Q1 = await getHierarchy(identifier);
          const Q2 = await getQumlData(identifier);
          const metadata = { ...Q1?.questionset, ...Q2?.questionset };
          config.metadata = metadata;
        } else if (MIME_TYPE.INTERACTIVE_MIME_TYPE.includes(data?.mimeType)) {

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
        setPlayerConfig(config);
      } catch (error) {
        console.error("Error loading content:", error);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [identifier, playerConfig]);

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
        <Box height="100vh" width="100%" p="14px">
          {/* <Typography
            color="#024f9d"
            sx={{ padding: '0 0 4px 4px', fontWeight: 'bold' }}
          >
            {playerConfig?.metadata?.name || 'Loading...'}
          </Typography> */}
          <SunbirdPlayers
            player-config={playerConfig}
            courseId={identifier?.toString()}
            unitId={identifier?.toString()}
            userId={userId}
            configFunctionality={{
              trackable: true,
              isGenerateCertificate: false,
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default Players;
