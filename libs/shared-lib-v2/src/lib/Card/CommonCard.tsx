/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";

import * as React from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import { red } from "@mui/material/colors";
import { Box, LinearProgress, useTheme, Chip, Link } from "@mui/material";
import { CircularProgressWithLabel } from "../Progress/CircularProgressWithLabel";
import SpeakableText from "../textToSpeech/SpeakableText";
import { capitalize } from "lodash";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TripOriginOutlinedIcon from "@mui/icons-material/TripOriginOutlined";
import PanoramaFishEyeIcon from "@mui/icons-material/PanoramaFishEye";
import AdjustIcon from "@mui/icons-material/Adjust";
import { useTranslation } from "../context/LanguageContext";

/**
 * Transforms image URLs from Azure Blob Storage to AWS S3 URLs
 * @param imageUrl - The image URL to transform
 * @returns Transformed image URL or fallback to logo.png
 */
const transformImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return "/logo.png";

  if (imageUrl.includes("https://sunbirdsaaspublic.blob.core.windows.net")) {
    // Handle double domain pattern
    if (
      imageUrl.includes(
        "https://sunbirdsaaspublic.blob.core.windows.net/https://sunbirdsaaspublic.blob.core.windows.net"
      )
    ) {
      // Extract everything after the second domain
      const urlParts = imageUrl.split(
        "https://sunbirdsaaspublic.blob.core.windows.net/https://sunbirdsaaspublic.blob.core.windows.net/"
      );
      if (urlParts.length > 1) {
        const pathAfterSecondDomain = urlParts[1];
        // Remove any existing content/content prefix to avoid duplication
        let cleanPath = pathAfterSecondDomain.replace(
          /^content\/content\//,
          ""
        );
        // Remove sunbird-content-prod/schemas/content/ if present
        cleanPath = cleanPath.replace(
          /^sunbird-content-prod\/schemas\/content\//,
          ""
        );
        // Transform to AWS S3 URL with the new pattern
        return `https://s3.ap-south-1.amazonaws.com/saas-prod/content/${cleanPath}`;
      }
    } else {
      // Handle single domain pattern
      const urlParts = imageUrl.split(
        "https://sunbirdsaaspublic.blob.core.windows.net/"
      );
      if (urlParts.length > 1) {
        const pathAfterDomain = urlParts[1];
        // Remove any existing content/content prefix to avoid duplication
        let cleanPath = pathAfterDomain.replace(/^content\/content\//, "");
        // Remove sunbird-content-prod/schemas/content/ if present
        cleanPath = cleanPath.replace(
          /^sunbird-content-prod\/schemas\/content\//,
          ""
        );
        // Transform to AWS S3 URL with the new pattern
        return `https://s3.ap-south-1.amazonaws.com/saas-prod/content/${cleanPath}`;
      }
    }
  }

  return imageUrl;
};

export interface ContentItem {
  name: string;
  gradeLevel: string[];
  language: string[];
  artifactUrl: string;
  identifier: string;
  appIcon: string;
  contentType: string;
  mimeType: string;
  description: string;
  posterImage: string;
  keywords?: string[];
  leafNodes?: any[];
  children?: any[];
}

interface CommonCardProps {
  title: string;
  avatarLetter?: string;
  avatarColor?: string;
  subheader?: string;
  image?: string;
  imageAlt?: string;
  content?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  orientation?: "vertical" | "horizontal";
  minheight?: string;
  TrackData?: any[];
  item: ContentItem;
  type: string;
  onClick?: (e: any) => void;
  _card?: any;
  description:any;
}

interface StatuPorps {
  trackProgress?: number;
  status?: string;
  type?: string;
  _card?: any;
}

export const getLeafNodes = (node: any) => {
  const result = [];

  // If the node has leafNodes, add them to the result array
  if (node?.leafNodes) {
    result.push(...node.leafNodes);
  }

  // If the node has children, iterate through them and recursively collect leaf nodes
  if (node?.children) {
    node.children.forEach((child: any) => {
      result.push(...getLeafNodes(child));
    });
  }

  return result;
};

