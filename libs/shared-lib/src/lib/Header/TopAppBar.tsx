import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Select,
  MenuItem as MuiMenuItem,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { CommonDrawer } from '../Drawer/CommonDrawer';
import type { DrawerItemProp } from '../Drawer/CommonDrawer';

interface NewDrawerItemProp extends DrawerItemProp {
  variant?: 'contained' | 'text';
  isActive?: boolean;
  customStyle?: React.CSSProperties;
}
export interface AppBarProps {
  title?: string;
  showBackIcon?: boolean;
  backIconClick?: () => void;
  actionButtonLabel?: string;
  actionButtonClick?: () => void;
  actionButtonColor?: 'inherit' | 'primary' | 'secondary' | 'default';
  position?: 'fixed' | 'absolute' | 'sticky' | 'static' | 'relative';
  color?: 'primary' | 'secondary' | 'default' | 'transparent' | 'inherit';
  bgcolor?: string;
  navLinks?: NewDrawerItemProp[];
  rightComponent?: React.ReactNode;
  isShowLang?: boolean;
  onLanguageChange?: (lang: string) => void;
  _navLinkBox?: React.CSSProperties;
  _brand?: object;
}

export const TopAppBar: React.FC<AppBarProps> = ({
  title = 'Title',
  showBackIcon = false,
  backIconClick,
  navLinks = [],
  rightComponent,
  isShowLang = true,
  onLanguageChange,
  ...props
}) => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <MobileTopBar
            {...props}
            navLinks={navLinks}
            showBackIcon={showBackIcon}
            backIconClick={backIconClick}
            title={title}
            isShowLang={isShowLang}
            onLanguageChange={onLanguageChange}
          />
          {/* xs is for mobile and md is for desktop */}
          <DesktopBar
            {...props}
            navLinks={navLinks}
            rightComponent={rightComponent}
            isShowLang={isShowLang}
            onLanguageChange={onLanguageChange}
          />
        </Toolbar>
      </AppBar>
    </Box>
  );
};

const LanguageSelect = ({
  onLanguageChange,
}: {
  onLanguageChange?: (value: string) => void;
}) => {
  const theme = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  useEffect(() => {
    const storedLanguage = localStorage.getItem('lang');
    if (storedLanguage) {
      setSelectedLanguage(storedLanguage);
    }
  }, []);

  const handleChange = (event: any) => {
    const newLanguage = event.target.value;
    setSelectedLanguage(newLanguage);
    localStorage.setItem('lang', newLanguage);
    if (onLanguageChange) {
      onLanguageChange(newLanguage);
    }
  };

  return (
    <Select
      value={selectedLanguage}
      size="small"
      onChange={handleChange}
      sx={{
        minWidth: 120,
        height: 40,
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        color: theme.palette.text.primary,
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: 'rgba(0, 0, 0, 0.1)',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: 'rgba(0, 0, 0, 0.2)',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.primary.main,
        },
      }}
    >
      <MuiMenuItem value="en">English</MuiMenuItem>
      <MuiMenuItem value="hi">हिन्दी</MuiMenuItem>
    </Select>
  );
};

const DesktopBar = ({
  navLinks = [],
  rightComponent,
  isShowLang = true,
  onLanguageChange,
  _navLinkBox,
  _brand,
}: AppBarProps) => {
  return (
    <Box
      sx={{
        display: { xs: 'none', md: 'flex' },
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <Brand {..._brand} />
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          justifyContent: 'center',
          ..._navLinkBox,
        }}
      >
        {navLinks.map((link, index) => {
          return (
            <Button
              key={index}
              // @ts-ignore

              variant={
                link.variant ??
                (link.isActive ? 'top-bar-link-button' : 'top-bar-link-text')
              }
              startIcon={link?.icon && link.icon}
              onClick={
                typeof link.to === 'string'
                  ? undefined
                  : (link.to as unknown as (
                      event: React.MouseEvent<HTMLButtonElement>
                    ) => void)
              }
            >
              {link.title}
            </Button>
          );
        })}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {rightComponent}
          {isShowLang && <LanguageSelect onLanguageChange={onLanguageChange} />}
        </Box>
      </Box>
    </Box>
  );
};

const MobileTopBar = ({
  navLinks = [],
  showBackIcon,
  backIconClick,
  title,
  isShowLang,
  onLanguageChange,
  _brand,
}: AppBarProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  return (
    <Box
      sx={{
        display: { xs: 'flex', md: 'none' },
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
      }}
    >
      {!showBackIcon && (
        <>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={(e) => setIsDrawerOpen(true)}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            component="div"
            sx={{
              flexGrow: 1,
              textAlign: 'center',
              fontSize: '22px',
              fontWeight: 400,
            }}
          >
            {title}
          </Typography>
        </>
      )}
      {showBackIcon && (
        <>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="back"
            onClick={backIconClick}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, textAlign: 'left' }}
          >
            {title}
          </Typography>
        </>
      )}
      {isShowLang && <LanguageSelect onLanguageChange={onLanguageChange} />}
      <CommonDrawer
        open={isDrawerOpen}
        onDrawerClose={() => setIsDrawerOpen(false)}
        // @ts-ignore

        items={navLinks}
        onItemClick={(to) => {
          setIsDrawerOpen(false);
        }}
        topElement={<Brand {..._brand} />}
    />
    </Box>
  );
};

const Brand = ({
  _box,
  name = 'Pratham',
  icon,
  children,
}: {
  _box?: any;
  name?: string;
  icon?: string;
  children?: React.ReactNode;
}) => {
  const theme = useTheme();
  const logoSrc = icon || '/logo.png';

  if (children) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} {..._box}>
        {children}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} {..._box}>
      <img src={logoSrc} alt={name} style={{ height: '32px', maxWidth: '120px', objectFit: 'contain' }} />
      <Typography
        variant="h6"
        sx={{
          color: theme.palette.text.primary,
          fontWeight: 600,
        }}
      >
        {name}
      </Typography>
    </Box>
  );
};
