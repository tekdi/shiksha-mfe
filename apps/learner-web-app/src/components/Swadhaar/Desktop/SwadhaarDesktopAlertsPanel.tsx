'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, IconButton, CircularProgress, Divider, Collapse, Snackbar,
} from '@mui/material';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import {
  WatchLater as WatchLaterIcon,
  Description as DescriptionIcon,
  MenuBook as MenuBookIcon,
  Person as PersonIcon,
  EmojiEvents as EmojiEventsIcon,
  Info as InfoIcon,
  Group as GroupIcon,
  Lock as LockIcon,
  ChevronRight as ChevronRightIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import {
  AlertCard,
  getAlerts,
  markAsRead,
  markAllAsReadLocal,
  fetchAndSyncAlerts,
} from '@learner/utils/alertsStore';
import { markNotificationsRead } from '@learner/utils/API/NotificationService';
import { useTranslation } from '@shared-lib';

const PRIMARY = '#E6873C';
const DARK_NAV = '#1C2B4A';

/* ── helpers ────────────────────────────────────── */

function getTypeIcon(type: AlertCard['type'], isLocked?: boolean) {
  const color = isLocked ? '#9CA3AF' : PRIMARY;
  switch (type) {
    case 'quiz':     return <WatchLaterIcon sx={{ fontSize: 40, color }} />;
    case 'content':  return <DescriptionIcon sx={{ fontSize: 40, color }} />;
    case 'lesson':   return <MenuBookIcon sx={{ fontSize: 40, color }} />;
    case 'feedback': return <GroupIcon sx={{ fontSize: 40, color: isLocked ? '#9CA3AF' : '#E6873C' }} />;
    case 'badge':
    case 'completion': return <EmojiEventsIcon sx={{ fontSize: 40, color: isLocked ? '#9CA3AF' : '#E6873C' }} />;
    default:         return <InfoIcon sx={{ fontSize: 40, color }} />;
  }
}

function groupByDate(alerts: AlertCard[]): Array<{ label: string; items: AlertCard[] }> {
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();
  const groups: Record<string, AlertCard[]> = {};
  const orderedKeys: string[] = [];
  alerts.forEach((alert) => {
    const d = new Date(alert.timestamp);
    const dateStr = d.toDateString();
    let label: string;
    if (dateStr === today) label = 'Today';
    else if (dateStr === yesterday) label = 'Yesterday';
    else label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    if (!groups[label]) { groups[label] = []; orderedKeys.push(label); }
    groups[label].push(alert);
  });
  return orderedKeys.map((key) => ({ label: key, items: groups[key] }));
}

/* ── Props ─────────────────────────────────────── */

interface SwadhaarDesktopAlertsPanelProps {
  userId: string;
  onClose: () => void;
}

/* ── Component ──────────────────────────────────── */

const SwadhaarDesktopAlertsPanel: React.FC<SwadhaarDesktopAlertsPanelProps> = ({
  userId,
  onClose,
}) => {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<AlertCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [toastOpen, setToastOpen] = useState(false);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      if (userId) {
        const synced = await fetchAndSyncAlerts(userId);
        setAlerts(synced);
      } else {
        setAlerts(getAlerts());
      }
    } catch {
      setAlerts(getAlerts());
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  const handleAlertClick = (alert: AlertCard) => {
    if (alert.locked) {
      setToastMsg(alert.lockedMessage || t('LEARNER_APP.ALERTS.LOCKED_MESSAGE'));
      setToastOpen(true);
      return;
    }
    // Mark read locally + server (fire-and-forget)
    markAsRead(alert.id);
    setAlerts((prev) => prev.map((a) => (a.id === alert.id ? { ...a, isRead: true } : a)));
    if (userId) markNotificationsRead(userId, [alert.id]).catch(() => {});
    // Toggle expanded view in-place
    setExpandedId((prev) => (prev === alert.id ? null : alert.id));
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      await markNotificationsRead(userId, [], true);
      markAllAsReadLocal();
      setAlerts(getAlerts());
    } catch {
      markAllAsReadLocal();
      setAlerts(getAlerts());
    } finally {
      setLoading(false);
    }
  };

  const groups = groupByDate(alerts);
  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <Box
      id="swadhaar-desktop-alerts-panel"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: '#F4F6FA',
      }}
    >
      {/* ── Panel header ── */}
      <Box
        sx={{
          bgcolor: DARK_NAV,
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexShrink: 0,
        }}
      >
        <NotificationsActiveIcon sx={{ fontSize: 18, color: PRIMARY }} />
        <Typography
          sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 14, color: '#fff', flex: 1 }}
        >
          {t('LEARNER_APP.ALERTS.TITLE')}
          {unreadCount > 0 && (
            <Box
              component="span"
              sx={{
                ml: 1,
                bgcolor: PRIMARY,
                borderRadius: '10px',
                px: 0.75,
                py: 0.1,
                fontSize: 11,
                fontWeight: 700,
                color: '#fff',
                display: 'inline-block',
              }}
            >
              {unreadCount}
            </Box>
          )}
        </Typography>

        <IconButton
          size="small"
          onClick={handleMarkAllRead}
          disabled={loading || unreadCount === 0}
          sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff' }, p: 0.5 }}
          title="Mark all read"
        >
          <DoneAllIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <IconButton
          size="small"
          onClick={loadAlerts}
          disabled={loading}
          sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff' }, p: 0.5 }}
          title="Refresh"
        >
          <RefreshRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff' }, p: 0.5 }}
          title="Close"
        >
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* ── Alert list ── */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 1.5 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress sx={{ color: PRIMARY }} size={28} />
          </Box>
        ) : alerts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Box
              sx={{
                width: 52, height: 52, borderRadius: '50%',
                bgcolor: 'rgba(230,135,60,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 1.5,
              }}
            >
              <NotificationsActiveIcon sx={{ fontSize: 24, color: PRIMARY }} />
            </Box>
            <Typography sx={{ fontFamily: 'Inter, sans-serif', color: '#9CA3AF', fontSize: 13 }}>
              {t('LEARNER_APP.ALERTS.NO_NOTIFICATIONS')}
            </Typography>
          </Box>
        ) : (
          groups.map((group, gi) => (
            <Box key={group.label} sx={{ mb: 2 }}>
              {/* Date label */}
              <Typography
                sx={{
                  fontSize: 10, color: '#9CA3AF', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: 0.8,
                  fontFamily: 'Inter, sans-serif', mb: 0.75, px: 0.5,
                }}
              >
                {group.label}
              </Typography>

              {group.items.map((alert, idx) => {
                const isExpanded = expandedId === alert.id;
                const isLocked = !!alert.locked;
                const bodyText = alert.metadata?.messageBody || alert.message;

                return (
                  <Box key={alert.id}>
                    {/* ── Alert row ── */}
                    <Box
                      id={`swadhaar-desktop-alert-${alert.id}`}
                      onClick={() => handleAlertClick(alert)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.25,
                        px: 1.5,
                        py: 1.25,
                        mb: 0.5,
                        borderRadius: '10px',
                        bgcolor: isLocked
                          ? '#F3F4F6'
                          : alert.isRead
                            ? '#F9FAFB'
                            : '#FFFFFF',
                        border: isLocked
                          ? '1px solid #E5E7EB'
                          : alert.isRead
                            ? '1px solid #E5E7EB'
                            : '1px solid rgba(230,135,60,0.25)',
                        boxShadow: (!alert.isRead && !isLocked) ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        opacity: isLocked ? 0.7 : 1,
                        transition: 'all 0.15s',
                        '&:hover': {
                          bgcolor: isLocked ? '#F3F4F6' : isExpanded ? '#FEF3E8' : '#FEF9F4',
                        },
                      }}
                    >
                      {/* Icon */}
                      <Box
                        sx={{
                          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                          bgcolor: isLocked ? 'rgba(156,163,175,0.12)' : 'rgba(230,135,60,0.10)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          position: 'relative',
                        }}
                      >
                        {getTypeIcon(alert.type, isLocked)}
                        {isLocked && (
                          <Box sx={{
                            position: 'absolute', bottom: -2, right: -2,
                            bgcolor: '#fff', borderRadius: '50%',
                            width: 14, height: 14,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                          }}>
                            <LockIcon sx={{ fontSize: 9, color: '#9CA3AF' }} />
                          </Box>
                        )}
                      </Box>

                      {/* Text */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{
                          fontWeight: 700, fontSize: 12, color: isLocked ? '#9CA3AF' : '#1F2937',
                          fontFamily: 'Inter, sans-serif', lineHeight: 1.35,
                        }}>
                          {alert.title}
                        </Typography>
                        <Typography sx={{
                          fontSize: 11, color: '#6B7280', fontFamily: 'Inter, sans-serif',
                          overflow: 'hidden', display: '-webkit-box',
                          WebkitLineClamp: isExpanded ? undefined : 1,
                          WebkitBoxOrient: 'vertical', lineHeight: 1.4, mt: 0.2,
                        }}>
                          {isLocked
                            ? (alert.lockedMessage || t('LEARNER_APP.ALERTS.LOCKED_MESSAGE'))
                            : alert.message}
                        </Typography>
                      </Box>

                      {/* Right icon */}
                      {isLocked ? (
                        <LockIcon sx={{ fontSize: 16, color: '#9CA3AF', flexShrink: 0 }} />
                      ) : isExpanded ? (
                        <ExpandLessIcon sx={{ fontSize: 18, color: PRIMARY, flexShrink: 0 }} />
                      ) : (
                        <ExpandMoreIcon sx={{ fontSize: 18, color: '#9CA3AF', flexShrink: 0 }} />
                      )}
                    </Box>

                    {/* ── Expanded detail card ── */}
                    <Collapse in={isExpanded} timeout={200}>
                      <Box
                        sx={{
                          mx: 1, mb: 1,
                          p: 1.5,
                          bgcolor: '#fff',
                          border: `1px solid rgba(230,135,60,0.2)`,
                          borderRadius: '10px',
                          boxShadow: '0 2px 8px rgba(230,135,60,0.08)',
                        }}
                      >
                        {/* Full message body */}
                        <Typography
                          sx={{
                            fontFamily: 'Inter, sans-serif', fontSize: 12,
                            color: '#374151', lineHeight: 1.6,
                          }}
                        >
                          {bodyText}
                        </Typography>

                        {/* Sender info (feedback alerts) */}
                        {alert.metadata?.senderName && (
                          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <PersonIcon sx={{ fontSize: 14, color: PRIMARY }} />
                            <Typography sx={{ fontSize: 11, color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
                              {alert.metadata.senderName}
                              {alert.metadata.senderDesignation && ` · ${alert.metadata.senderDesignation}`}
                              {alert.metadata.senderLocation && ` · ${alert.metadata.senderLocation}`}
                            </Typography>
                          </Box>
                        )}

                        {/* Timestamp */}
                        <Typography
                          sx={{
                            fontSize: 10, color: '#9CA3AF', fontFamily: 'Inter, sans-serif',
                            mt: 1, textAlign: 'right',
                          }}
                        >
                          {new Date(alert.timestamp).toLocaleString('en-IN', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </Typography>
                      </Box>
                    </Collapse>

                    {idx < group.items.length - 1 && (
                      <Divider sx={{ my: 0.25, borderColor: '#F3F4F6' }} />
                    )}
                  </Box>
                );
              })}
            </Box>
          ))
        )}
      </Box>

      {/* Toast for locked alerts */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        onClose={() => setToastOpen(false)}
        message={toastMsg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            bgcolor: DARK_NAV, fontFamily: 'Inter, sans-serif', fontSize: 12, borderRadius: '10px',
          },
        }}
      />
    </Box>
  );
};

export default SwadhaarDesktopAlertsPanel;