export const CommonCard: React.FC<CommonCardProps> = ({
  avatarLetter,
  avatarColor = red[500],
  title,
  subheader,
  image,
  imageAlt,
  content,
  actions,
  children,
  orientation,
  minheight,
  TrackData,
  item,
  type,
  onClick,
  _card,
}) => {

  const [statusBar, setStatusBar] = React.useState<StatuPorps>();
  const [showDetails, setShowDetails] = React.useState(false);
  const { t } = useTranslation();
  
  // Use useCallback to ensure the handler is unique per card instance
  const cardId = item?.identifier || '';
  const handleToggleDetails = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowDetails((prev) => {
      // Double-check we're updating the correct card's state
      return !prev;
    });
  }, [cardId]);
  React.useEffect(() => {
    const init = () => {
      try {
        //@ts-ignore
        if (TrackData) {
          const result = TrackData?.find((e) => e.courseId === item.identifier);
          const newObj = {
            type,
            status:
              result?.status?.toLowerCase() === "completed"
                ? t("COMMON.STATUS.completed")
                : result?.status?.toLowerCase() === "in progress"
                ? t("COMMON.STATUS.in_progress")
                : result?.enrolled === true
                ? t("COMMON.STATUS.enrolled_not_started")
                : t("COMMON.STATUS.not_started"),
          };
          if (type === "Course") {
            if (!_card?.isHideProgress) {
              setStatusBar({
                ...newObj,
                trackProgress: result?.percentage ?? 0,
              });
            } else {
              setStatusBar(newObj);
            }
          } else {
            setStatusBar(newObj);
          }
        }
      } catch (e) {
        console.log("error", e);
      }
    };
    init();
  }, [TrackData, item, type, _card?.isHideProgress, t]);

  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: orientation === "horizontal" ? "column" : "row",
        height: minheight || "100%",
        cursor: onClick ? "pointer" : "default",
        boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.2)",
        overflow: "hidden",
        "&:hover": {
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.2)",
        },
        "@media (max-width: 600px)": {
          flexDirection: "column",
        },
        ..._card?.sx,
      }}
      onClick={onClick}
    >
      {/* Image and Progress Overlay */}
      <Box sx={{ position: "relative", width: "100%" }}>
        <CardMedia
          title={title}
          component="img"
          image={transformImageUrl(image || "")}
          alt={imageAlt || "Image"}
          sx={{
            width: "100%",
            height: orientation === "horizontal" ? "150px" : "auto",
            objectFit: "contain", // Changed from cover to contain to prevent cropping
            padding: "10px", // Added padding to prevent cropping
            backgroundColor: "#f5f5f5", // Added background color for better visibility
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "@media (max-width: 600px)": {
              height: "150px",
              padding: "8px", // Smaller padding on mobile
            },
            ..._card?._cardMedia?.sx,
          }}
        />

        {/* Progress Bar Overlay */}
        {/* Progress Bar Overlay */}
        {!_card?.isHideProgressStatus && (
          <StatusBar {...statusBar} _card={_card} />
        )}
      </Box>
      {avatarLetter && subheader && (
        <CardHeader
          sx={{
            pb: 0,
            pt: 1,
          }}
          avatar={
            avatarLetter && (
              <Avatar sx={{ bgcolor: avatarColor }} aria-label="avatar">
                {avatarLetter}
              </Avatar>
            )
          }
          subheader={
            subheader && (
              <Typography variant="h3" component="div">
                <SpeakableText>{subheader}</SpeakableText>
              </Typography>
            )
          }
        />
      )}
      <Box sx={_card?._contentParentText?.sx}>
        {title && (
          <CardContent
            sx={{
              pt: 1,
              pb: "0 !important",
            }}
          >
            <Typography
              variant="body1"
              component="div"
              title={title}
              sx={{
                fontWeight: 500,
                // fontSize: '16px',
                // lineHeight: '24px',
                whiteSpace: "wrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                textTransform: "capitalize",
                WebkitLineClamp: 2,
              }}
            >
              <SpeakableText>{title}</SpeakableText>
            </Typography>
          </CardContent>
        )}
        {content && (
          <CardContent
            sx={{
              pt: 0.5,
              pb: "8px !important",
              px: 0,
              "&:last-child": {
                paddingBottom: "8px",
              },
            }}
          >
            <Typography
              variant="body1"
              component="div"
              // @ts-ignore
              title={typeof content === "string" ? content : ""}
              sx={{
                fontWeight: 400,
                // fontSize: '15.4px',
                // lineHeight: '22px',
                color: "#49454F",
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
                ..._card?._contentText?.sx,
              }}
            >
              {typeof content === "string" ? (
                <SpeakableText>
                  {capitalize(content[0]) + content.slice(1)}
                </SpeakableText>
              ) : (
                content
              )}
            </Typography>
          </CardContent>
        )}
      </Box>
      {/* View More/Less Link - Below content, aligned to right */}
      {(() => {
        // Get metadata from item
        const itemKeywords = (item as any)?.keywords || item?.keywords;
        const hasKeywords = itemKeywords && Array.isArray(itemKeywords) && itemKeywords.length > 0;
        
        // Get framework metadata
        const boards = (item as any)?.se_boards || (item as any)?.targetBoardIds || [];
        const mediums = (item as any)?.se_mediums || (item as any)?.targetMediumIds || [];
        const gradeLevels = (item as any)?.se_gradeLevels || (item as any)?.targetGradeLevelIds || [];
        const subjects = (item as any)?.se_subjects || (item as any)?.targetSubjectIds || [];
        
        const hasFrameworkMetadata = 
          (Array.isArray(boards) && boards.length > 0) ||
          (Array.isArray(mediums) && mediums.length > 0) ||
          (Array.isArray(gradeLevels) && gradeLevels.length > 0) ||
          (Array.isArray(subjects) && subjects.length > 0);
        
        const hasMetadata = hasKeywords || hasFrameworkMetadata;
        
        if (!hasMetadata) return null;
        
        // Show only first 5 keywords
        const keywordsToShow = hasKeywords ? itemKeywords.slice(0, 5) : [];
        const remainingCount = hasKeywords ? itemKeywords.length - 5 : 0;
        
        return (
          <>
            {/* View More/Less Link - Positioned at right corner below content */}
            <CardContent
              sx={{
                pt: "4px !important",
                pb: "4px !important",
                px: "16px !important",
                "&:last-child": {
                  paddingBottom: "4px",
                },
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "flex-end" }} data-card-id={item?.identifier}>
                <Link
                  component="button"
                  variant="caption"
                  onClick={handleToggleDetails}
                  sx={{
                    fontSize: "11px",
                    color: "#E6873C",
                    textDecoration: "none",
                    cursor: "pointer",
                    fontWeight: 500,
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  {showDetails ? "View less" : "View more"}
                </Link>
              </Box>
            </CardContent>
            
            {/* Collapsible Metadata Section - Scoped to this specific card */}
            {showDetails && (
              <CardContent
                sx={{
                  pt: "8px !important",
                  pb: "12px !important",
                  px: "16px !important",
                  "&:last-child": {
                    paddingBottom: "12px",
                  },
                }}
                data-card-id={item?.identifier}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {/* Framework Metadata - Board, Medium, Grade, Subject */}
                  {hasFrameworkMetadata && (
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "8px",
                        rowGap: "8px",
                        alignItems: "flex-start",
                      }}
                    >
                      {Array.isArray(boards) && boards.length > 0 && (
                        <Chip
                          label={`Board: ${boards[0]}`}
                          size="small"
                          sx={{
                            fontSize: "11px",
                            height: "26px",
                            backgroundColor: "rgba(0,0,0,0.04)",
                            color: "#49454F",
                            fontWeight: 500,
                            borderRadius: "12px",
                            margin: 0,
                            "& .MuiChip-label": {
                              padding: "0 10px",
                              whiteSpace: "nowrap",
                            },
                          }}
                        />
                      )}
                      {Array.isArray(mediums) && mediums.length > 0 && (
                        <Chip
                          label={`Medium: ${mediums[0]}`}
                          size="small"
                          sx={{
                            fontSize: "11px",
                            height: "26px",
                            backgroundColor: "rgba(0,0,0,0.04)",
                            color: "#49454F",
                            fontWeight: 500,
                            borderRadius: "12px",
                            margin: 0,
                            "& .MuiChip-label": {
                              padding: "0 10px",
                              whiteSpace: "nowrap",
                            },
                          }}
                        />
                      )}
                      {Array.isArray(gradeLevels) && gradeLevels.length > 0 && (
                        <Chip
                          label={`Grade: ${gradeLevels[0]}`}
                          size="small"
                          sx={{
                            fontSize: "11px",
                            height: "26px",
                            backgroundColor: "rgba(0,0,0,0.04)",
                            color: "#49454F",
                            fontWeight: 500,
                            borderRadius: "12px",
                            margin: 0,
                            "& .MuiChip-label": {
                              padding: "0 10px",
                              whiteSpace: "nowrap",
                            },
                          }}
                        />
                      )}
                      {Array.isArray(subjects) && subjects.length > 0 && (
                        <Chip
                          label={`Subject: ${subjects[0]}`}
                          size="small"
                          sx={{
                            fontSize: "11px",
                            height: "26px",
                            backgroundColor: "rgba(0,0,0,0.04)",
                            color: "#49454F",
                            fontWeight: 500,
                            borderRadius: "12px",
                            margin: 0,
                            "& .MuiChip-label": {
                              padding: "0 10px",
                              whiteSpace: "nowrap",
                            },
                          }}
                        />
                      )}
                    </Box>
                  )}
                  
                  {/* Keywords Section */}
                  {hasKeywords && (
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "8px",
                        rowGap: "8px",
                        alignItems: "flex-start",
                      }}
                    >
                      {keywordsToShow.map((keyword: string, index: number) => (
                        <Chip
                          key={`keyword-${index}-${keyword}`}
                          label={keyword}
                          size="small"
                          sx={{
                            fontSize: "11px",
                            height: "26px",
                            backgroundColor: "#F3EDF7",
                            color: "#6750A4",
                            fontWeight: 500,
                            borderRadius: "12px",
                            margin: 0,
                            "& .MuiChip-label": {
                              padding: "0 10px",
                              whiteSpace: "nowrap",
                            },
                          }}
                        />
                      ))}
                      {remainingCount > 0 && (
                        <Chip
                          key="keyword-more"
                          label={`+${remainingCount} more`}
                          size="small"
                          sx={{
                            fontSize: "11px",
                            height: "26px",
                            backgroundColor: "#E6E6E6",
                            color: "#666",
                            fontWeight: 500,
                            borderRadius: "12px",
                            margin: 0,
                            "& .MuiChip-label": {
                              padding: "0 10px",
                              whiteSpace: "nowrap",
                            },
                          }}
                        />
                      )}
                    </Box>
                  )}
                </Box>
              </CardContent>
            )}
          </>
        );
      })()}
      {children && <CardContent>{children}</CardContent>}
      {actions && (
        <CardActions sx={{ p: 2, pt: "14px" }}>
          <SpeakableText>{actions}</SpeakableText>
        </CardActions>
      )}
    </Card>
  );
};

