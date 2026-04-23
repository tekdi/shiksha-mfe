/* eslint-disable @nx/enforce-module-boundaries */
import React from 'react';
import {
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { usePathname } from 'next/navigation';
import SpeakableText from '@shared-lib-v2/lib/textToSpeech/SpeakableText';
import { useTranslation } from '@shared-lib-v2/lib/context/LanguageContext';
import { useTenant } from '@learner/context/TenantContext';
import { alpha } from '@mui/material/styles';
const ProfileMenu = ({
  anchorEl,
  open,
  onClose,
  onProfileClick,
  onLogout,
}: any) => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { contentFilter } = useTenant();

  const primaryColor = contentFilter?.theme?.primaryColor || '#E6873C';
  const secondaryColor = contentFilter?.theme?.secondaryColor || '#1A1A1A';
  const backgroundColor = contentFilter?.theme?.backgroundColor || '#FFFFFF';
  const hoverBg = alpha(primaryColor, 0.12);
  const selectedBg = alpha(primaryColor, 0.18);
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        elevation: 3,
        sx: {
          borderRadius: 2,
          overflow: 'visible',
          width: 280,
          padding: 0,
          bgcolor: backgroundColor,
          border: `1px solid ${alpha(secondaryColor, 0.08)}`,
        },
      }}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ marginTop: '90px' }}
    >
      {/* Profile Section */}
      <MenuItem
        onClick={() => {
          onProfileClick();
          onClose();
        }}
        sx={{
          bgcolor: pathname === '/profile' ? selectedBg : 'transparent',
          '&:hover': {
            bgcolor: hoverBg,
          },
          py: 1.5,
          px: 2,
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
        >
          <Box display="flex" alignItems="center" gap={1}>
            <AccountCircleIcon sx={{ color: secondaryColor }} />
            <Typography variant="body1" fontWeight={500} sx={{ color: secondaryColor }}>
              <SpeakableText>{t('COMMON.GO_TO_MY_PROFILE')}</SpeakableText>
            </Typography>
          </Box>
          <ArrowForwardIosIcon sx={{ fontSize: 16, color: secondaryColor }} />
        </Box>
      </MenuItem>

      <Divider />

      {/* Logout Button */}
      <Box sx={{ px: 2, py: 2 }}>
        <Button
          variant="outlined"
          fullWidth
          onClick={() => {
            onLogout();
            onClose();
          }}
          endIcon={<LogoutIcon />}
          sx={{
            borderRadius: '24px',
            textTransform: 'none',
            fontWeight: 500,
            borderColor: primaryColor,
            color: primaryColor,
            '&:hover': {
              borderColor: primaryColor,
              backgroundColor: alpha(primaryColor, 0.1),
            },
          }}
        >
          <SpeakableText>{t('COMMON.LOGOUT')}</SpeakableText>
        </Button>
      </Box>
    </Menu>
  );
};

export default ProfileMenu;
