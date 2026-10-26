import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Chip,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import HubIcon from '@mui/icons-material/Hub';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SecurityIcon from '@mui/icons-material/Security';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

interface SidebarProps {
  isSidebarOpen: boolean;
  isMobileSidebarOpen: boolean;
  onSidebarClose: () => void;
}

type MenuGroup = 'people' | 'learning';

const HOVER_BG = 'rgba(0, 0, 0, 0.04)';
const ACTIVE_COLOR = 'primary.main';
const ACTIVE_BG = 'primary.100';
const ACTIVE_HOVER_BG = 'primary.200';

const selectedStyles = {
  '&.Mui-selected': {
    backgroundColor: ACTIVE_BG,
    color: ACTIVE_COLOR,
    '&:hover': {
      backgroundColor: ACTIVE_HOVER_BG,
    },
  },
};

const getHoverStyles = (active: boolean) => ({
  '&:hover': {
    backgroundColor: active ? ACTIVE_HOVER_BG : HOVER_BG,
    color: ACTIVE_COLOR,
    '& .MuiListItemIcon-root': {
      color: ACTIVE_COLOR,
    },
  },
});

interface MainMenuButtonProps {
  label: string;
  icon: React.ReactNode;
  expanded: boolean;
  onClick: () => void;
}

/** Top-level collapsible group header (People / Learning). */
const MainMenuButton: React.FC<MainMenuButtonProps> = ({ label, icon, expanded, onClick }) => (
  <ListItemButton
    onClick={onClick}
    selected={expanded}
    sx={{
      borderRadius: '8px',
      mb: 0.5,
      py: 1,
      px: 1.5,
      color: expanded ? ACTIVE_COLOR : 'text.primary',
      backgroundColor: expanded ? ACTIVE_BG : 'transparent',
      fontWeight: 600,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      ...getHoverStyles(expanded),
      ...selectedStyles,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <ListItemIcon
        sx={{
          minWidth: 34,
          color: expanded ? ACTIVE_COLOR : 'text.secondary',
        }}
      >
        {icon}
      </ListItemIcon>
      <ListItemText
        primary={label}
        primaryTypographyProps={{
          fontSize: '13px',
          fontWeight: 600,
        }}
      />
    </Box>
    {expanded ? (
      <ArrowDropDownIcon sx={{ color: ACTIVE_COLOR, fontSize: 22 }} />
    ) : (
      <ArrowRightIcon sx={{ color: 'text.secondary', fontSize: 22 }} />
    )}
  </ListItemButton>
);

interface SubMenuLinkProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

/** Sub-menu entry rendered inside a collapsible group. */
const SubMenuLink: React.FC<SubMenuLinkProps> = ({ href, label, icon, active, onClick }) => {
  const fontWeight = active ? 600 : 500;
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <ListItemButton
        selected={active}
        onClick={onClick}
        sx={{
          borderRadius: '8px',
          mb: 0.5,
          py: 0.8,
          px: 1.5,
          pl: 3.5,
          color: active ? ACTIVE_COLOR : 'text.primary',
          backgroundColor: active ? ACTIVE_BG : 'transparent',
          fontWeight,
          ...getHoverStyles(active),
          ...selectedStyles,
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 32,
            color: active ? ACTIVE_COLOR : 'text.secondary',
          }}
        >
          {icon}
        </ListItemIcon>
        <ListItemText
          primary={label}
          primaryTypographyProps={{
            fontSize: '13px',
            fontWeight,
          }}
        />
      </ListItemButton>
    </Link>
  );
};

interface LaterMenuItemProps {
  label: string;
  badge: string;
  icon: React.ReactNode;
}

/** Disabled menu entry for features planned for a later release. */
const LaterMenuItem: React.FC<LaterMenuItemProps> = ({ label, badge, icon }) => (
  <ListItemButton
    disabled
    sx={{
      borderRadius: '8px',
      mb: 0.5,
      py: 0.8,
      px: 1.5,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      cursor: 'default !important',
      opacity: '0.85 !important',
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <ListItemIcon sx={{ minWidth: 34, color: 'text.secondary' }}>{icon}</ListItemIcon>
      <ListItemText
        primary={label}
        primaryTypographyProps={{ fontSize: '13px', fontWeight: 500, color: 'text.secondary' }}
      />
    </Box>
    <Chip
      label={badge}
      size="small"
      sx={{
        height: 18,
        fontSize: '10px',
        fontWeight: 600,
        backgroundColor: 'warning.light',
        color: 'warning.dark',
      }}
    />
  </ListItemButton>
);

const isLearningPath = (path: string) =>
  path.startsWith('/content') || path.startsWith('/course') || path.startsWith('/learning-paths');

const isPeoplePath = (path: string) =>
  path.startsWith('/user') ||
  path.startsWith('/cohort') ||
  path.startsWith('/group') ||
  path === '/' ||
  path === '/dashboard';

const getActiveStates = (path: string) => ({
  users: path === '/users' || path === '/' || path === '/dashboard' || path.startsWith('/users'),
  groups: path.startsWith('/cohort') || path.startsWith('/group'),
  courses: path.startsWith('/content/courses') || path.startsWith('/course'),
  content: path === '/content' || path.startsWith('/content/library'),
  paths: path.startsWith('/learning-paths') || path.startsWith('/content/learning-paths'),
});

export const Sidebar: React.FC<SidebarProps> = ({
  isSidebarOpen,
  isMobileSidebarOpen,
  onSidebarClose,
}) => {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const lgUp = useMediaQuery(theme.breakpoints.up('lg'));

  // Default open menu is 'people'
  const [expandedMenu, setExpandedMenu] = useState<MenuGroup>('people');

  // Keep expandedMenu in sync with current route
  useEffect(() => {
    const path = router.pathname;
    if (isLearningPath(path)) {
      setExpandedMenu('learning');
    } else if (isPeoplePath(path)) {
      setExpandedMenu('people');
    }
  }, [router.pathname]);

  // Opening a group selects its first sub-menu and navigates to it
  const openGroup = (group: MenuGroup, href: string) => {
    setExpandedMenu(group);
    router.push(href);
    if (!lgUp && onSidebarClose) {
      onSidebarClose();
    }
  };

  const active = getActiveStates(router.pathname);
  const laterLabel = t('SIDEBAR.LATER');

  const sidebarContent = (
    <Box
      sx={{
        width: 260,
        height: '100%',
        backgroundColor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
        {/* ==================== 1. PEOPLE (MAIN MENU) ==================== */}
        <Box sx={{ mb: 1 }}>
          <MainMenuButton
            label={t('SIDEBAR.PEOPLE')}
            icon={<GroupIcon fontSize="small" />}
            expanded={expandedMenu === 'people'}
            onClick={() => openGroup('people', '/users')}
          />
          <Collapse in={expandedMenu === 'people'} timeout="auto" unmountOnExit>
            <List disablePadding sx={{ pt: 0.3, pb: 0.5 }}>
              <SubMenuLink
                href="/users"
                label={t('SIDEBAR.USERS')}
                icon={<GroupIcon fontSize="small" />}
                active={active.users}
                onClick={onSidebarClose}
              />
              <SubMenuLink
                href="/cohorts"
                label={t('SIDEBAR.GROUPS')}
                icon={<HubIcon fontSize="small" />}
                active={active.groups}
                onClick={onSidebarClose}
              />
            </List>
          </Collapse>
        </Box>

        {/* ==================== 2. LEARNING (MAIN MENU) ==================== */}
        <Box sx={{ mb: 1 }}>
          <MainMenuButton
            label={t('SIDEBAR.LEARNING')}
            icon={<MenuBookIcon fontSize="small" />}
            expanded={expandedMenu === 'learning'}
            onClick={() => openGroup('learning', '/content/courses')}
          />
          <Collapse in={expandedMenu === 'learning'} timeout="auto" unmountOnExit>
            <List disablePadding sx={{ pt: 0.3, pb: 0.5 }}>
              <SubMenuLink
                href="/content/courses"
                label={t('SIDEBAR.COURSES')}
                icon={<MenuBookIcon fontSize="small" />}
                active={active.courses}
                onClick={onSidebarClose}
              />
              <SubMenuLink
                href="/content"
                label={t('SIDEBAR.CONTENT')}
                icon={<FolderSpecialIcon fontSize="small" />}
                active={active.content}
                onClick={onSidebarClose}
              />
              <SubMenuLink
                href="/learning-paths"
                label={t('SIDEBAR.LEARNING_PATHS')}
                icon={<AltRouteIcon fontSize="small" />}
                active={active.paths}
                onClick={onSidebarClose}
              />
            </List>
          </Collapse>
        </Box>

        {/* ==================== 3. LATER ITEMS ==================== */}
        <LaterMenuItem
          label={t('SIDEBAR.NOTIFICATIONS')}
          badge={laterLabel}
          icon={<NotificationsIcon fontSize="small" />}
        />
        <LaterMenuItem
          label={t('SIDEBAR.INSIGHTS')}
          badge={laterLabel}
          icon={<AssessmentIcon fontSize="small" />}
        />
        <LaterMenuItem
          label={t('SIDEBAR.ACCESS')}
          badge={laterLabel}
          icon={<SecurityIcon fontSize="small" />}
        />
      </Box>

      {/* Tenant Footer Information */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', backgroundColor: 'secondary.100' }}>
        <Typography variant="body2" sx={{ fontSize: '11px', fontWeight: 600, color: 'secondary.main' }}>
          {t('SIDEBAR.PORTAL_NAME')}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '10px', color: 'text.secondary' }}>
          {t('SIDEBAR.TENANT_LABEL', { tenant: 'swadhaar-channel' })}
        </Typography>
      </Box>
    </Box>
  );

  // Desktop uses a persistent drawer; mobile uses a temporary one
  if (lgUp) {
    return (
      <Drawer
        anchor="left"
        open={isSidebarOpen}
        variant="persistent"
        PaperProps={{
          sx: {
            width: 260,
            border: 'none',
            top: '64px',
            height: 'calc(100vh - 64px)',
            zIndex: 1100,
          },
        }}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      anchor="left"
      open={isMobileSidebarOpen}
      onClose={onSidebarClose}
      variant="temporary"
      PaperProps={{
        sx: {
          width: 260,
          zIndex: 1300,
        },
      }}
    >
      {sidebarContent}
    </Drawer>
  );
};

export default Sidebar;
