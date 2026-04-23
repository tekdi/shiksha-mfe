/* eslint-disable @nx/enforce-module-boundaries */
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import AppsOutlinedIcon from '@mui/icons-material/AppsOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import CreateOutlinedIcon from '@mui/icons-material/CreateOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import OutlinedFlagOutlinedIcon from '@mui/icons-material/OutlinedFlagOutlined';
import PreviewOutlinedIcon from '@mui/icons-material/PreviewOutlined';
import StorageIcon from '@mui/icons-material/Storage';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import DynamicLogo from './DynamicLogo';
import { Role } from '@workspace/utils/app.constant';
import Cookies from 'js-cookie';
import {
  getLocalStoredUserRole,
  syncUserDataToCookies,
  needsUserDataSync,
} from '@workspace/services/LocalStorageService';
import { TENANT_DATA } from '@workspace/utils/app.constant';
import TenantService from '@workspace/services/TenantService';
const route = process.env.NEXT_PUBLIC_WORKSPACE_ROUTES;

const getIsAdmin = (): boolean => {
  if (typeof window !== 'undefined') {
    return Cookies.get('adminInfo') ? true : false;
  }
  return false;
};

interface SidebarProps {
  selectedKey: string;
  onSelect: (key: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ selectedKey, onSelect }) => {
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tenantName, setTenantName] = useState();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const router = useRouter();
  const theme = useTheme<any>();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [showHeader, setShowHeader] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user data sync is needed and perform it
    if (needsUserDataSync()) {
      console.log('SideBar: User data sync needed, performing sync...');
      syncUserDataToCookies();
    }

    setUserRole(getLocalStoredUserRole());
    const userData = Cookies.get('userData');

    // Check cookies first, then localStorage for showHeader
    let headerValue = Cookies.get('showHeader');
    if (!headerValue) {
      const localStorageValue = localStorage.getItem('showHeader');
      if (localStorageValue) {
        headerValue = localStorageValue;
        // Migrate to cookies if found in localStorage
        Cookies.set('showHeader', localStorageValue, {
          expires: 7,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        });
        console.log(
          'SideBar: Migrated showHeader from localStorage to cookies'
        );
      }
    }

    setShowHeader(headerValue === 'true');
    const tenant = userData ? JSON.parse(userData) : null;
    setTenantName(tenant?.tenantData[0]?.tenantName);
    setTenantId(tenant?.tenantData[0]?.tenantId);
  }, []);

  if (userRole === null) return null;

  const menuItems = [
    { text: 'Create', key: 'create', icon: <AddOutlinedIcon /> },
    { text: 'Drafts', key: 'draft', icon: <CreateOutlinedIcon /> },
    ...(userRole !== Role.CCTA
      ? [
          {
            text: 'Submitted for Review',
            key: 'submitted',
            icon: <PreviewOutlinedIcon />,
          },
          {
            text: 'Bulk Upload',
            key: 'bulk-upload',
            icon: <CloudUploadIcon />,
          },
        ]
      : []),
    ...(userRole === Role.CCTA
      ? [
          {
            text: 'Up for Review',
            key: 'up-review',
            icon: <PreviewOutlinedIcon />,
          },
          {
            text: 'Bulk Upload',
            key: 'bulk-upload',
            icon: <CloudUploadIcon />,
          },

          ...(tenantId === '3a849655-30f6-4c2b-8707-315f1ed64fbd'
            ? [
                {
                  text: 'Metabase',
                  key: 'Metabase',
                  icon: <StorageIcon />,
                },
              ]
            : []),
        ]
      : []),
    {
      text: 'My Published Contents',
      key: 'publish',
      icon: <OutlinedFlagOutlinedIcon />,
    },
    { text: 'All My Contents', key: 'allContents', icon: <AppsOutlinedIcon /> },
    {
      text: 'Discover Contents',
      key: 'discover-contents',
      icon: <ManageSearchIcon />,
    },
    {
      text: "Attendance",
      key: "attendance",
      icon: <ManageSearchIcon />,
    },
  ];

  const handleNavigation = (key: string) => {
    console.log(key);

    // Handle Metabase navigation
    if (key === 'Metabase') {
      window.open(
        'https://www.snailnetwork.org/metabase/auth/login?redirect=%2F',
        '_blank'
      );
      return;
    }

    router.push(`/workspace/content/${key}`);
    Cookies.set('selectedFilters', JSON.stringify([]));
    onSelect(key);
    if (isMobile) {
      setDrawerOpen(false); // Close drawer after selecting in mobile view
    }
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const goBack = () => {
    if (typeof window !== 'undefined') {
      const userInfo = JSON.parse(Cookies.get('adminInfo') || '{}');
      console.log('userInfo', userInfo);
      if (userInfo?.role === Role.SCTA || userInfo?.role === Role.CCTA) {
        // router.push("/course-planner");
        window.parent.location.href = `${route}course-planner`;
      } else window.parent.location.href = `${route}`;
    }
  };

  const drawerContent = (
    <Box
      display="inline-block"
      padding="1rem 0.5rem 0.5rem"
      width="284px !important"
      height="100%"
      sx={{
        fontSize: '16px',
        '@media (max-width: 900px)': {
          background: 'linear-gradient(to bottom, white, #F8EFDA)',
          fontSize: '12px',
        },
      }}
    >
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        {showHeader ? (
          <DynamicLogo type="sidebar" width={60} height={60} fallbackSrc="/assets/images/logo.png" />
        ) : (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
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
              Workspace
            </Typography>
          </Box>
        )}
      </Box>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        paddingTop={'1rem'}
      >
        {tenantName === TENANT_DATA.SECOND_CHANCE_PROGRAM && (
          <Box display="flex" alignItems="center">
            <ListItemIcon>
              <IconButton onClick={goBack}>
                <ArrowBackIcon sx={{ color: '#635E57' }} />
              </IconButton>
            </ListItemIcon>
            <Typography
              variant="h2"
              fontSize={'16px'}
              sx={{ color: theme.palette.warning['100'], fontWeight: 500 }}
            >
              Exit Workspace
            </Typography>
          </Box>
        )}
        {isMobile && (
          <IconButton onClick={toggleDrawer}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItemButton
            sx={{
              gap: '4px',
              width: '100%',
              display: 'flex',
              justifyContent: 'flex-start',
              borderRadius: '4rem',
              backgroundColor:
                selectedKey === item.key
                  ? 'var(--mui-palette-primary-main)'
                  : 'transparent',
              color: '#000',

              fontSize: '16px !important',

              '&:hover': {
                background:
                  selectedKey === item.key
                    ? 'var(--mui-palette-primary-main)'
                    : 'transparent',
              },
              margin: selectedKey === item.key ? '10px 0' : '0',
            }}
            key={item?.key}
            onClick={() => handleNavigation(item?.key)}
          >
            <ListItemIcon
              sx={{
                color:
                  selectedKey === item?.key
                    ? '#2E1500'
                    : theme.palette.warning.A200,
                minWidth: '40px',
                fontWeight: selectedKey === item?.key ? '500' : '500',
                fontSize: '16px !important',
              }}
            >
              {item?.icon}
            </ListItemIcon>
            <ListItemText
              className="menu-list-content"
              primaryTypographyProps={{
                fontSize: '16px',
                fontFamily: 'Poppins',
                fontWeight: selectedKey === item?.key ? '600' : '500',
                color: 'black',
              }}
              primary={item?.text}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      {isMobile ? (
        <>
          <MenuIcon
            sx={{
              margin: 2,
              cursor: 'pointer',
              color: getIsAdmin() ? 'white' : 'black',
            }}
            onClick={toggleDrawer}
          />

          <Drawer
            anchor="left"
            sx={{
              width: '284px',
              // background: "linear-gradient(to bottom, white, #F8EFDA)",
            }}
            open={drawerOpen}
            onClose={toggleDrawer}
            ModalProps={{
              keepMounted: true, // Improves performance on mobile
            }}
          >
            {drawerContent}
          </Drawer>
        </>
      ) : (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-start',
            width: 284,
          }}
        >
          {drawerContent}
        </Box>
      )}
    </>
  );
};

export default Sidebar;
