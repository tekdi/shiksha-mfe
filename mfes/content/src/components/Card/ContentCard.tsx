/* eslint-disable react-hooks/rules-of-hooks */
import React, { useMemo, useState } from "react";
import { Box, CSSObject, useTheme, Card, CardMedia, Typography, LinearProgress, Link } from "@mui/material";
import { ContentItem } from "@shared-lib";
import AppConst from "../../utils/AppConst/AppConst";
import { getBestImageUrl } from "../../utils/imageUtils";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ImageIcon from "@mui/icons-material/Image";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import PeopleIcon from "@mui/icons-material/People";

// Extended ContentItem interface to include lowercase appicon
interface ExtendedContentItem extends ContentItem {
  appicon?: string;
  keywords?: string[];
}

const ContentCard = ({
  item,
  type,
  default_img,
  _card,
  handleCardClick,
  trackData,
  isExpanded,
  onToggle,
  cardId,
}: {
  item: ExtendedContentItem;
  type: any;
  default_img?: string;
  _card?: any;
  handleCardClick: (content: ExtendedContentItem, e?: any) => void;
  trackData?: [];
  isExpanded?: boolean;
  onToggle?: (cardId: string) => void;
  cardId?: string;
}) => {
  const { isWrap } = _card ?? {};
  const primaryColorVar = "var(--primary-color, #E6873C)";
  const secondaryColorVar = "var(--secondary-color, #1A1A1A)";
  const placeholderImage = `${AppConst.BASEPATH}/assests/images/image_ver.png`;
  
  if (_card?.cardComponent) {
    return (
      <CardWrap isWrap={isWrap && type === "Course"} _card={_card}>
        <_card.cardComponent
          item={item}
          type={type}
          default_img={default_img}
          _card={_card}
          handleCardClick={handleCardClick}
          trackData={trackData}
        />
      </CardWrap>
    );
  }

  // Get thumbnail
  const finalImageUrl =
    getBestImageUrl(item, process.env.NEXT_PUBLIC_MIDDLEWARE_URL) ||
    item?.posterImage ||
    (item as any)?.appIcon ||
    (item as any)?.appicon ||
    default_img ||
    placeholderImage;

  const resolvedCardId =
    cardId || item?.identifier || `${type}-${item?.identifier ?? "card"}`;

  // Fallback local state when parent doesn't control expansion
  const [localShowDetails, setLocalShowDetails] = useState(false);
  const showDetails =
    typeof isExpanded === "boolean" ? isExpanded : localShowDetails;

  const handleToggleDetails = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();

    if (!resolvedCardId) {
      return;
    }

    if (onToggle) {
      onToggle(resolvedCardId);
    } else {
      setLocalShowDetails((prev) => !prev);
    }
  };

  const progressData = useMemo(() => {
    if ((item as any)?.isGroup) {
      return { progress: 0, status: "not_started" };
    }

    if (!trackData || !Array.isArray(trackData)) {
      return { progress: 0, status: "not_started" };
    }

    const trackItem = trackData.find(
      (track: any) => track.courseId === item.identifier
    );

    if (!trackItem) {
      return { progress: 0, status: "not_started" };
    }

    let progress = 0;
    let status = "not_started";

    // Prioritize using the percentage field if it exists (from calculateTrackDataItem)
    if (
      trackItem &&
      (typeof (trackItem as any).percentage === "number" || typeof (trackItem as any).percentage === "string")
    ) {
      const pct = (trackItem as any).percentage;
      progress = Math.min(100, Math.max(0, typeof pct === "string" ? parseFloat(pct) : pct));
      // console.log(`[ContentCard] Using percentage from trackItem for ${item.identifier}:`, {
      //   percentage: pct,
      //   calculatedProgress: progress,
      //   trackItem: { courseId: (trackItem as any).courseId, percentage: (trackItem as any).percentage, status: (trackItem as any).status }
      // });
    } else if (
      type === "Course" &&
      trackItem &&
      Array.isArray((trackItem as any).completed_list)
    ) {
      // Fallback: recalculate from completed_list if percentage is not available
      const getLeafNodes = (node: any): any[] => {
        if (!node) return [];
        if (!node.children || node.children.length === 0) {
          return [node];
        }
        return node.children.flatMap((child: any) => getLeafNodes(child));
      };

      const leafNodes = Array.isArray(getLeafNodes(item)) ? getLeafNodes(item) : [];
      const totalItems = leafNodes.length > 0 ? leafNodes.length : 1;
      const completedList = Array.isArray((trackItem as any)?.completed_list)
        ? (trackItem as any)?.completed_list
        : [];
      const completedCount = completedList.length;
      progress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
    } else {
      const completed = (trackItem as any)?.completed;
      const inProgress = (trackItem as any)?.in_progress;
      progress = completed ? 100 : inProgress ? 50 : 0;
    }

    // Use status from trackItem if available, otherwise derive from progress
    if (trackItem && (trackItem as any).status) {
      status = (trackItem as any).status;
    } else if (progress === 100) {
      status = "completed";
    } else if (progress > 0) {
      status = "in_progress";
    } else {
      status = "not_started";
    }

    return { progress, status };
  }, [trackData, item, type]);

  // Get course metadata
  const getCourseMetadata = () => {
    const metadata: string[] = [];
    
    const isGroup = (item as any)?.isGroup || false;
    const groupContentCount = (item as any)?.groupContentCount;
    const groupMemberCount = (item as any)?.groupMemberCount;
    
    if (isGroup) {
      if (groupContentCount !== undefined && groupContentCount > 0) {
        metadata.push(`${groupContentCount} ${groupContentCount === 1 ? "Content" : "Contents"}`);
      }
      if (groupMemberCount !== undefined && groupMemberCount > 0) {
        metadata.push(`${groupMemberCount} ${groupMemberCount === 1 ? "Member" : "Members"}`);
      }
      return metadata;
    }
    
    let videoCount = 0;
    let quizCount = 0;

    const mimeTypesCountRaw = (item && (item as any).mimeTypesCount);

    if (mimeTypesCountRaw) {
      try {
        const mimeTypesCount = typeof mimeTypesCountRaw === "string"
          ? JSON.parse(mimeTypesCountRaw)
          : mimeTypesCountRaw;
        
        Object.keys(mimeTypesCount).forEach((mimeType) => {
          if (mimeType?.includes("video") || mimeType === "video/x-youtube") {
            videoCount += mimeTypesCount[mimeType] || 0;
          }
          if (mimeType?.includes("quiz") || mimeType?.includes("assessment")) {
            quizCount += mimeTypesCount[mimeType] || 0;
          }
        });
      } catch (e) {
        console.error("Error parsing mimeTypesCount:", e);
      }
    }

    if (videoCount === 0 && quizCount === 0 && type === "Course" && item.children) {
      const countVideos = (node: any): number => {
        if (!node) return 0;
        let count = 0;
        if (node.mimeType?.includes("video") || node.mimeType === "video/x-youtube") {
          count = 1;
        }
        if (node.children && Array.isArray(node.children)) {
          count += node.children.reduce((sum: number, child: any) => sum + countVideos(child), 0);
        }
        return count;
      };

      const countQuizzes = (node: any): number => {
        if (!node) return 0;
        let count = 0;
        if (node.mimeType?.includes("quiz") || node.mimeType?.includes("assessment")) {
          count = 1;
        }
        if (node.children && Array.isArray(node.children)) {
          count += node.children.reduce((sum: number, child: any) => sum + countQuizzes(child), 0);
        }
        return count;
      };

      videoCount = countVideos(item);
      quizCount = countQuizzes(item);
    }

    if (videoCount > 0) {
      metadata.push(`${videoCount} ${videoCount === 1 ? "Video" : "Videos"}`);
    }
    if (quizCount > 0) {
      metadata.push(`${quizCount} ${quizCount === 1 ? "Quiz" : "Quizzes"}`);
    }

    let duration: number | string | undefined;
    if ("duration" in item && typeof item.duration === "number") {
      duration = item.duration;
    } else if ("timeLimit" in item && typeof (item as any).timeLimit === "number") {
      duration = (item as any).timeLimit;
    }

    if (duration) {
      const durationStr = typeof duration === "number" 
        ? `${Math.round(duration / 60)}min` 
        : duration;
      metadata.push(durationStr);
    }

    return metadata;
  };

  const courseMetadata = getCourseMetadata();
  const courseDescription = item?.description || "";
  const isNew = (item as any)?.createdOn &&
    new Date((item as any).createdOn).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;

  const hasMetadata = 
    courseDescription ||
    courseMetadata.length > 0 ||
    ((item as any)?.keywords?.length > 0 ||
      (item as any)?.se_boards?.length > 0 ||
      (item as any)?.se_mediums?.length > 0 ||
      (item as any)?.se_gradeLevels?.length > 0 ||
      (item as any)?.se_subjects?.length > 0 ||
      (item as any)?.targetBoardIds?.length > 0 ||
      (item as any)?.targetMediumIds?.length > 0 ||
      (item as any)?.targetGradeLevelIds?.length > 0 ||
      (item as any)?.targetSubjectIds?.length > 0);

  return (
    <CardWrap isWrap={isWrap && type === "Course"} _card={_card}>
      <Card
        key={`card-${resolvedCardId}`}
        data-card-id={resolvedCardId}
        sx={{
          display: "flex",
          flexDirection: "column",
          borderRadius: "10px",
          overflow: "hidden",
          backgroundColor: "#FFFFFF",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
          border: "1px solid rgba(0,0,0,0.08)",
          cursor: "pointer",
          transition: "all 0.3s ease",
          position: "relative",
          "&:hover": {
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.12)",
            borderColor: primaryColorVar,
            transform: "translateY(-2px)",
          },
          ..._card?.sx,
        }}
        onClick={(e: any) => handleCardClick(item, e)}
      >
        {/* Thumbnail */}
        <Box sx={{ position: "relative", width: "100%" }}>
          <CardMedia
            component="div"
            sx={{
              width: "100%",
              height: "180px",
              backgroundColor: "#F5F5F5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {finalImageUrl && finalImageUrl !== placeholderImage ? (
              <Box
                component="img"
                src={finalImageUrl}
                alt={item?.name}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <ImageIcon sx={{ fontSize: 48, color: "#1A1A1A", opacity: 0.3 }} />
            )}

            {isNew && (
              <Box
                sx={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  backgroundColor: primaryColorVar,
                  color: "#FFF",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  zIndex: 1,
                  boxShadow: "0 2px 8px rgba(230, 135, 60, 0.3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                NEW
              </Box>
            )}
            {isNew && (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(230, 135, 60, 0.15)",
                  pointerEvents: "none",
                  zIndex: 0,
                }}
              />
            )}
          </CardMedia>
        </Box>

        {/* Content Section */}
        <Box sx={{ p: 2.25, flex: 1, display: "flex", flexDirection: "column" }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: "20px",
              lineHeight: "28px",
              color: secondaryColorVar,
              mb: 0.75,
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item?.name || "Untitled"}
          </Typography>

          {/* EXPANDABLE CONTENT - Only shows for this specific card */}
          {showDetails && (
            <Box sx={{ mb: 2 }}>
              {/* Course Description */}
              {courseDescription && (
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: secondaryColorVar,
                    fontWeight: 400,
                    mb: 1.5,
                    lineHeight: "20px",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {courseDescription}
                </Typography>
              )}

              {/* Course Details */}
              {courseMetadata.length > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 2,
                    flexWrap: "wrap",
                  }}
                >
                  {courseMetadata.find((m) => m.includes("min")) && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <AccessTimeIcon sx={{ fontSize: 16, color: secondaryColorVar }} />
                      <Typography
                        sx={{
                          fontSize: "14px",
                          color: secondaryColorVar,
                          fontWeight: 500,
                        }}
                      >
                        {courseMetadata.find((m) => m.includes("min"))}
                      </Typography>
                    </Box>
                  )}

                  {(courseMetadata.find((m) => m.includes("Video")) || 
                    courseMetadata.find((m) => m.includes("Quiz")) ||
                    courseMetadata.find((m) => m.includes("Content"))) && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <VideoLibraryIcon sx={{ fontSize: 16, color: secondaryColorVar }} />
                      <Typography
                        sx={{
                          fontSize: "14px",
                          color: secondaryColorVar,
                          fontWeight: 500,
                        }}
                      >
                        {courseMetadata
                          .filter((m) => m.includes("Video") || m.includes("Quiz") || m.includes("Content"))
                          .join(", ")}
                      </Typography>
                    </Box>
                  )}

                  {courseMetadata.find((m) => m.includes("Member")) && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <PeopleIcon sx={{ fontSize: 16, color: secondaryColorVar }} />
                      <Typography
                        sx={{
                          fontSize: "14px",
                          color: secondaryColorVar,
                          fontWeight: 500,
                        }}
                      >
                        {courseMetadata.find((m) => m.includes("Member"))}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {/* Framework Metadata */}
              {((item as any)?.keywords?.length > 0 ||
                (item as any)?.se_boards?.length > 0 ||
                (item as any)?.se_mediums?.length > 0 ||
                (item as any)?.se_gradeLevels?.length > 0 ||
                (item as any)?.se_subjects?.length > 0 ||
                (item as any)?.targetBoardIds?.length > 0 ||
                (item as any)?.targetMediumIds?.length > 0 ||
                (item as any)?.targetGradeLevelIds?.length > 0 ||
                (item as any)?.targetSubjectIds?.length > 0) && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {((item as any)?.se_boards?.length > 0 || (item as any)?.targetBoardIds?.length > 0) && (
                      <Box
                        sx={{
                          backgroundColor: "rgba(0,0,0,0.04)",
                          color: secondaryColorVar,
                          px: 1,
                          py: 0.25,
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 500,
                        }}
                      >
                        Board: {Array.isArray((item as any)?.se_boards) 
                          ? (item as any).se_boards[0] 
                          : Array.isArray((item as any)?.targetBoardIds) 
                            ? (item as any).targetBoardIds[0] 
                            : ""}
                      </Box>
                    )}
                    
                    {((item as any)?.se_mediums?.length > 0 || (item as any)?.targetMediumIds?.length > 0) && (
                      <Box
                        sx={{
                          backgroundColor: "rgba(0,0,0,0.04)",
                          color: secondaryColorVar,
                          px: 1,
                          py: 0.25,
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 500,
                        }}
                      >
                        Medium: {Array.isArray((item as any)?.se_mediums) 
                          ? (item as any).se_mediums[0] 
                          : Array.isArray((item as any)?.targetMediumIds) 
                            ? (item as any).targetMediumIds[0] 
                            : ""}
                      </Box>
                    )}
                    
                    {((item as any)?.se_gradeLevels?.length > 0 || (item as any)?.targetGradeLevelIds?.length > 0) && (
                      <Box
                        sx={{
                          backgroundColor: "rgba(0,0,0,0.04)",
                          color: secondaryColorVar,
                          px: 1,
                          py: 0.25,
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 500,
                        }}
                      >
                        Grade: {Array.isArray((item as any)?.se_gradeLevels) 
                          ? (item as any).se_gradeLevels[0] 
                          : Array.isArray((item as any)?.targetGradeLevelIds) 
                            ? (item as any).targetGradeLevelIds[0] 
                            : ""}
                      </Box>
                    )}
                    
                    {((item as any)?.se_subjects?.length > 0 || (item as any)?.targetSubjectIds?.length > 0) && (
                      <Box
                        sx={{
                          backgroundColor: "rgba(0,0,0,0.04)",
                          color: secondaryColorVar,
                          px: 1,
                          py: 0.25,
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 500,
                        }}
                      >
                        Subject: {Array.isArray((item as any)?.se_subjects) 
                          ? (item as any).se_subjects[0] 
                          : Array.isArray((item as any)?.targetSubjectIds) 
                            ? (item as any).targetSubjectIds[0] 
                            : ""}
                      </Box>
                    )}
                  </Box>

                  {(item as any)?.keywords?.length > 0 && (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {(item as any).keywords.slice(0, 3).map((keyword: string, index: number) => (
                        <Box
                          key={index}
                          sx={{
                            backgroundColor: "rgba(0,0,0,0.04)",
                            color: secondaryColorVar,
                            px: 1,
                            py: 0.25,
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 500,
                          }}
                        >
                          {keyword}
                        </Box>
                      ))}
                    </Box>
                  )}            
                </Box>
              )}
            </Box>
          )}

          {/* Progress Status Bar */}
          {!(item as any)?.isGroup && (
            <Box sx={{ mt: "auto" }}>
              {progressData.status === "not_started" ? (
              <Box>
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: secondaryColorVar,
                    fontWeight: 400,
                    mb: 0.5,
                  }}
                >
                  Not Started
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={0}
                  sx={{
                    height: 8,
                    borderRadius: "4px",
                    backgroundColor: "rgba(0,0,0,0.08)",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: "rgba(0,0,0,0.12)",
                    },
                  }}
                />
              </Box>
            ) : progressData.status === "completed" ? (
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                  <Typography
                    sx={{
                      fontSize: "14px",
                    color: "#4CAF50",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 16, color: "#4CAF50" }} />
                    Complete
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "14px",
                    color: "#4CAF50",
                      fontWeight: 600,
                    }}
                  >
                    100%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={100}
                  sx={{
                    height: 8,
                    borderRadius: "4px",
                    backgroundColor: "rgba(0,0,0,0.08)",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: "#4CAF50",
                      borderRadius: "4px",
                    },
                  }}
                />
              </Box>
            ) : (
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                  <Typography
                    sx={{
                      fontSize: "14px",
                    color: primaryColorVar,
                      fontWeight: 600,
                    }}
                  >
                    In Progress
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "14px",
                    color: primaryColorVar,
                      fontWeight: 600,
                    }}
                  >
                    {progressData.progress}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progressData.progress}
                  sx={{
                    height: 8,
                    borderRadius: "4px",
                    backgroundColor: "rgba(0,0,0,0.08)",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: primaryColorVar,
                      borderRadius: "4px",
                      boxShadow: "0 2px 4px rgba(230, 135, 60, 0.3)",
                    },
                  }}
                />
              </Box>
            )}

              {/* View More/Less Link */}
              {hasMetadata && (
                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.75 }}>
                  <Link
                    component="button"
                    variant="caption"
                    onClick={handleToggleDetails}
                    sx={{
                      fontSize: "11px",
                      color: primaryColorVar,
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
              )}
            </Box>
          )}
        </Box>
      </Card>
    </CardWrap>
  );
};

