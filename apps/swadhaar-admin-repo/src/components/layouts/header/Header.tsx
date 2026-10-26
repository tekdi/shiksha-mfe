import React, { useState, useEffect, useMemo } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  MenuItem,
  Select,
  Menu,
  Avatar,
  Chip,
  Tooltip,
  Breadcrumbs,
  useColorScheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import TranslateIcon from '@mui/icons-material/Translate';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Link from 'next/link';
import { useRouter } from 'next/router';
import LogoIcon from '../logo/LogoIcon';
import LayoutService, { UserProfileSummary } from '@/services/LayoutService';

interface HeaderProps {
  toggleMobileSidebar?: () => void;
  sx?: any;
}

interface BreadcrumbSegment {
  label: string;
  href?: string;
}

const PEOPLE: BreadcrumbSegment = { label: 'People' };
const LEARNING: BreadcrumbSegment = { label: 'Learning' };
const OPERATIONS: BreadcrumbSegment = { label: 'Operations' };
const USERS: BreadcrumbSegment = { label: 'Users', href: '/users' };
const GROUPS: BreadcrumbSegment = { label: 'Groups', href: '/cohorts' };
const LEARNING_PATHS: BreadcrumbSegment = { label: 'Learning Paths', href: '/learning-paths' };
const CONTENT: BreadcrumbSegment = { label: 'Content', href: '/content' };

const isEditQuery = () => typeof window !== 'undefined' && window.location.search.includes('id=');

interface BreadcrumbRule {
  matches: (path: string) => boolean;
  crumbs: () => BreadcrumbSegment[];
}

/** Ordered rules: the first matching rule wins. */
const BREADCRUMB_RULES: BreadcrumbRule[] = [
  {
    matches: (p) => p === '/' || p === '/dashboard',
    crumbs: () => [OPERATIONS, { label: 'Dashboard', href: '/dashboard' }],
  },
  { matches: (p) => p === '/users', crumbs: () => [PEOPLE, USERS] },
  { matches: (p) => p === '/users/bulk-upload', crumbs: () => [PEOPLE, USERS, { label: 'Bulk Upload' }] },
  { matches: (p) => p.startsWith('/users/'), crumbs: () => [PEOPLE, USERS, { label: 'User Details' }] },
  { matches: (p) => p === '/cohorts' || p === '/groups', crumbs: () => [PEOPLE, GROUPS] },
  {
    matches: (p) => p === '/cohorts/create' || p === '/groups/create',
    crumbs: () => [PEOPLE, GROUPS, { label: 'Create Group' }],
  },
  {
    matches: (p) => p.startsWith('/cohorts/') || p.startsWith('/groups/'),
    crumbs: () => [PEOPLE, GROUPS, { label: 'Group Details' }],
  },
  { matches: (p) => p === '/learning-paths', crumbs: () => [LEARNING, LEARNING_PATHS] },
  {
    matches: (p) => p === '/learning-paths/builder',
    crumbs: () => [LEARNING, LEARNING_PATHS, { label: 'Path Builder' }],
  },
  {
    matches: (p) => p === '/content/create-video',
    crumbs: () => [LEARNING, CONTENT, { label: isEditQuery() ? 'Edit Video' : 'Add Video' }],
  },
  {
    matches: (p) => p === '/content/create-pdf',
    crumbs: () => [LEARNING, CONTENT, { label: isEditQuery() ? 'Edit Document' : 'Add Document' }],
  },
  {
    matches: (p) => p === '/content/create-assessment',
    crumbs: () => [LEARNING, CONTENT, { label: 'Create Assessment' }],
  },
  {
    matches: (p) => p.startsWith('/content/assessments/'),
    crumbs: () => [LEARNING, CONTENT, { label: 'Assessment Details' }],
  },
  {
    matches: (p) => p === '/content/courses/create' || p === '/courses/create',
    crumbs: () => [LEARNING, { label: 'Courses', href: '/content?tab=courses' }, { label: 'Create Course' }],
  },
  { matches: (p) => p.startsWith('/content'), crumbs: () => [LEARNING, CONTENT] },
  { matches: (p) => p === '/reports', crumbs: () => [OPERATIONS, { label: 'Reports', href: '/reports' }] },
];

const getHeaderBreadcrumbs = (pathname: string): BreadcrumbSegment[] => {
  const p = pathname.toLowerCase();
  const rule = BREADCRUMB_RULES.find((r) => r.matches(p));
  if (rule) return rule.crumbs();

  // Default fallback from pathname segments
  const segments = p.split('/').filter(Boolean);
  return segments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
    href: i < segments.length - 1 ? `/${segments.slice(0, i + 1).join('/')}` : undefined,
  }));
};

