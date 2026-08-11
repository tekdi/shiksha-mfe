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
  ArrowForwardRounded as ArrowForwardRoundedIcon,
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
  const color = type === 'feedback' ? '#E6873C' : '#FFFFFF';
  switch (type) {
    case 'quiz':     return <WatchLaterIcon sx={{ fontSize: 24, color }} />;
    case 'content':  return <DescriptionIcon sx={{ fontSize: 24, color }} />;
    case 'lesson':   return <MenuBookIcon sx={{ fontSize: 24, color }} />;
    case 'feedback': return <GroupIcon sx={{ width: '40.33px', height: '29.33px', color }} />;
    case 'badge':
    case 'completion': return <EmojiEventsIcon sx={{ fontSize: 24, color }} />;
    default:         return <InfoIcon sx={{ fontSize: 24, color }} />;
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
  onUnreadCountChange?: (count: number) => void;
}

/* ── Component ──────────────────────────────────── */

const SwadhaarDesktopAlertsPanel: React.FC<SwadhaarDesktopAlertsPanelProps> = ({
  userId,
  onClose,
  onUnreadCountChange,
}) => {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<AlertCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [toastOpen, setToastOpen] = useState(false);
  const [sessionReadIds, setSessionReadIds] = useState<Set<string>>(new Set());

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
    // Track that we read this during the current session so it doesn't disappear
    setSessionReadIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(alert.id);
      return newSet;
    });

    // Mark read locally + server (fire-and-forget)
    markAsRead(alert.id);
    const updatedAlerts = alerts.map((a) => (a.id === alert.id ? { ...a, isRead: true } : a));
    setAlerts(updatedAlerts);
    // Notify parent so the bell badge count updates immediately
    const newUnread = updatedAlerts.filter((a) => !a.isRead).length;
    onUnreadCountChange?.(newUnread);
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
      const updated = getAlerts();
      setAlerts(updated);
      onUnreadCountChange?.(0);
    } catch {
      markAllAsReadLocal();
      const updated = getAlerts();
      setAlerts(updated);
      onUnreadCountChange?.(0);
    } finally {
      setLoading(false);
    }
  };

  const visibleAlerts = alerts.filter((a) => !a.isRead || sessionReadIds.has(a.id));
  const groups = groupByDate(visibleAlerts);
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
          // bgcolor: DARK_NAV,
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexShrink: 0,
          // borderBottom: '2px solid rgba(230,135,60,0.4)',
        }}
      >
        {/* <NotificationsActiveIcon sx={{ fontSize: 18, color: PRIMARY }} /> */}
        <Typography
          sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 10, color: '#background: #9E9E9E', flex: 1, textTransform: 'uppercase', letterSpacing: 0.8 }}
        >
          {t('LEARNER_APP.HOME.ALERTS_TITLE')}
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
                textTransform: 'none',
                letterSpacing: 0,
              }}
            >
              {unreadCount}
            </Box>
          )}
        </Typography>

        {/* <IconButton
          size="small"
          onClick={handleMarkAllRead}
          disabled={loading || unreadCount === 0}
          sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff' }, p: 0.5 }}
          title="Mark all read"
        >
          <DoneAllIcon sx={{ fontSize: 18 }} />
        </IconButton> */}
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
        ) : visibleAlerts.length === 0 ? (
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
            <Typography sx={{ fontFamily: 'Open Sans', color: '#9CA3AF', fontSize: 13 }}>
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
                  fontFamily: 'Open Sans', mb: 0.75, px: 0.5,
                }}
              >
                {group.label}
              </Typography>

              {group.items.map((alert, idx) => {
                const isExpanded = expandedId === alert.id;
                const isLocked = !!alert.locked;
                const bodyText = alert.metadata?.messageBody || alert.message;

                return (
                  <Box 
                    key={alert.id}
                    id={`swadhaar-desktop-alert-${alert.id}`}
                    sx={{
                      mb: 1,
                      borderRadius: '8px',
                      bgcolor: isLocked ? '#F3F4F6' : alert.isRead ? '#F9FAFB' : '#FFFFFF',
                      border: isLocked ? '1px solid #E5E7EB' : '1px solid #E6873C',
                      boxShadow: 'none',
                      transition: 'all 0.15s',
                      overflow: 'hidden',
                      '&:hover': {
                        bgcolor: isLocked ? '#F3F4F6' : isExpanded ? '#FEF3E8' : '#FEF9F4',
                      },
                    }}
                  >
                    {/* ── Alert row (Header) ── */}
                    <Box
                      onClick={() => handleAlertClick(alert)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        px: 1.5,
                        py: 1.5,
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        opacity: isLocked ? 0.7 : 1,
                      }}
                    >
                      {/* Icon */}
                      <Box
                        sx={{
                          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                          bgcolor: isLocked ? '#9CA3AF' : (alert.type === 'feedback' ? 'transparent' : '#E6873C'),
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
                          fontWeight: 700, fontSize: '12px', color: isLocked ? '#9CA3AF' : '#1F2937',
                          fontFamily: 'Inter, sans-serif', lineHeight: 1.35,
                        }}>
                          {alert.type === 'feedback' && alert.metadata?.senderName
                            ? `${alert.metadata.senderDesignation === 'District Incharge' ? t('CFL_DASHBOARD.DISTRICT_INCHARGE') : 'Trainer'} Feedback Received from ${alert.metadata.senderName}`
                            : alert.title}
                        </Typography>
                        <Typography sx={{
                          fontSize: (alert.type === 'feedback' && alert.metadata?.senderName) ? '10px' : '11px', 
                          color: '#6B7280', fontFamily: 'Inter, sans-serif',
                          overflow: 'hidden', display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical', lineHeight: 1.4, mt: 0.2,
                          fontWeight: 400
                        }}>
                          {isLocked
                            ? (alert.lockedMessage || t('LEARNER_APP.ALERTS.LOCKED_MESSAGE'))
                            : (alert.type === 'feedback' && alert.metadata?.senderName
                               ? `${alert.metadata.senderDesignation || t('CFL_DASHBOARD.CFL_INCHARGE')} - ${alert.metadata.senderLocation || 'CFL Jharkhand'}`
                               : alert.message)}
                        </Typography>
                      </Box>

                      {/* Right icon */}
                      {isLocked ? (
                        <LockIcon sx={{ fontSize: 18, color: '#9CA3AF', flexShrink: 0 }} />
                      ) : !isExpanded ? (
                        <ArrowForwardRoundedIcon sx={{ fontSize: 20, color: PRIMARY, flexShrink: 0 }} />
                      ) : null}
                    </Box>

                    {/* ── Expanded detail card ── */}
                    <Collapse in={isExpanded} timeout={200}>
                      <Box
                        sx={{
                          mx: 2, mb: 2,
                          p: 1.5,
                          bgcolor: '#fff',
                          border: `1px solid #E5E7EB`,
                          borderRadius: '8px',
                        }}
                      >
                        <Typography sx={{ fontWeight: 600, fontSize: '10px', color: '#1A1A1A', mb: 1, fontFamily: 'Open Sans' }}>
                          Message
                        </Typography>
                        {/* Full message body */}
                        <Typography
                          sx={{
                            fontFamily: 'Inter', fontSize: '10px', fontWeight: 400,
                            color: '#4B5563', lineHeight: 1.6,
                          }}
                        >
                          {bodyText}
                        </Typography>

                        {/* Timestamp + read indicator */}
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                          <Typography
                            sx={{
                              fontSize: 10, color: '#9CA3AF', fontFamily: 'Inter',
                            }}
                          >
                            {new Date(alert.timestamp).toLocaleString('en-IN', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                            })}
                          </Typography>
                          {/* Double tick — shown when read */}
                          {/* <DoneAllIcon
                            sx={{
                              fontSize: 14,
                              color: alert.isRead ? '#3B82F6' : '#9CA3AF',
                            }}
                          /> */}
                        </Box>
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