export const StatusBar: React.FC<StatuPorps> = ({
  trackProgress,
  status,
  type,
  _card,
}) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        position: "absolute",
        ...(type === "Course" ? { top: 0 } : { bottom: 0 }),
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center", // Center the progress horizontally
        background: "rgba(0, 0, 0, 0.5)",
      }}
    >
      <Box
        sx={{
          width: "100%",
          pl: type === "Course" ? "6px" : "0",
          pr: type === "Course" ? "6px" : "8px",
          py: "6px",
          fontSize: "14px",
          lineHeight: "20px",
          fontWeight: "500",
          color: ["Completed", "In Progress", "Enrolled, not started"].includes(
            status ?? ""
          )
            ? "#50EE42"
            : "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center", // Center the content
          gap: "8px",
        }}
      >
        {type === "Course" ? (
          _card?.isHideProgress ? (
            <StatusIcon status={status ?? ""} />
          ) : (
            <CircularProgressWithLabel
              value={trackProgress !== undefined ? trackProgress : 100}
              _text={{
                sx: {
                  color: [
                    "completed",
                    "In Progress",
                    "Enrolled, not started",
                  ].includes(status ?? "")
                    ? theme.palette.success.main
                    : "white",
                  fontSize: "10px",
                  ...(trackProgress === undefined ? { display: "none" } : {}),
                },
              }}
              color={
                ["Completed", "In Progress", "Enrolled, not started"].includes(
                  status ?? ""
                )
                  ? theme.palette.success.main
                  : "white"
              }
              size={trackProgress !== undefined ? 35 : 16}
              thickness={trackProgress !== undefined ? 2 : 4}
            />
          )
        ) : (
          <CircularProgressWithLabel
            value={trackProgress !== undefined ? trackProgress : 100}
            _text={{
              sx: {
                color: [
                  "completed",
                  "In Progress",
                  "Enrolled, not started",
                ].includes(status ?? "")
                  ? theme.palette.success.main
                  : "white",
                fontSize: "10px",
                ...(trackProgress === undefined ? { display: "none" } : {}),
              },
            }}
            color={
              ["Completed", "In Progress", "Enrolled, not started"].includes(
                status ?? ""
              )
                ? theme.palette.success.main
                : "white"
            }
            size={trackProgress !== undefined ? 35 : 16}
            thickness={trackProgress !== undefined ? 2 : 4}
          />
        )}
        <Typography
          variant="h3"
          component="div"
          sx={{
            minWidth: "81px",
            // fontSize: '14px',
            // lineHeight: '20px',
            letterSpacing: "0.1px",
            verticalAlign: "middle",
          }}
        >
          <SpeakableText>{status}</SpeakableText>
        </Typography>
      </Box>
    </Box>
  );
};

interface StatusIconProps {
  status: string;
}

const StatusIcon: React.FC<StatusIconProps> = ({ status }) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return <CheckCircleIcon />;
    case "in progress":
      return <AdjustIcon />;
    case "enrolled, not started":
      return <TripOriginOutlinedIcon />;
    default:
      return <PanoramaFishEyeIcon />;
  }
};

export default StatusIcon;
