import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  useTheme,
} from '@mui/material';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import {
  getLocalStoredUserName,
  syncUserDataToCookies,
  needsUserDataSync,
} from '../services/LocalStorageService';

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
const loginUrl = process.env.NEXT_PUBLIC_ADMIN_LOGIN_URL;

const WorkspaceHeader = () => {
  const router = useRouter();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const theme = useTheme<any>();

  // Sync user data from localStorage to cookies on component mount
  useEffect(() => {
    if (needsUserDataSync()) {
      console.log('WorkspaceHeader: User data sync needed, performing sync...');
      syncUserDataToCookies();
    }
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    Cookies.remove('token');
    Cookies.remove('refreshToken');
    Cookies.remove('userId');
    Cookies.remove('userData');
    Cookies.remove('adminInfo');
    window.location.href = '/logout';
    // setAnchorEl(null);
    // if (loginUrl) {
    //   window.parent.location.href = loginUrl;
    //   localStorage.clear();
    // }
  };

  const handleMenuCollapse = () => {
    setAnchorEl(null);
  };

  const userName = getLocalStoredUserName();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 20px',
        background: 'linear-gradient(to right, white, #F8EFDA)',
        borderBottom: '1px solid #ddd',
      }}
    >
      <Typography
        variant="h2"
        sx={{
          color: '#635E57',
          marginRight: '10px',
          fontSize: '22px',
          fontWeight: 400,
          '@media (max-width: 900px)': { paddingLeft: '34px' },
        }}
      >
        Admin Workspace
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar sx={{ width: 32, height: 32, mr: 1 }} />
        <Typography variant="body1">{userName}</Typography>
        <IconButton onClick={handleMenuOpen} size="small">
          <ArrowDropDownIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuCollapse}
          PaperProps={{ elevation: 3 }}
        >
          <MenuItem onClick={handleMenuClose}>Logout</MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default WorkspaceHeader;
