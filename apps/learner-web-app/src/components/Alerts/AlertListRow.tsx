'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  Notifications as NotificationsIcon,
  WatchLater as WatchLaterIcon,
  Star as StarIcon,
  Group as GroupIcon,
  MenuBook as MenuBookIcon,
  ChevronRight as ChevronRightIcon,
  Lock as LockIcon,
  Description as DescriptionIcon,
  EmojiEvents as EmojiEventsIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { AlertCard } from '@learner/utils/alertsStore';
import { useTranslation } from "@shared-lib";

/* ── Icon Helper ─────────────────────────────────────────────── */

function getTypeIcon(type: AlertCard['type'], isLocked?: boolean) {
  const color = isLocked ? '#9CA3AF' : '#E6873C';

  switch (type) {
    case 'quiz':
      return <WatchLaterIcon sx={{ color, fontSize: 24 }} />;
    case 'content':
      return <DescriptionIcon sx={{ color, fontSize: 24 }} />;
    case 'lesson':
      return <MenuBookIcon sx={{ color, fontSize: 24 }} />;
    case 'feedback':
      return <GroupIcon sx={{ color, fontSize: 40 }} />;
    case 'badge':
    case 'completion':
      return <EmojiEventsIcon sx={{ color, fontSize: 24 }} />;
    case 'system':
    default:
      return <InfoIcon sx={{ color, fontSize: 24 }} />;
  }
}

/* ── AlertListRow ─────────────────────────────────────────────── */

interface AlertListRowProps {
  alert: AlertCard;
  onClick: (alert: AlertCard) => void;
}

export const AlertListRow: React.FC<AlertListRowProps> = ({ alert, onClick }) => {
  const { t } = useTranslation();
  const isLocked = alert.locked;
  const isClickable = alert.type === 'feedback';

  return (
    <Box
      onClick={() => isClickable && onClick(alert)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.5,
        mb: 1,
        borderRadius: '12px',
        bgcolor: isLocked ? '#F3F4F6' : alert.isRead ? '#F9FAFB' : '#FFFFFF',
        boxShadow: alert.isRead || isLocked ? 'none' : '0 2px 8px rgba(0,0,0,0.08)',
        cursor: isLocked ? 'not-allowed' : isClickable ? 'pointer' : 'default',
        transition: 'background 0.15s',
        '&:hover': { bgcolor: isLocked ? '#F3F4F6' : isClickable ? '#FEF3E8' : (alert.isRead ? '#F9FAFB' : '#FFFFFF') },
        minHeight: 72,
        border: isLocked
          ? '1px solid #E6873C'
          : alert.isRead
            ? '1px solid #E6873C'
            : '1px solid rgba(230,135,60,0.15)',
        opacity: isLocked ? 0.65 : 1,
      }}
    >
      {/* Icon Circle */}
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          bgcolor: isLocked ? 'rgba(156,163,175,0.12)' : 'rgba(230,135,60,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {getTypeIcon(alert.type, isLocked)}

        {isLocked && (
          <Box
            sx={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              bgcolor: '#fff',
              borderRadius: '50%',
              width: 18,
              height: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }}
          >
            <LockIcon sx={{ color: '#9CA3AF', fontSize: 12 }} />
          </Box>
        )}
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: 14,
            color: isLocked ? '#9CA3AF' : '#1F2937',
            fontFamily: 'Inter, sans-serif',
            lineHeight: 1.4,
          }}
        >
          {alert.title}
        </Typography>

        <Typography
          sx={{
            fontSize: 12,
            color: '#6B7280',
            fontFamily: 'Inter, sans-serif',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.5,
            mt: 0.25,
          }}
        >
          {isLocked
            ? alert.lockedMessage || t('LEARNER_APP.ALERTS.LOCKED_MESSAGE')
            : alert.message}
        </Typography>
      </Box>

      {/* Arrow or Lock */}
      <Box sx={{ flexShrink: 0 }}>
        {isLocked ? (
          <LockIcon sx={{ color: '#9CA3AF', fontSize: 18 }} />
        ) : isClickable ? (
          <ChevronRightIcon sx={{ color: '#E6873C', fontSize: 20 }} />
        ) : null}
      </Box>
    </Box>
  );
};

/* ── AlertDateGroup ────────────────────────────────────────────── */

interface AlertDateGroupProps {
  label: string;
  alerts: AlertCard[];
  onAlertClick: (alert: AlertCard) => void;
}

export const AlertDateGroup: React.FC<AlertDateGroupProps> = ({
  label,
  alerts,
  onAlertClick,
}) => {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography
        sx={{
          fontSize: 11,
          color: '#9CA3AF',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 1,
          mb: 1,
          px: 0.5,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {label}
      </Typography>

      {alerts.map((alert) => (
        <AlertListRow key={alert.id} alert={alert} onClick={onAlertClick} />
      ))}
    </Box>
  );
};