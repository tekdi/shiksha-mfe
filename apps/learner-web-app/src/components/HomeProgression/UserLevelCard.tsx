'use client';

import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import ProgressCircle from '@learner/components/shared/ProgressCircle';
import { useRouter } from 'next/navigation';

export interface LevelData {
  id: string;
  name: string;
  completedModules: number;
  totalModules: number;
  completionPercentage: number;
  isUnlocked: boolean;
}

interface UserLevelCardProps {
  userName: string;
  designation?: string;
  levels: LevelData[];
  onLevelPress?: (level: LevelData) => void;
}

const UserLevelCard: React.FC<UserLevelCardProps> = ({
  userName,
  designation,
  levels,
  onLevelPress,
}) => {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const primaryLevel = levels.find((l) => l.isUnlocked && l.completionPercentage < 100) || levels[0];
  const displayLevels = expanded ? levels : levels.filter((l) => l === primaryLevel || l.name === 'Beginner Level');

  // Unique display list - always show primary, collapse others
  const uniqueDisplay = expanded ? levels : [primaryLevel].filter(Boolean);

  return (
    <Box
      sx={{
        bgcolor: '#1C2B4A',
        borderRadius: '16px',
        p: 2.5,
        mb: 2,
        color: '#fff',
      }}
    >
      {/* User greeting */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 18, color: '#fff', fontFamily: 'Inter, sans-serif' }}>
            Namaste, {userName}!
          </Typography>
          {designation && (
            <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', mt: 0.25, fontFamily: 'Inter, sans-serif' }}>
              {designation}
            </Typography>
          )}
        </Box>
        {/* Avatar initials */}
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            bgcolor: '#E6873C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>
            {userName.charAt(0).toUpperCase()}
          </Typography>
        </Box>
      </Box>

      {/* Level rows */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {uniqueDisplay.map((level) => {
          if (!level) return null;
          const isCompleted = level.completionPercentage >= 100;
          const isLocked = !level.isUnlocked;

          return (
            <Box
              key={level.id}
              onClick={() => {
                if (!isLocked) {
                  onLevelPress?.(level);
                  router.push('/learn');
                }
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                bgcolor: 'rgba(255,255,255,0.08)',
                borderRadius: '10px',
                px: 1.5,
                py: 1.25,
                opacity: isLocked ? 0.5 : 1,
                cursor: isLocked ? 'not-allowed' : 'pointer',
                '&:hover': { bgcolor: isLocked ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.14)' },
              }}
            >
              {/* Left icon */}
              <Box sx={{ flexShrink: 0 }}>
                {isLocked ? (
                  <Typography sx={{ fontSize: 22 }}>🔒</Typography>
                ) : isCompleted ? (
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: '#28A745',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography sx={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>✓</Typography>
                  </Box>
                ) : (
                  <ProgressCircle percentage={level.completionPercentage} size={28} strokeWidth={3} />
                )}
              </Box>

              {/* Name + progress */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 13, color: '#fff', fontFamily: 'Inter, sans-serif' }}>
                    {level.name}
                  </Typography>
                  {isCompleted && <Typography sx={{ fontSize: 14 }}>🏅</Typography>}
                </Box>
                {/* Progress bar */}
                <Box sx={{ position: 'relative', height: 6, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 3 }}>
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: `${Math.min(level.completionPercentage, 100)}%`,
                      bgcolor: isCompleted ? '#28A745' : '#E6873C',
                      borderRadius: 3,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </Box>
              </Box>

              {/* Percentage / locked label */}
              <Typography
                sx={{
                  fontSize: 12,
                  color: isCompleted ? '#28A745' : 'rgba(255,255,255,0.7)',
                  fontWeight: 600,
                  flexShrink: 0,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {isLocked ? 'Locked' : isCompleted ? '100% ✅' : `${Math.round(level.completionPercentage)}%`}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* View More / View Less */}
      {levels.length > 1 && (
        <Box
          onClick={() => setExpanded((prev) => !prev)}
          sx={{
            mt: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
            cursor: 'pointer',
            opacity: 0.8,
            '&:hover': { opacity: 1 },
          }}
        >
          <Typography
            sx={{ fontSize: 13, color: '#E6873C', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}
          >
            {expanded ? 'View Less ▲' : 'View More ▼'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default UserLevelCard;
