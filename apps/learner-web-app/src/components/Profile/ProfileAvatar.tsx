"use client";

import React from "react";
import { Box, Typography } from "@mui/material";

interface ProfileAvatarProps {
  initials: string;
  imageUrl?: string | null;
  size?: number;
  primaryColor?: string;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  initials,
  imageUrl,
  size = 80,
  primaryColor = "#E6873C",
}) => {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: imageUrl ? "transparent" : "#FEF3E8", // Light tint of primary
        border: imageUrl ? `2px solid ${primaryColor}` : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Profile"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <Typography
          sx={{
            fontSize: size * 0.4,
            fontWeight: 700,
            color: primaryColor,
          }}
        >
          {initials.toUpperCase()}
        </Typography>
      )}
    </Box>
  );
};

export default ProfileAvatar;
