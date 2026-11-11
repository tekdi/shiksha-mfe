'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Badge, Avatar, Select, MenuItem, FormControl, SelectChangeEvent } from '@mui/material';
import Image from 'next/image';
import CircleNotificationsRoundedIcon from '@mui/icons-material/CircleNotificationsRounded';

import { useTranslation } from '@shared-lib';
import { LANGUAGE_OPTIONS } from '@learner/utils/constants/language';

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
  const { t, language, setLanguage } = useTranslation();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLangChange = (e: SelectChangeEvent<string>) => {
    setLanguage(e.target.value);
    if (typeof window !== 'undefined') localStorage.setItem('lang', e.target.value);
  };

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
            width={55}
            height={55}
            style={{ objectFit: 'contain', borderRadius: '10px' }}
          />
        </Box>
        {/* <Typography
          variant="h6"
          sx={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 800,
            color: DARK_NAV,
            fontSize: '20px',
          }}
        >
          CFL Incharge
        </Typography> */}
      </Box>

      {/* Right actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        
        {/* ── Language ── */}
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <Select
            id="cfl-header-language-select"
            value={language || 'en'}
            onChange={handleLangChange}
            sx={{
              borderRadius: '8px',
              fontFamily: 'Open Sans',
              fontSize: 15,
              fontWeight: 600,
              height: 34,
              color: '#757575',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#E5E7EB',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: PRIMARY,
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: PRIMARY,
              },
            }}
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value} sx={{ fontFamily: 'Open Sans', fontSize: 15,color:'#757575' }}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

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
              fontFamily: 'Open Sans',
              fontSize: 15,
              fontWeight: 600,
              color: alertsPanelOpen || unreadCount > 0 ? PRIMARY : '#757575',
            }}
          >
            {t("CFL_DASHBOARD.ALERTS")}
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
            <img src="/assets/images/material-symbols_account-circle%20(2).png" width={24} height={24} alt="Profile" />
            <Typography
              sx={{
                fontFamily: 'Open Sans',
                fontSize: 15,
                fontWeight: 600,
                color: '#757575',
              }}
            >
              {t("CFL_DASHBOARD.PROFILE")}
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
                    fontFamily: 'Open Sans',
                    fontWeight: 600,
                    fontSize: 15,
                    color: '#fff',
                  }}
                >
                  {t('LEARNER_APP.EDIT_PROFILE.TITLE')}
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
                    fontFamily: 'Open Sans',
                    fontWeight: 600,
                    fontSize: 15,
                    color: '#E53935',
                  }}
                >
                  {t("CFL_DASHBOARD.LOGOUT")}
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
