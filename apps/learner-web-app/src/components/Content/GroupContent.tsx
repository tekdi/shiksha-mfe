"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Breadcrumbs,
  Link,
  IconButton,
} from "@mui/material";
import { ArrowBack, Description } from "@mui/icons-material";
import { CommonCard } from "@shared-lib";
import { getGroupContentDetails } from "@learner/utils/API/GroupService";
import { trackingData } from "@content-mfes/services/TrackingService";
import { getUserCertificates } from "@content-mfes/services/Certificate";

interface GroupContentItem {
  id: string;
  title: string;
  description: string;
  keywords?: string[];
  type: "video" | "document" | "quiz" | "assignment" | "course";
  duration?: string;
  progress?: number;
  imageUrl?: string;
  isCompleted?: boolean;
  difficulty?: "beginner" | "intermediate" | "advanced";
  se_boards?: string[];
  se_mediums?: string[];
  se_gradeLevels?: string[];
  se_subjects?: string[];
  targetBoardIds?: string[];
  targetMediumIds?: string[];
  targetGradeLevelIds?: string[];
  targetSubjectIds?: string[];
  mimeType?: string;
  identifier?: string;
}

interface GroupContentProps {
  groupId: string;
  groupName: string;
  onBack: () => void;
  onContentClick?: (content: GroupContentItem) => void;
  isLoading?: boolean;
}

const LIMIT = 10;
const DEFAULT_FILTERS = {
  limit: LIMIT,
  offset: 0,
};

