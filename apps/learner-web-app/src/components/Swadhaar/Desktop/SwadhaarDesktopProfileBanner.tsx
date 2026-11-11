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
  completedModules: number;
  totalModules: number;
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
        <ProfileAvatar initials={getInitials(userName)} imageUrl={profileImageUrl || '/images/home_profile_default.png'} size={56} primaryColor={PRIMARY} />
      </Box>

      {/* Name + Designation */}
      <Box sx={{ minWidth: 160, flexShrink: 0 }}>
        <Typography sx={{ fontFamily: 'Open sans', fontWeight: 700, fontSize: 24, color: '#fff', lineHeight: 1.2 }}>
          {t('LEARNER_APP.HOME.GREETING', { name: userName })}
        </Typography>
        <Typography sx={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>
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
            <Box key={level.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, minWidth: 140 }}>
              {/* Badge Icon */}
              <Box
                sx={{
                  width: 48, height: 48, borderRadius: '50%',
                  bgcolor: isLocked ? 'transparent' : (isCompleted ? '#4CAF50' : '#E6873C'),
                  border: isLocked ? '1.5px solid #6B7280' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  opacity: isLocked ? 0.8 : 1,
                  position: 'relative',
                  boxShadow: isCompleted ? '0 0 12px rgba(76,175,80,0.3)' : (isLocked ? 'none' : '0 0 12px rgba(230,135,60,0.3)'),
                  overflow: 'hidden'
                }}
              >
                {isLocked ? (
                  <LockRoundedIcon sx={{ fontSize: 24, color: '#6B7280', position: 'relative', zIndex: 1 }} />
                ) : (
                  <>
                    <Box sx={{ position: 'absolute', width: 12, height: 12, bgcolor: '#FFFFFF', borderRadius: '50%', top: '42%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                    <img
                      src={isCompleted ? '/assets/images/badge-incomplete.png' : '/assets/images/badge-incomplete.png'}
                      alt="badge"
                      style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0, position: 'relative', zIndex: 1 }}
                    />
                  </>
                )}
              </Box>

              {/* Text + Progress Bar Column */}
              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                <Typography
                  title={level.name}
                  sx={{
                    fontFamily: 'Inter',
                    fontSize: 14, fontWeight: 800,
                    color: isLocked ? 'rgba(255,255,255,0.35)' : '#fff',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: 260,
                    textAlign: 'center',
                  }}
                >
                  {level.name}
                </Typography>

                {!isLocked && (
                  <Box sx={{ width: '100%' }}>
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

                <Typography
                  sx={{
                    fontFamily: 'Inter',
                    fontSize: 11.5, fontWeight: 600,
                    color: isLocked ? 'rgba(255,255,255,0.25)' : '#999999',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textAlign: 'center',
                  }}
                >
                  {isLocked
                    ? t('LEARNER_APP.HOME.LOCKED')
                    : `${level.completedModules}/${level.totalModules} ${t('LEARNER_APP.HOME.MODULES_COMPLETED')}`}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default SwadhaarDesktopProfileBanner;
