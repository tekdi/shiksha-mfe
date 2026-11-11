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
  ArrowForwardRounded as ArrowForwardRoundedIcon,
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
      return <GroupIcon sx={{ color, width: '40.33px', height: '29.33px' }} />;
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
  isExpanded?: boolean;
}

export const AlertListRow: React.FC<AlertListRowProps> = ({ alert, onClick, isExpanded }) => {
  const { t } = useTranslation();
  const isLocked = alert.locked;
  const isClickable = !isLocked;
  const bodyText = alert.metadata?.messageBody || alert.message;

  return (
    <Box
      sx={{
        mb: 1,
        borderRadius: '8px',
        bgcolor: isLocked ? '#F3F4F6' : alert.isRead ? '#F9FAFB' : '#FFFFFF',
        border: isLocked ? '1px solid #E5E7EB' : '1px solid #E6873C',
        boxShadow: 'none',
        transition: 'background 0.15s',
        overflow: 'hidden',
        '&:hover': { bgcolor: isLocked ? '#F3F4F6' : isClickable ? '#FEF3E8' : (alert.isRead ? '#F9FAFB' : '#FFFFFF') },
      }}
    >
      <Box
        onClick={() => isClickable && onClick(alert)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 1.5,
          py: 1.5,
          cursor: isLocked ? 'not-allowed' : isClickable ? 'pointer' : 'default',
          opacity: isLocked ? 0.65 : 1,
        }}
      >
        {/* Icon Circle */}
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            bgcolor: isLocked ? '#9CA3AF' : (alert.type === 'feedback' ? 'transparent' : '#E6873C'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          {alert.type === 'feedback'
            ? getTypeIcon(alert.type, isLocked)
            : React.cloneElement(getTypeIcon(alert.type, isLocked) as React.ReactElement, { sx: { color: '#fff', fontSize: 24 } })}

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
          sx={
            alert.type === 'feedback'
              ? {
                  fontWeight: 700,
                  fontSize: '12px',
                  color: '#1A1A1A',
                  fontFamily: 'Inter',
                  fontStyle: 'normal',
                  lineHeight: 1.4,
                }
              : {
                  fontWeight: 700,
                  fontSize: 12,
                  color: isLocked ? '#9CA3AF' : '#1A1A1A',
                  fontFamily: 'Inter',
                  lineHeight: 1.4,
                }
          }
        >
          {alert.type === 'feedback' 
            ? (alert.metadata?.senderDesignation === 'District Incharge' ? 'District Incharge Feedback Received' : 'Trainer Feedback Received')
            : ((typeof window !== 'undefined' && (localStorage.getItem('userRole') === 'DI' || localStorage.getItem('userRole') === 'DISTRICT INCHARGE' || localStorage.getItem('userRole') === 'ARM') && (alert.metadata?.senderDesignation === 'District Incharge' || alert.metadata?.senderDesignation === 'CFL' || alert.title?.includes('Alert from District Incharge') || alert.title?.includes('Alert from CFL'))) 
                ? 'Raise to ARM Alert' 
                : alert.title)}
        </Typography>

        <Typography
          sx={{
            fontSize: 12,
            color: '#6B7280',
            fontFamily: 'Inter, sans-serif',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 1,
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
          ) : !isExpanded ? (
            <ArrowForwardRoundedIcon sx={{ color: '#E6873C', fontSize: 20 }} />
          ) : null}
        </Box>
      </Box>

      {/* ── Expanded detail card ── */}
      <Box sx={{ overflow: 'hidden' }}>
        <Box
          sx={{
            maxHeight: isExpanded ? '500px' : '0px',
            opacity: isExpanded ? 1 : 0,
            transition: 'all 0.3s ease-in-out',
            mx: 2, mb: isExpanded ? 2 : 0, mt: isExpanded ? -1 : 0,
            p: isExpanded ? 1.5 : 0,
            bgcolor: '#fff',
            border: isExpanded ? `1px solid #E5E7EB` : 'none',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
          }}
        >
          {isExpanded && (
            <>
              <Typography sx={{ fontWeight: 700, fontSize: 12, color: '#1F2937', mb: 1, fontFamily: 'Inter, sans-serif' }}>
                Message
              </Typography>
              <Typography
                sx={{
                  fontFamily: 'Inter, sans-serif', fontSize: 12,
                  color: '#4B5563', lineHeight: 1.6,
                }}
              >
                {bodyText}
              </Typography>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

/* ── AlertDateGroup ────────────────────────────────────────────── */

interface AlertDateGroupProps {
  label: string;
  alerts: AlertCard[];
  onAlertClick: (alert: AlertCard) => void;
  expandedId?: string | null;
}

export const AlertDateGroup: React.FC<AlertDateGroupProps> = ({
  label,
  alerts,
  onAlertClick,
  expandedId,
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
        <AlertListRow 
          key={alert.id} 
          alert={alert} 
          onClick={onAlertClick} 
          isExpanded={expandedId === alert.id}
        />
      ))}
    </Box>
  );
};