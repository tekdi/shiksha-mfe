'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Badge } from '@mui/material';
import Image from 'next/image';
import CircleNotificationsRoundedIcon from '@mui/icons-material/CircleNotificationsRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import { useTranslation } from '@shared-lib';

const PRIMARY = '#E6873C';
const DARK_NAV = '#1C2B4A';

interface CFLDesktopHeaderProps {
  unreadCount: number;
  alertsPanelOpen?: boolean;
  onAlertsClick?: () => void;
  onEditProfile?: () => void;
  onLogout: () => void;
}

const CFLDesktopHeader: React.FC<CFLDesktopHeaderProps> = ({
  unreadCount,
  alertsPanelOpen = false,
  onAlertsClick,
  onEditProfile,
  onLogout,
}) => {
  const { t } = useTranslation();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  return (
    <Box
      id="cfl-desktop-header"
      sx={{
        bgcolor: '#fff',
        px: 4,
        py: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 200,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        borderBottom: '1px solid #F3F4F6',
      }}
    >
      {/* Logo & Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: '8px',
            overflow: 'hidden',
            flexShrink: 0,
            // bgcolor: PRIMARY,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Image
            src="/images/swadhar_logo.png"
            alt="CFL Logo"
            width={32}
            height={32}
            style={{ objectFit: 'contain' }}
          />
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 800,
            color: DARK_NAV,
            fontSize: '20px',
          }}
        >
          CFL Incharge
        </Typography>
      </Box>

      {/* Right actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        {/* Alerts */}
        <Box
          onClick={onAlertsClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            cursor: 'pointer',
            px: 1.5,
            py: 0.5,
            borderRadius: '8px',
            transition: 'background 0.15s',
            bgcolor: alertsPanelOpen || unreadCount > 0
              ? 'rgba(230,135,60,0.12)'
              : 'transparent',
            '&:hover': { bgcolor: 'rgba(230,135,60,0.18)' },
          }}
        >
          <Badge
            badgeContent={unreadCount > 0 ? unreadCount : null}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: 9,
                height: 16,
                minWidth: 16,
                backgroundColor: PRIMARY,
                color: '#fff',
                top: 2,
                right: 2,
              },
            }}
          >
            <CircleNotificationsRoundedIcon
              sx={{ fontSize: 22, color: alertsPanelOpen || unreadCount > 0 ? PRIMARY : '#6B7280' }}
            />
          </Badge>
          <Typography
            sx={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 13,
              fontWeight: 600,
              color: alertsPanelOpen || unreadCount > 0 ? PRIMARY : '#1F2937',
            }}
          >
            Alerts
          </Typography>
        </Box>

        {/* Profile — with dropdown */}
        <Box ref={menuRef} sx={{ position: 'relative' }}>
          <Box
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              cursor: 'pointer',
              px: 1.5,
              py: 0.5,
              borderRadius: '8px',
              transition: 'background 0.15s',
              '&:hover': { bgcolor: 'rgba(28,43,74,0.07)' },
              bgcolor: profileMenuOpen ? 'rgba(28,43,74,0.07)' : 'transparent',
            }}
          >
            <PersonRoundedIcon sx={{ fontSize: 22, color: '#1F2937' }} />
            <Typography
              sx={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                fontWeight: 600,
                color: '#1F2937',
              }}
            >
              Profile
            </Typography>
          </Box>

          {/* Dropdown menu */}
          {profileMenuOpen && (
            <Box
              sx={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                bgcolor: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                p: 1,
                minWidth: 180,
                zIndex: 500,
              }}
            >
              {/* Edit Profile */}
              <Box
                onClick={() => {
                  setProfileMenuOpen(false);
                  onEditProfile?.();
                }}
                sx={{
                  bgcolor: PRIMARY,
                  borderRadius: '8px',
                  px: 2,
                  py: 1.25,
                  mb: 0.75,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'background 0.15s',
                  '&:hover': { bgcolor: '#D4762B' },
                }}
              >
                <Typography
                  sx={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: 13,
                    color: '#fff',
                  }}
                >
                  Edit Profile
                </Typography>
              </Box>

              {/* Logout */}
              <Box
                onClick={() => {
                  setProfileMenuOpen(false);
                  onLogout();
                }}
                sx={{
                  border: '1.5px solid #E5E7EB',
                  borderRadius: '8px',
                  px: 2,
                  py: 1.25,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'background 0.15s',
                  '&:hover': { bgcolor: '#FEF2F2', borderColor: '#FECACA' },
                }}
              >
                <Typography
                  sx={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    fontSize: 13,
                    color: '#EF4444',
                  }}
                >
                  Logout
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CFLDesktopHeader;
