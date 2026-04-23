import * as React from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import { red } from "@mui/material/colors";
import { Box, Button, Chip, Stack } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { CircularProgressWithLabel } from "../Progress/CircularProgressWithLabel";

/**
 * Transforms image URLs from Azure Blob Storage to AWS S3 URLs
 * @param imageUrl - The image URL to transform
 * @returns Transformed image URL or fallback to logo.png
 */
const transformImageUrl = (imageUrl: string): string => {
  console.log("🖼️ CommonCard transformImageUrl - Input:", imageUrl);
  
  if (!imageUrl) {
    console.log("🖼️ CommonCard transformImageUrl - No imageUrl, returning fallback");
    return '/logo.png';
  }

  if (imageUrl.includes('https://sunbirdsaaspublic.blob.core.windows.net')) {
    console.log("🖼️ CommonCard transformImageUrl - Azure URL detected");
    
    // Handle double domain pattern
    if (
      imageUrl.includes(
        'https://sunbirdsaaspublic.blob.core.windows.net/https://sunbirdsaaspublic.blob.core.windows.net'
      )
    ) {
      console.log("🖼️ CommonCard transformImageUrl - Double domain pattern detected");
      // Extract everything after the second domain
      const urlParts = imageUrl.split(
        'https://sunbirdsaaspublic.blob.core.windows.net/https://sunbirdsaaspublic.blob.core.windows.net/'
      );
      if (urlParts.length > 1) {
        const pathAfterSecondDomain = urlParts[1];
        // Remove any existing content/content prefix to avoid duplication
        let cleanPath = pathAfterSecondDomain.replace(
          /^content\/content\//,
          ''
        );
        // Remove sunbird-content-prod/schemas/content/ if present
        cleanPath = cleanPath.replace(
          /^sunbird-content-prod\/schemas\/content\//,
          ''
        );
        // Transform to AWS S3 URL with the new pattern
        const transformedUrl = `https://s3.ap-south-1.amazonaws.com/saas-prod/content/${cleanPath}`;
        console.log("🖼️ CommonCard transformImageUrl - Double domain transformed:", transformedUrl);
        return transformedUrl;
      }
    } else {
      console.log("🖼️ CommonCard transformImageUrl - Single domain pattern detected");
      // Handle single domain pattern
      const urlParts = imageUrl.split(
        'https://sunbirdsaaspublic.blob.core.windows.net/'
      );
      if (urlParts.length > 1) {
        const pathAfterDomain = urlParts[1];
        // Remove any existing content/content prefix to avoid duplication
        let cleanPath = pathAfterDomain.replace(/^content\/content\//, '');
        // Remove sunbird-content-prod/schemas/content/ if present
        cleanPath = cleanPath.replace(
          /^sunbird-content-prod\/schemas\/content\//,
          ''
        );
        // Transform to AWS S3 URL with the new pattern
        const transformedUrl = `https://s3.ap-south-1.amazonaws.com/saas-prod/content/${cleanPath}`;
        console.log("🖼️ CommonCard transformImageUrl - Single domain transformed:", transformedUrl);
        return transformedUrl;
      }
    }
  }

  console.log("🖼️ CommonCard transformImageUrl - No transformation needed, returning original:", imageUrl);
  return imageUrl;
};
export interface ContentItem {
  name: string;
  gradeLevel: string[];
  language: string[];
  artifactUrl: string;
  identifier: string;
  appIcon: string;
  appicon?: string; // lowercase variant
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
  onClick?: () => void;
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
}) => {
  // Get keywords from item - check both direct access and type casting
  const itemKeywordsForLog = (item as any)?.keywords || item?.keywords;
  
  console.log("🎯 CommonCard - Props received:", {
    title,
    image,
    imageAlt,
    item: {
      name: item?.name,
      posterImage: item?.posterImage,
      appIcon: item?.appIcon,
      appicon: item?.appicon,
    },
    keywords: {
      direct: item?.keywords,
      casted: (item as any)?.keywords,
      final: itemKeywordsForLog,
      hasKeywords: !!itemKeywordsForLog,
      keywordsType: typeof itemKeywordsForLog,
      keywordsIsArray: Array.isArray(itemKeywordsForLog),
      keywordsLength: Array.isArray(itemKeywordsForLog) ? itemKeywordsForLog.length : 0,
    },
    itemKeys: item ? Object.keys(item) : [],
    type
  });

  const [trackCompleted, setTrackCompleted] = React.useState(0);
  const [trackProgress, setTrackProgress] = React.useState(100);

  React.useEffect(() => {
    const init = () => {
      try {
        if (TrackData) {
          const result = TrackData?.find((e) => e.courseId === item.identifier);
          if (type === "Course") {
            const leafNodes = getLeafNodes(item ?? []);
            const completedCount = result?.completed_list?.length || 0;
            const percentage =
              leafNodes.length > 0
                ? Math.round((completedCount / leafNodes.length) * 100)
                : 0;
            setTrackProgress(percentage);
            setTrackCompleted(percentage);
          } else {
            setTrackCompleted(result?.completed ? 100 : 0);
          }
        }
      } catch (e) {
        console.log("error", e);
      }
    };
    init();
  }, [TrackData, item, type]);

  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: orientation === "horizontal" ? "column" : "row",
        height: minheight || "auto",
        cursor: onClick ? "pointer" : "default",
        borderRadius: "12px",
        bgcolor: "#FEF7FF",
        boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.1)",
        overflow: "hidden",
        "&:hover": {
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.2)",
        },
        "@media (max-width: 600px)": {
          flexDirection: "column",
        },
      }}
      onClick={onClick}
    >
      {/* Image and Progress Overlay */}
      <Box sx={{ position: "relative", width: "100%" }}>
        {(() => {
          const finalImageUrl = transformImageUrl(image || '');
          return (
            <CardMedia
              component="img"
              image={finalImageUrl}
              alt={imageAlt || "Image"}
              sx={{
                width: "100%",
                height: orientation === "horizontal" ? "220px" : "auto",
                objectFit: "contain", // Changed from cover to contain to prevent cropping
                padding: "10px", // Added padding to prevent cropping
                backgroundColor: "#f5f5f5", // Added background color for better visibility
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                "@media (max-width: 600px)": {
                  height: "180px",
                  padding: "8px", // Smaller padding on mobile
                },
              }}
            />
          );
        })()}

        {/* Progress Bar Overlay */}
        {trackProgress >= 0 && (
          <Box
            sx={{
              position: "absolute",
              height: "40px",
              top: 0,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center", // Center the progress horizontally
              background: "rgba(0, 0, 0, 0.5)",
            }}
          >
            <Box
              sx={{
                p: "0px 5px",
                fontSize: "12px",
                fontWeight: "bold",
                color: trackCompleted === 100 ? "#21A400" : "#FFB74D",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                justifyContent: "center", // Center the content
              }}
            >
              {type === "Course" ? (
                <>
                  <CircularProgressWithLabel
                    value={trackProgress ?? 0}
                    _text={{
                      sx: {
                        color: trackCompleted === 100 ? "#21A400" : "#FFB74D",
                        fontSize: "10px",
                      },
                    }}
                    sx={{
                      color: trackCompleted === 100 ? "#21A400" : "#FFB74D",
                    }}
                    size={35}
                    thickness={2}
                  />
                  {trackCompleted >= 100 ? (
                    <>
                      <CheckCircleIcon sx={{ color: "#21A400" }} />
                      {`Completed`}
                    </>
                  ) : trackProgress > 0 && trackProgress < 100 ? (
                    `In progress`
                  ) : (
                    `Enrolled`
                  )}
                </>
              ) : (
                <>
                  <CircularProgressWithLabel
                    value={trackProgress ?? 0}
                    _text={{
                      sx: {
                        color: trackCompleted === 100 ? "#21A400" : "#FFB74D",
                        fontSize: "10px",
                      },
                    }}
                    sx={{
                      color: trackCompleted === 100 ? "#21A400" : "#FFB74D",
                    }}
                    size={35}
                    thickness={2}
                  />
                  {trackCompleted >= 100 ? (
                    <>
                      <CheckCircleIcon sx={{ color: "#21A400" }} />
                      {`Completed`}
                    </>
                  ) : trackProgress > 0 && trackProgress < 100 ? (
                    `In progress`
                  ) : (
                    `Enrolled`
                  )}
                </>
              )}
            </Box>
          </Box>
        )}
      </Box>

      <CardHeader
        avatar={
          avatarLetter && (
            <Avatar sx={{ bgcolor: avatarColor }} aria-label="avatar">
              {avatarLetter}
            </Avatar>
          )
        }
        title={
          <Typography
            sx={{
              fontSize: "16px",
              whiteSpace: "wrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 1,
              paddingLeft: "5px",
            }}
          >
            {title}
          </Typography>
        }
        subheader={
          <Typography variant="h6" sx={{ fontSize: "14px" }}>
            {subheader}
          </Typography>
        }
      />
      {(() => {
        // Check if we should show keywords section
        const itemKeywords = (item as any)?.keywords || item?.keywords;
        const hasKeywords = itemKeywords && Array.isArray(itemKeywords) && itemKeywords.length > 0;
        const hasContent = content && typeof content === "string" && content !== "keywords";
        
        // Debug: Log condition check
        console.log("🔎 CommonCard - Keywords section condition:", {
          itemKeywords,
          hasKeywords,
          hasContent,
          shouldShow: hasKeywords || hasContent,
        });
        
        return hasKeywords || hasContent;
      })() && (
        <CardContent
          sx={{
            paddingBottom: "12px !important",
            paddingTop: "8px !important",
            paddingX: "16px",
            "&:last-child": {
              paddingBottom: "12px",
            },
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography
              variant="body2"
              sx={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#666",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Keywords
            </Typography>
            {(() => {
              // Parse keywords from item.keywords first, then from content
              let keywordsArray: string[] = [];
              
              // Get keywords from item - check multiple possible paths
              const itemKeywords = (item as any)?.keywords || item?.keywords;
              
              // Debug: Log to check if keywords exist
              console.log("🔍 CommonCard - Checking keywords:", {
                hasItem: !!item,
                itemType: typeof item,
                itemKeys: item ? Object.keys(item) : [],
                hasKeywords: !!item?.keywords,
                hasItemKeywords: !!itemKeywords,
                keywordsType: typeof itemKeywords,
                keywordsValue: itemKeywords,
                keywordsIsArray: Array.isArray(itemKeywords),
                keywordsLength: Array.isArray(itemKeywords) ? itemKeywords.length : 0,
                content: content,
              });
              
              // Priority 1: Use item.keywords if available
              if (itemKeywords && Array.isArray(itemKeywords) && itemKeywords.length > 0) {
                keywordsArray = itemKeywords;
                console.log("✅ Using item.keywords:", keywordsArray);
              } 
              // Priority 2: Parse from content string if it contains commas
              else if (typeof content === "string" && content.includes(",") && content !== "keywords") {
                keywordsArray = content.split(",").map((k) => k.trim()).filter(Boolean);
                console.log("✅ Using content (comma-separated):", keywordsArray);
              } 
              // Priority 3: Single keyword from content string (but not "keywords")
              else if (typeof content === "string" && content.trim() && content !== "keywords") {
                keywordsArray = [content.trim()].filter(Boolean);
                console.log("✅ Using content (single):", keywordsArray);
              }
              
              console.log("📊 Final keywordsArray:", keywordsArray);
              
              if (keywordsArray.length === 0) {
                console.log("❌ No keywords found, returning null");
                return null;
              }
              
              return (
                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{
                    flexWrap: "wrap",
                    gap: 0.5,
                  }}
                >
                  {keywordsArray.slice(0, 5).map((keyword, index) => (
                    <Chip
                      key={`keyword-${index}-${keyword}`}
                      label={keyword}
                      size="small"
                      sx={{
                        fontSize: "11px",
                        height: "24px",
                        backgroundColor: "#F3EDF7",
                        color: "#6750A4",
                        fontWeight: 500,
                        borderRadius: "12px",
                        "& .MuiChip-label": {
                          padding: "0 8px",
                        },
                      }}
                    />
                  ))}
                  {keywordsArray.length > 5 && (
                    <Chip
                      key="keyword-more"
                      label={`+${keywordsArray.length - 5} more`}
                      size="small"
                      sx={{
                        fontSize: "11px",
                        height: "24px",
                        backgroundColor: "#E6E6E6",
                        color: "#666",
                        fontWeight: 500,
                        borderRadius: "12px",
                        "& .MuiChip-label": {
                          padding: "0 8px",
                        },
                      }}
                    />
                  )}
                </Stack>
              );
            })()}
          </Box>
        </CardContent>
      )}
      {children && <CardContent>{children}</CardContent>}
      {actions && (
        <CardActions>
          <Button variant="contained">{actions}</Button>
        </CardActions>
      )}
    </Card>
  );
};
