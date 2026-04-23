import React from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { transformImageUrl } from "../../utils/imageUtils";

interface CertificateCardProps {
  title: string;
  description: string;
  imageUrl?: string;
  completionDate: string;
  onPreviewCertificate: () => void;
  variant?: "default" | "compact";
}

const CourseCertificateCard: React.FC<CertificateCardProps> = ({
  title,
  description,
  imageUrl,
  completionDate,
  onPreviewCertificate,
  variant = "default",
}) => {
  // Debug logging
  console.log("CourseCertificateCard props:", {
    title,
    description,
    imageUrl,
    completionDate,
  });

  // Ensure we have valid data
  const safeTitle = title || "Untitled Course";
  const safeDescription = description || "No description available";
  const safeImageUrl = transformImageUrl(imageUrl) || "/images/image_ver.png";
  const safeCompletionDate = completionDate || new Date().toISOString();
  const isCompact = variant === "compact";
  const imageHeight = isCompact ? 110 : 160;
  const titleFontSize = isCompact ? "16px" : "18px";
  const descClamp = isCompact ? 2 : 3;
  const cardPadding = isCompact ? "12px" : "16px";
  const cardMinHeight = isCompact ? "auto" : "2.6em";
  const descMinHeight = isCompact ? "2.8em" : "4.2em";

  return (
    <Card
      sx={{
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        overflow: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        },
        // border: "2px solid red", // Temporary border to make it visible
      }}
    >
      {/* Image with overlay bar */}
      <Box sx={{ position: "relative", flexShrink: 0 }}>
        <CardMedia
          component="img"
          height={imageHeight}
          image={safeImageUrl}
          alt={safeTitle}
          sx={{
            width: "100%",
            objectFit: "cover",
          }}
        />

        {/* Overlay bar */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            padding: "8px 12px",
            minHeight: "40px",
          }}
        >
          <CheckCircleIcon
            sx={{ color: "#00C853", fontSize: 16, mr: 1, flexShrink: 0 }}
          />
          <Typography
            variant="caption"
            sx={{
              color: "#00C853",
              fontWeight: 600,
              fontSize: "12px",
              lineHeight: 1.2,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            Issued on{" "}
            {new Date(safeCompletionDate).toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </Typography>
        </Box>
      </Box>

      {/* Content */}
      <CardContent
        sx={{
          padding: cardPadding,
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          "&:last-child": { paddingBottom: cardPadding },
        }}
      >
        {/* Title */}
        <Typography
          variant="subtitle1"
          fontWeight={700}
          sx={{
            mb: 1,
            fontSize: titleFontSize,
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: cardMinHeight,
          }}
        >
          {safeTitle}
        </Typography>

        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            flexGrow: 1,
            display: "-webkit-box",
            WebkitLineClamp: descClamp,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            lineHeight: 1.4,
            mb: 2,
            minHeight: descMinHeight,
            fontSize: isCompact ? "11px" : "12px",
          }}
        >
          {safeDescription}
        </Typography>

        {/* Button */}
        <Button
          variant="text"
          onClick={onPreviewCertificate}
          sx={{
            fontSize: isCompact ? "11px" : "12px",
            fontWeight: 600,
            textTransform: "none",
            color: "#1976D2",
            padding: "8px 0",
            minHeight: "auto",
            alignSelf: "flex-start",
            "&:hover": {
              backgroundColor: "rgba(25, 118, 210, 0.04)",
            },
          }}
          endIcon={<ArrowForwardIcon sx={{ fontSize: "16px" }} />}
        >
          View Certificate
        </Button>
      </CardContent>
    </Card>
  );
};

export default CourseCertificateCard;