export const Header: React.FC<HeaderProps> = ({ toggleMobileSidebar, sx }) => {
  const router = useRouter();
  const { mode, setMode } = useColorScheme();
  const [profile, setProfile] = useState<UserProfileSummary>({
    userId: 'admin-01',
    name: 'Administrator',
    username: 'admin',
    roles: ['Super Admin'],
    tenantId: 'swadhaar-tenant',
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    LayoutService.getUserProfile()
      .then((data) => {
        if (data) {
          setProfile({
            ...data,
            name: data.name || 'Administrator',
            roles: data.roles?.length ? data.roles : ['Super Admin'],
          });
        }
      })
      .catch((err) => console.error('Failed to load user profile:', err));
  }, []);

  const handleLanguageChange = (e: any) => {
    const newLocale = e.target.value;
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLanguage', newLocale);
      localStorage.setItem('swadhaarLanguage', newLocale);
    }
    router.push(router.pathname, router.asPath, { locale: newLocale });
  };

  const toggleThemeMode = () => {
    const nextMode = mode === 'dark' ? 'light' : 'dark';
    setMode(nextMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('swadhaar_theme_mode', nextMode);
    }
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    router.push('/logout');
  };

  const breadcrumbs = useMemo(() => getHeaderBreadcrumbs(router.pathname), [router.pathname]);

  const getInitials = () => {
    if (profile.roles?.includes('Super Admin')) return 'SA';
    if (!profile.name) return 'SA';
    const parts = profile.name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return profile.name.slice(0, 2).toUpperCase();
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        backgroundColor: '#FFFFFF',
        color: '#1F2937',
        boxShadow: 'none',
        borderBottom: '1px solid #E5E7EB',
        zIndex: 1201,
        ...sx,
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '64px !important',
          height: '64px',
          px: 0,
        }}
      >
        {/* Top Left Corner: LogoIcon in 260px zone with right border divider */}
        <Box
          sx={{
            width: { xs: 'auto', lg: 260 },
            minWidth: { lg: 260 },
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            px: 2,
            borderRight: { xs: 'none', lg: '1px solid #E5E7EB' },
            flexShrink: 0,
          }}
        >
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleMobileSidebar}
            sx={{ display: { lg: 'none' }, mr: 1, color: '#374151' }}
          >
            <MenuIcon />
          </IconButton>
          <LogoIcon />
        </Box>

        {/* Center Section: Multi-level Clickable Breadcrumbs */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            px: { xs: 1.5, sm: 3 },
            overflow: 'hidden',
          }}
        >
          <Breadcrumbs
            separator={<NavigateNextIcon sx={{ fontSize: 14, color: '#9CA3AF' }} />}
            aria-label="breadcrumb"
            sx={{
              '& .MuiBreadcrumbs-ol': {
                flexWrap: 'nowrap',
              },
              '& .MuiBreadcrumbs-li': {
                display: 'inline-flex',
                alignItems: 'center',
                whiteSpace: 'nowrap',
              },
            }}
          >
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              if (isLast || !crumb.href) {
                return (
                  <Typography
                    key={crumb.label}
                    sx={{
                      fontSize: '13px',
                      fontWeight: isLast ? 600 : 500,
                      color: isLast ? '#111827' : '#6B7280',
                    }}
                  >
                    {crumb.label}
                  </Typography>
                );
              }
              return (
                <Link
                  key={crumb.label}
                  href={crumb.href}
                  style={{ textDecoration: 'none' }}
                >
                  <Typography
                    sx={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#4B5563',
                      transition: 'color 0.15s ease',
                      '&:hover': {
                        color: '#E6873C',
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {crumb.label}
                  </Typography>
                </Link>
              );
            })}
          </Breadcrumbs>
        </Box>

        {/* Top Right Corner: Language & Profile */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1, sm: 2 },
            pr: { xs: 1.5, sm: 3 },
            flexShrink: 0,
          }}
        >
          {/* Theme Toggle Button */}
          <Tooltip title={mode === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}>
            <IconButton onClick={toggleThemeMode} sx={{ color: '#4B5563' }} size="small">
              {mode === 'dark' ? (
                <LightModeOutlinedIcon sx={{ fontSize: 20 }} />
              ) : (
                <DarkModeOutlinedIcon sx={{ fontSize: 20 }} />
              )}
            </IconButton>
          </Tooltip>

          {/* Language Switcher */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              px: 1,
              py: 0.2,
            }}
          >
            <TranslateIcon sx={{ fontSize: 16, mr: 0.5, color: '#E6873C' }} />
            <Select
              value={router.locale || 'en'}
              onChange={handleLanguageChange}
              size="small"
              variant="standard"
              disableUnderline
              sx={{
                color: '#1F2937',
                fontSize: '13px',
                fontWeight: 600,
                '& .MuiSelect-icon': { color: '#6B7280' },
              }}
            >
              <MenuItem value="en">English (EN)</MenuItem>
              <MenuItem value="mr">मराठी (MR)</MenuItem>
              <MenuItem value="hi">हिंदी (HI)</MenuItem>
            </Select>
          </Box>

          {/* User Profile: SA Avatar + Name & Role */}
          <Box
            onClick={handleOpenUserMenu}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              cursor: 'pointer',
              py: 0.5,
              px: 0.8,
              borderRadius: '8px',
              transition: 'background-color 0.15s ease',
              '&:hover': { backgroundColor: '#F3F4F6' },
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: '#2D3748',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.5px',
              }}
            >
              {getInitials()}
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', textAlign: 'left' }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  fontSize: '13px',
                  color: '#1F2937',
                  lineHeight: 1.2,
                }}
              >
                {profile.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '11px',
                  color: '#6B7280',
                  fontWeight: 500,
                  lineHeight: 1.2,
                }}
              >
                {profile.roles?.[0] || 'Super Admin'}
              </Typography>
            </Box>
          </Box>

          {/* User Menu Dropdown */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseUserMenu}
            PaperProps={{
              sx: {
                width: 220,
                mt: 1,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                borderRadius: '10px',
                border: '1px solid #E5E7EB',
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #E5E7EB' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1F2937' }}>
                {profile.name}
              </Typography>
              <Chip
                label={profile.roles?.[0] || 'Super Admin'}
                size="small"
                sx={{
                  mt: 0.5,
                  fontSize: '10px',
                  fontWeight: 600,
                  backgroundColor: '#EFF6FF',
                  color: '#1D4ED8',
                }}
              />
            </Box>

            <MenuItem onClick={handleLogout} sx={{ py: 1.2, color: 'error.main', fontSize: '13px', fontWeight: 500 }}>
              <LogoutIcon fontSize="small" sx={{ mr: 1.2 }} />
              Log Out
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;

