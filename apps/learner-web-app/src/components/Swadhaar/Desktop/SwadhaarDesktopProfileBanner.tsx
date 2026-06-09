'use client';

import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import ProfileAvatar from '@learner/components/Profile/ProfileAvatar';
import { useTranslation } from '@shared-lib';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';

const PRIMARY = '#E6873C';
const SUCCESS = '#4CAF50';
const DARK_NAV = '#1C2B4A';
const GOLD = '#EDB712';

interface LevelChipData {
  id: string;
  name: string;
  completionPercentage: number;
  isUnlocked: boolean;
}

interface SwadhaarDesktopProfileBannerProps {
  userName: string;
  designation: string;
  profileImageUrl: string | null;
  levels: LevelChipData[];
  onProfileClick: () => void;
}

/* ── Circular progress ring for in-progress levels ── */
const LevelRing: React.FC<{ percentage: number }> = ({ percentage }) => {
  const size = 36;
  const stroke = 3;
  const r = (size / 2) - (stroke / 2);
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(percentage, 100) / 100) * circ;

  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0 }}>
        {/* Track */}
        <circle stroke="#E0E0E0" strokeWidth={stroke} fill="transparent" r={r} cx={size / 2} cy={size / 2} />
        {/* Progress arc */}
        {percentage > 0 && (
          <circle
            stroke={PRIMARY}
            strokeWidth={stroke}
            fill="transparent"
            r={r}
            cx={size / 2}
            cy={size / 2}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          />
        )}
      </svg>
      <Typography sx={{ fontSize: 8, fontWeight: 800, color: PRIMARY, lineHeight: 1, zIndex: 1 }}>
        {Math.round(percentage)}%
      </Typography>
    </Box>
  );
};

/* ── Main component ── */
const SwadhaarDesktopProfileBanner: React.FC<SwadhaarDesktopProfileBannerProps> = ({
  userName, designation, profileImageUrl, levels, onProfileClick,
}) => {
  const { t } = useTranslation();

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <Box
      id="swadhaar-desktop-profile-banner"
      sx={{
        bgcolor: DARK_NAV,
        borderRadius: '16px',
        p: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 2.5,
        mb: 2.5,
        boxShadow: '0 4px 20px rgba(28,43,74,0.18)',
      }}
    >
      {/* Avatar */}
      <Box
        onClick={onProfileClick}
        sx={{ cursor: 'pointer', flexShrink: 0, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.05)' } }}
      >
        <ProfileAvatar initials={getInitials(userName)} imageUrl={profileImageUrl} size={56} primaryColor={PRIMARY} />
      </Box>

      {/* Name + Designation */}
      <Box sx={{ minWidth: 160, flexShrink: 0 }}>
        <Typography sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 17, color: '#fff', lineHeight: 1.2 }}>
          {t('LEARNER_APP.HOME.GREETING', { name: userName })}
        </Typography>
        <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>
          {t('LEARNER_APP.PROFILE.FIELD_DESIGNATION')}: {designation}
        </Typography>
      </Box>

      {/* Divider */}
      <Box sx={{ width: '1px', bgcolor: 'rgba(255,255,255,0.12)', height: 44, flexShrink: 0, mx: 1 }} />

      {/* Level Chips */}
      <Box sx={{ 
        display: 'flex', alignItems: 'center', gap: 3.5, flex: 1, overflowX: 'auto', justifyContent: 'flex-end', pl: 2,
        '&::-webkit-scrollbar': { display: 'none' },
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        {levels.map((level) => {
          const isCompleted = level.completionPercentage >= 70;
          const isLocked = !level.isUnlocked;
          const perc = Math.round(level.completionPercentage);

          return (
            <Box key={level.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 180 }}>
              {/* Badge Icon (Vertically Centered relative to Name+Progress+Bar) */}
              <Box
                sx={{
                  width: 48, height: 48, borderRadius: '50%',
                  bgcolor: '#FFFFFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  opacity: isLocked ? 0.6 : 1,
                  boxShadow: isCompleted ? '0 0 12px rgba(237,183,18,0.3)' : 'none',
                  overflow: 'hidden'
                }}
              >
                <img 
                  src={isCompleted ? '/assets/images/badge-complete.png' : '/assets/images/badge-incomplete.png'} 
                  alt="badge" 
                  style={{ width: 32, height: 32, objectFit: 'contain' }} 
                />
              </Box>

              {/* Text + Progress Bar Column */}
              <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                <Typography
                  sx={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 14, fontWeight: 700,
                    color: isLocked ? 'rgba(255,255,255,0.35)' : '#fff',
                    whiteSpace: 'nowrap', lineHeight: 1.2,
                  }}
                >
                  {level.name}
                </Typography>
                
                <Typography
                  sx={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 10, fontWeight: 600,
                    color: isLocked ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.5)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isLocked ? t('LEARNER_APP.HOME.LOCKED') : isCompleted ? `${t('LEARNER_APP.HOME.PROGRESS')}: 100% ${t('LEARNER_APP.HOME.COMPLETED')}` : `${t('LEARNER_APP.HOME.PROGRESS')}: ${perc}% ${t('LEARNER_APP.HOME.COMPLETED')}`}
                </Typography>

                {!isLocked && (
                  <Box sx={{ width: '100%', mt: 0.5 }}>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(perc, 100)}
                      sx={{
                        height: 4.5,
                        borderRadius: 3,
                        bgcolor: 'rgba(255,255,255,0.1)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: isCompleted ? SUCCESS : PRIMARY,
                          borderRadius: 3,
                        },
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default SwadhaarDesktopProfileBanner;