// Remove memoization temporarily to debug the issue
export default ContentCard;

export const CardWrap = ({
  children,
  isWrap,
  _card,
}: {
  children: React.ReactNode;
  isWrap?: boolean;
  _card?: any;
}) => {
  const theme = useTheme();
  const borderRadius = (
    theme?.components?.MuiCard?.styleOverrides?.root as CSSObject
  )?.borderRadius;
  if (!isWrap) {
    return children;
  }
  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        mt: 1,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -8,
          zIndex: 0,
          width: _card?.sx?.width ?? "100%",
          px: 2,
        }}
      >
        <Box
          sx={{
            border: "1px solid #fff",
            boxShadow: "2px 0px 6px 2px #00000026, 1px 0px 2px 0px #0000004D",
            backgroundColor: "#DED8E1",
            height: "32px",
            borderRadius: borderRadius,
          }}
        />
      </Box>
      <Box
        sx={{
          position: "absolute",
          top: -4,
          zIndex: 0,
          width: _card?.sx?.width ?? "100%",
          px: 1,
        }}
      >
        <Box
          sx={{
            border: "1px solid #fff",
            boxShadow: "2px 0px 6px 2px #00000026, 1px 0px 2px 0px #0000004D",
            backgroundColor: "#DED8E1",
            height: "32px",
            borderRadius: borderRadius,
          }}
        />
      </Box>
      <Box sx={{ zIndex: 1, width: _card?.sx?.width ?? "100%" }}>
        {children}
      </Box>
    </Box>
  );
};