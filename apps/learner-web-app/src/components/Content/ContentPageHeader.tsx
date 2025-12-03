"use client";

import React from "react";
import { Box, IconButton, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import Image from "next/image";
import { AccountCircleOutlined } from "@mui/icons-material";
import LanguageDropdown from "@learner/components/LanguageDropdown/LanguageDropdown";
import { useTenant } from "@learner/context/TenantContext";
import { useTranslation } from "@shared-lib";

const ContentPageHeader: React.FC = () => {
  const { tenant, contentFilter } = useTenant();
  const { t } = useTranslation();

  const primaryColor = contentFilter?.theme?.primaryColor || "#E6873C";
  const secondaryColor = contentFilter?.theme?.secondaryColor || "#1A1A1A";
  const backgroundColor = contentFilter?.theme?.backgroundColor || "#F5F5F5";
  const tenantIcon = contentFilter?.icon || "/logo.png";
  const tenantName = contentFilter?.title || tenant?.name || "Tenant";
  const tenantAlt = `${tenantName} logo`;

  return (
    <Box
      sx={{
        backgroundColor,
      }}
    >
      <Box
        sx={{
          px: { xs: 2, md: 4 },
          py: { xs: 4, md: 3 },
          background: `linear-gradient(180deg, ${backgroundColor} 0%, ${alpha(
            backgroundColor,
            0.25
          )} 100%)`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: alpha("#FFFFFF", 0.35),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
              }}
            >
              <Image
                src={tenantIcon}
                alt={tenantAlt}
                width={40}
                height={40}
                style={{ objectFit: "contain" }}
              />
            </Box>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: { xs: "18px", sm: "20px" },
                lineHeight: 1.3,
                color: secondaryColor,
              }}
            >
              {tenantName}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <LanguageDropdown
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              size="small"
              minWidth={150}
            />
            <IconButton
              sx={{
                border: `1px solid ${alpha(secondaryColor, 0.2)}`,
                color: secondaryColor,
                "&:hover": {
                  backgroundColor: alpha(primaryColor, 0.08),
                },
              }}
            >
              <AccountCircleOutlined />
            </IconButton>
          </Box>
        </Box>

        <Typography
          variant="body2"
          sx={{
            mt: 2,
            fontWeight: 500,
            color: alpha(secondaryColor, 0.8),
          }}
        >
          {t("LEARNER_APP.CONTENT.VIEWING_CONTENT")}
        </Typography>
      </Box>
    </Box>
  );
};

export default ContentPageHeader;