const GroupContent: React.FC<GroupContentProps> = ({
  groupId,
  groupName,
  onBack,
  onContentClick,
  isLoading = false,
}) => {
  const [content, setContent] = useState<GroupContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackData, setTrackData] = useState<Record<string, unknown>[]>([]);
  const [localFilters] = useState<
    typeof DEFAULT_FILTERS & {
      type?: string;
      query?: string;
      filters?: object;
      identifier?: string;
    }
  >(DEFAULT_FILTERS);

  // Helper function to determine actual status and progress
  const getContentStatus = (
    trackItem: any,
    certificates: any[],
    contentItem: GroupContentItem
  ) => {
    const certificate = certificates.find(
      (cert) => cert.courseId === contentItem.id
    );

    // If no tracking data but enrolled, show "Enrolled, not started"
    if (!trackItem && certificate?.status === "enrolled") {
      return {
        status: "Enrolled, not started",
        progress: 0,
        enrolled: true,
      };
    }

    // If no tracking data and not enrolled
    if (!trackItem) {
      return {
        status: "Not started",
        progress: 0,
        enrolled: false,
      };
    }

    // Calculate progress based on tracking data
    let progress = 0;
    let status = "Not started";

    // For courses with leafNodes, calculate percentage based on completed_list
    if (
      contentItem.type === "course" &&
      trackItem.completed_list &&
      trackItem.in_progress_list
    ) {
      const totalItems =
        (trackItem.completed_list || []).length +
        (trackItem.in_progress_list || []).length;
      const completedItems = (trackItem.completed_list || []).length;
      progress =
        totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    } else {
      // For regular content, use simple progress calculation
      progress = trackItem.completed ? 100 : trackItem.in_progress ? 50 : 0;
    }

    // Determine status based on progress and tracking data
    if (trackItem.completed || progress === 100) {
      status = "Completed";
    } else if (trackItem.in_progress || progress > 0) {
      status = "In Progress";
    } else if (certificate?.status === "enrolled") {
      status = "Enrolled, not started";
    } else {
      status = "Not started";
    }

    return {
      status,
      progress,
      enrolled: certificate?.status === "enrolled",
    };
  };

  // Fetch group content from API using composite search
  useEffect(() => {
    const fetchGroupContent = async () => {
      setLoading(true);
      try {
        const contentDetails = await getGroupContentDetails(groupId);
        console.log("Content details from composite search:", contentDetails);

        // Transform API response to match our interface
        const transformedContent = contentDetails.map(
          (item: Record<string, unknown>) => ({
            id: String(item.identifier || item.id || ""),
            title: String(item.name || item.title || "Untitled Content"),
            description: String(item.description || item.summary || ""),
            keywords: Array.isArray(item.keywords) ? item.keywords : [],
            type: (item.mimeType === "application/vnd.ekstep.content-collection"
              ? "course"
              : item.mimeType === "application/vnd.ekstep.ecml-archive"
              ? "video"
              : item.mimeType === "application/vnd.sunbird.questionset"
              ? "quiz"
              : "video") as
              | "video"
              | "document"
              | "quiz"
              | "assignment"
              | "course",
            duration: String(item.duration || item.timeLimit || ""),
            progress: 0, // Will be calculated from tracking data
            isCompleted: false, // Will be calculated from tracking data
            difficulty: (item.difficulty === "intermediate"
              ? "intermediate"
              : item.difficulty === "advanced"
              ? "advanced"
              : "beginner") as "beginner" | "intermediate" | "advanced",
            imageUrl: String(item.posterImage || item.appIcon || ""),
            mimeType: String(item.mimeType || ""),
            identifier: String(item.identifier || ""),
            // Framework metadata
            se_boards: Array.isArray(item.se_boards) ? item.se_boards : Array.isArray(item.targetBoardIds) ? item.targetBoardIds : undefined,
            se_mediums: Array.isArray(item.se_mediums) ? item.se_mediums : Array.isArray(item.targetMediumIds) ? item.targetMediumIds : undefined,
            se_gradeLevels: Array.isArray(item.se_gradeLevels) ? item.se_gradeLevels : Array.isArray(item.targetGradeLevelIds) ? item.targetGradeLevelIds : undefined,
            se_subjects: Array.isArray(item.se_subjects) ? item.se_subjects : Array.isArray(item.targetSubjectIds) ? item.targetSubjectIds : undefined,
            targetBoardIds: Array.isArray(item.targetBoardIds) ? item.targetBoardIds : undefined,
            targetMediumIds: Array.isArray(item.targetMediumIds) ? item.targetMediumIds : undefined,
            targetGradeLevelIds: Array.isArray(item.targetGradeLevelIds) ? item.targetGradeLevelIds : undefined,
            targetSubjectIds: Array.isArray(item.targetSubjectIds) ? item.targetSubjectIds : undefined,
          })
        );
        setContent(transformedContent);
        console.log("Transformed content:", transformedContent);

        const courseList = transformedContent
          .map((item) => item.id)
          .filter((id): id is string => id !== undefined);
        console.log("courseList======", courseList);

        // Fetch TrackData for enrollment status
        if (transformedContent.length > 0) {
          try {
            const getUserId = (userIdLocalstorageName?: string) => {
              const key = userIdLocalstorageName || "userId";
              return localStorage.getItem(key) || "";
            };

            const userId = getUserId("userId");
            console.log("userId======", userId);

            if (userId) {
              const userIdArray = userId.split(",").filter(Boolean);

              // Fetch both tracking data and certificates
              const [trackDataResponse, certificatesResponse] =
                await Promise.all([
                  trackingData(userIdArray, courseList),
                  getUserCertificates({
                    userId: userId,
                    courseId: courseList,
                    limit: localFilters.limit,
                    offset: localFilters.offset,
                  }),
                ]);

              console.log("trackDataResponse======", trackDataResponse);
              console.log("certificatesResponse======", certificatesResponse);

              const certificates = certificatesResponse?.result?.data || [];

              if (trackDataResponse?.data) {
                const userTrackData =
                  trackDataResponse.data.find(
                    (course: Record<string, unknown>) =>
                      course.userId === userId
                  )?.course ?? [];

                console.log("userTrackData======", userTrackData);

                const processedTrackData = transformedContent.map(
                  (contentItem) => {
                    const trackItem = userTrackData.find(
                      (item: Record<string, unknown>) =>
                        item.courseId === contentItem.id
                    );

                    console.log(`Processing ${contentItem.id}:`, {
                      trackItem,
                      contentItem,
                    });

                    const { status, progress, enrolled } = getContentStatus(
                      trackItem,
                      certificates,
                      contentItem
                    );

                    console.log(`Status for ${contentItem.id}:`, {
                      status,
                      progress,
                      enrolled,
                    });

                    return {
                      courseId: contentItem.id,
                      status: status,
                      percentage: progress,
                      progress: progress,
                      completed: status === "Completed",
                      enrolled: enrolled,
                      // Include all original tracking data for debugging
                      ...trackItem,
                    };
                  }
                );

                setTrackData(processedTrackData);
                console.log("Final processed TrackData:", processedTrackData);
              } else {
                // If no tracking data, create default track data based on certificates
                const defaultTrackData = transformedContent.map(
                  (contentItem) => {
                    const { status, progress, enrolled } = getContentStatus(
                      null,
                      certificates,
                      contentItem
                    );

                    return {
                      courseId: contentItem.id,
                      status: status,
                      percentage: progress,
                      progress: progress,
                      completed: status === "Completed",
                      enrolled: enrolled,
                    };
                  }
                );
                setTrackData(defaultTrackData);
                console.log(
                  "Default TrackData (no tracking response):",
                  defaultTrackData
                );
              }
            }
          } catch (trackError) {
            console.error("Error fetching TrackData (Groups):", trackError);
            // Set default track data on error
            const defaultTrackData = transformedContent.map((contentItem) => ({
              courseId: contentItem.id,
              status: "Not started",
              percentage: 0,
              progress: 0,
              completed: false,
              enrolled: false,
            }));
            setTrackData(defaultTrackData);
          }
        }
      } catch (error) {
        console.error("Error fetching group content:", error);
        setContent([]);
        setTrackData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupContent();
  }, [groupId, localFilters.limit, localFilters.offset]);

  const handleContentClick = (contentItem: GroupContentItem) => {
    if (onContentClick) {
      const transformedContent = {
        ...contentItem,
        mimeType:
          contentItem.type === "video"
            ? "application/vnd.ekstep.video"
            : contentItem.type === "document"
            ? "application/vnd.ekstep.html-archive"
            : contentItem.type === "quiz"
            ? "application/vnd.sunbird.questionset"
            : contentItem.type === "course"
            ? "application/vnd.ekstep.content-collection"
            : contentItem.type === "assignment"
            ? "application/vnd.ekstep.html-archive"
            : "application/vnd.ekstep.html-archive",
        identifier: contentItem.id,
        name: contentItem.title,
        posterImage: contentItem.imageUrl,
      };
      onContentClick(transformedContent);
    }
  };

  if (loading || isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "300px",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Loading group content...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          variant="body2"
          onClick={onBack}
          sx={{
            textDecoration: "none",
            color: "primary.main",
            cursor: "pointer",
            "&:hover": {
              textDecoration: "underline",
            },
          }}
        >
          Groups
        </Link>
        <Typography variant="body2" color="text.primary">
          {groupName}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={onBack} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              color: "#1F1B13",
              mb: 1,
            }}
          >
            {groupName}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {content.length} content items available
          </Typography>
        </Box>
      </Box>

      {content.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "300px",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Description sx={{ fontSize: 64, color: "text.secondary" }} />
          <Typography variant="h6" color="text.secondary">
            No content available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Content will appear here once it&apos;s added to this group
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={{ xs: 1, sm: 1, md: 2 }}>
          {content.map((item) => {
            const itemTrackData = trackData.find(
              (track: Record<string, unknown>) => track.courseId === item.id
            );
            console.log(`Rendering card for ${item.id}:`, itemTrackData);

            return (
              <Grid item xs={6} sm={6} md={4} lg={3} xl={2.4} key={item.id}>
                <CommonCard
                  minheight="100%"
                  title={item.title}
                  image={item.imageUrl || ""}
                  description={item.description || ""}
                  content={null}
                  actions={null}
                  orientation="horizontal"
                  item={{
                    identifier: item.id,
                    name: item.title,
                    mimeType: item.type,
                    posterImage: item.imageUrl || "",
                    description: item.description,
                    keywords: item.keywords || [],
                    gradeLevel: [],
                    language: [],
                    artifactUrl: "",
                    appIcon: "",
                    contentType: item.type,
                    // Framework metadata
                    se_boards: item.se_boards,
                    se_mediums: item.se_mediums,
                    se_gradeLevels: item.se_gradeLevels,
                    se_subjects: item.se_subjects,
                    targetBoardIds: item.targetBoardIds,
                    targetMediumIds: item.targetMediumIds,
                    targetGradeLevelIds: item.targetGradeLevelIds,
                    targetSubjectIds: item.targetSubjectIds,
                  }}
                  type={item.type}
                  TrackData={trackData}
                  onClick={() => handleContentClick(item)}
                  _card={{
                    _contentParentText: {
                      // Match content cards for consistent title height
                      sx: { height: "50px" },
                    },
                    _cardMedia: { sx: { maxHeight: "132px" } },
                    sx: {
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    },
                  }}
                />
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default GroupContent;
