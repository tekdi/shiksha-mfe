"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Stack,
} from "@mui/material";
import { Group, School } from "@mui/icons-material";
import {
  getMyCohorts,
  transformCohortToGroup,
  getGroupContentCount,
} from "@learner/utils/API/GroupService";
import { useTenant } from "@learner/context/TenantContext";

interface CohortData {
  cohortStatus?: string;
  cohortMemberStatus?: string;
  [key: string]: string | number | boolean | undefined;
}

interface GroupItem {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  contentCount: number;
  imageUrl?: string;
  category?: string;
  createdDate?: string;
  creatorName?: string;
  creatorAvatar?: string;
}

interface GroupsProps {
  onGroupClick?: (group: GroupItem) => void;
  isLoading?: boolean;
}

const Groups: React.FC<GroupsProps> = ({ onGroupClick, isLoading = false }) => {
  const { contentFilter } = useTenant();
  
  // Get tenant colors
  const primaryColor = contentFilter?.theme?.primaryColor || "#E6873C";
  const secondaryColor = contentFilter?.theme?.secondaryColor || "#1A1A1A";
  const backgroundColor = contentFilter?.theme?.backgroundColor || "#F5F5F5";
  
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch groups from API
  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const response = await getMyCohorts();
        // Filter only active groups
        const activeGroups = response.result.filter(
          (cohort: CohortData) =>
            (cohort.cohortStatus === "active" || !cohort.cohortStatus) &&
            (cohort.cohortMemberStatus === "active" ||
              !cohort.cohortMemberStatus)
        );
        const transformedGroups = activeGroups.map(transformCohortToGroup);
        console.log("Transformed groups:", transformedGroups); // Debug log

        // Fetch content count for each group
        const groupsWithContentCount = await Promise.all(
          transformedGroups.map(async (group, index) => {
            console.log(`Processing group ${index + 1}:`, {
              id: group.id,
              name: group.name,
            }); // Debug log
            const contentCount = await getGroupContentCount(group.id);
            console.log(
              `Group ${group.name} (${group.id}) has ${contentCount} content items`
            ); // Debug log
            return {
              ...group,
              contentCount: contentCount,
            };
          })
        );

        console.log("Groups with content count:", groupsWithContentCount); // Debug log
        console.log(
          "Final groups data:",
          groupsWithContentCount.map((g) => ({
            id: g.id,
            name: g.name,
            contentCount: g.contentCount,
          }))
        ); // Debug log
        setGroups(groupsWithContentCount);
      } catch (error) {
        console.error("Error fetching groups:", error);
        // Fallback to empty array on error
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const handleGroupClick = (group: GroupItem) => {
    if (onGroupClick) {
      onGroupClick(group);
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
          Loading groups...
        </Typography>
      </Box>
    );
  }

  if (groups.length === 0) {
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
        <Group sx={{ fontSize: 64, color: "text.secondary" }} />
        <Typography variant="h6" color="text.secondary">
          No groups available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Groups will appear here once they are created
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, backgroundColor: backgroundColor }}>
      <Typography
        variant="h5"
        sx={{
          mb: 3,
          fontWeight: 500,
          color: secondaryColor,
        }}
      >
        Study Groups
      </Typography>

      <Grid container spacing={3}>
        {groups.map((group) => (
          <Grid item xs={12} sm={6} md={4} key={group.id}>
            <Box
              onClick={() => handleGroupClick(group)}
              sx={{
                backgroundColor: '#fff',
                position: 'relative',
                cursor: 'pointer',
                transition: 'transform 0.2s ease-in-out',
                boxShadow: '0 0.15rem 1.75rem 0 rgba(33, 40, 50, 0.15)',
                border: '1px solid rgba(0, 0, 0, .125)',
                minHeight: '317px',
                borderRadius: '.25rem',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  transform: 'scale(1.02)',
                },
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'relative',
                  zIndex: 1,
                  p: 2,
                }}
              >
                {/* Placeholder for group image or icon */}
                <Box sx={{ margin: '8px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', backgroundColor: backgroundColor }}>
                  <Group sx={{ fontSize: 80, color: primaryColor, opacity: 0.3 }} />
                </Box>

                {/* Title */}
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 400,
                    textAlign: 'center',
                    fontSize: '16px',
                    letterSpacing: '1px',
                    lineHeight: 1.2,
                    mt: 1,
                    mb: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: secondaryColor,
                    px: '16px',
                  }}
                  title={group.name}
                >
                  {group.name}
                </Typography>

                {/* Content Count */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%',
                    alignItems: 'center',
                    px: 2,
                    pb: 2,
                    mt: 'auto',
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <School sx={{ fontSize: 16, color: secondaryColor }} />
                    <Typography variant="body2" sx={{ color: secondaryColor }}>
                      {group.contentCount} contents
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Groups;
