"use client";
import React, { useEffect, useRef, useState } from "react";
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
  MenuItem,
  Paper,
  Popper,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { CommonDrawer } from "../Drawer/CommonDrawer";
import type { DrawerItemProp } from "../Drawer/CommonDrawer";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import SpeakableText from "../textToSpeech/SpeakableText";

interface NewDrawerItemProp extends DrawerItemProp {
  variant?: "contained" | "text";
  isActive?: boolean;
  customStyle?: React.CSSProperties;
  child?: NewDrawerItemProp[];
}
export interface AppBarProps {
  title?: string;
  showBackIcon?: boolean;
  backIconClick?: () => void;
  actionButtonLabel?: string;
  actionButtonClick?: () => void;
  actionButtonColor?: "inherit" | "primary" | "secondary" | "default";
  position?: "fixed" | "absolute" | "sticky" | "static" | "relative";
  color?: "primary" | "secondary" | "default" | "transparent" | "inherit";
  bgcolor?: string;
  navLinks?: NewDrawerItemProp[];
  rightComponent?: React.ReactNode;
  isShowLang?: boolean;
  onLanguageChange?: (lang: string) => void;
  _navLinkBox?: React.CSSProperties;
  _brand?: object;
  isColorInverted?: boolean;
  _config?: any;
}

export const withoutQueryString = () => {
  if (typeof window !== "undefined") {
    const parsedUrl = new URL(window.location.href);
    return parsedUrl?.pathname + parsedUrl?.search;
  }
  return "";
};

export const TopAppBar: React.FC<AppBarProps> = ({
  title = "Title",
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
        <Toolbar sx={{ justifyContent: "space-between" }}>
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
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  useEffect(() => {
    const storedLanguage = localStorage.getItem("lang");
    if (storedLanguage) {
      setSelectedLanguage(storedLanguage);
    }
  }, []);

  const handleChange = (event: any) => {
    const newLanguage = event.target.value;
    setSelectedLanguage(newLanguage);
    if (onLanguageChange) {
      onLanguageChange(newLanguage);
    } else {
      localStorage.setItem("lang", newLanguage);
    }
  };

  return (
    <Select
      value={selectedLanguage}
      size="small"
      onChange={handleChange}
      sx={{
        width: "auto",
        "& .MuiSelect-select": {
          padding: "2px 0px 3px 8px",
          paddingRight: "20px !important",
        },
        "& .MuiSelect-icon": {
          width: "20px",
        },
        color: theme.palette.text.primary,
        borderRadius: "8px",
        borderWidth: 1,
        "& .Mui-selected": {
          backgroundColor: "transparent",
          color: theme.palette.text.primary,
        },
      }}
    >
      <MuiMenuItem value="en">English</MuiMenuItem>
      <MuiMenuItem value="hi">हिंदी</MuiMenuItem>
      <MuiMenuItem value="mr">मराठी</MuiMenuItem>
      <MuiMenuItem value="odi">ଓଡ଼ିଆ</MuiMenuItem>
      <MuiMenuItem value="tel">తెలుగు</MuiMenuItem>
      <MuiMenuItem value="kan">ಕನ್ನಡ</MuiMenuItem>
      <MuiMenuItem value="tam">தமிழ்</MuiMenuItem>
      <MuiMenuItem value="guj">ગુજરાતી</MuiMenuItem>
    </Select>
  );
};

export const DesktopBar = ({
  navLinks = [],
  rightComponent,
  isShowLang = true,
  onLanguageChange,
  _navLinkBox,
  _brand,
  isColorInverted = false,
  _config,
}: AppBarProps) => {
  const [menus, setMenus] = useState<
    { anchorEl: HTMLElement | null; items: any[] }[]
  >([]);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const theme = useTheme();

  const openMenuAtLevel = (
    level: number,
    anchor: HTMLElement,
    items: any[]
  ) => {
    setMenus((prev) => {
      const next = [...prev];
      next[level] = { anchorEl: anchor, items };
      return next.slice(0, level + 1);
    });
  };

  const handleEnter = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
  };

  const handleLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setMenus([]);
    }, 300);
  };

  const handleClickLeaf = (to: any) => {
    setMenus([]);
    if (typeof to === "function") to();
  };

  return (
    <Box
      sx={{
        display: { xs: "none", md: "flex" },
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
      }}
    >
      <Brand {..._brand} />
      {_config?.middleComponent && _config.middleComponent}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          justifyContent: "center",
          ..._navLinkBox,
        }}
      >
        {navLinks.map((link, index) => (
          <Box key={`${link.title}-${index}`} onMouseLeave={handleLeave}>
            <Box
              sx={{ display: "flex", alignItems: "center" }}
              onMouseEnter={(e) =>
                openMenuAtLevel(0, e.currentTarget, link.child ?? [])
              }
            >
              <Button
                component={typeof link.to === "string" ? "a" : "button"}
                href={typeof link.to === "string" ? link.to : undefined}
                // @ts-ignore
                variant={
                  link.isActive
                    ? "top-bar-link-button"
                    : link.variant ?? "top-bar-link-text"
                }
                startIcon={link?.icon && link.icon}
                onClick={(e: any) => {
                  typeof link.to !== "string" && link.to !== undefined
                    ? link.to(e)
                    : openMenuAtLevel(0, e.currentTarget, link.child ?? []);
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 500,
                    color: "#1F1B13",
                    cursor: "pointer",
                  }}
                  data-speech-control="true"
                >
                  <SpeakableText cursor={true}>{link.title}</SpeakableText>
                </Typography>
              </Button>
              {link.child && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    openMenuAtLevel(0, e.currentTarget, link?.child ?? []);
                  }}
                >
                  <ArrowDropDownIcon
                    fontSize="small"
                    sx={{ color: isColorInverted ? "#fff" : "inherit" }}
                  />
                </IconButton>
              )}
            </Box>
          </Box>
        ))}

        {(rightComponent || isShowLang) && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {rightComponent}
            {isShowLang && (
              <LanguageSelect onLanguageChange={onLanguageChange} />
            )}
          </Box>
        )}
      </Box>

      {menus.map((menu, level) => (
        <Popper
          key={`menu-${level}`}
          open={Boolean(menu.anchorEl)}
          anchorEl={menu.anchorEl}
          placement="bottom"
          disablePortal
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          modifiers={[
            {
              name: "offset",
              options: {
                offset: [0, 0],
              },
            },
          ]}
          sx={{
            zIndex: 1300 + level,
            mt: level === 0 ? 0.5 : 0,
          }}
        >
          <Paper elevation={3}>
            <Box display="flex" flexDirection="row" flexWrap="wrap">
              {menu.items.map((item, idx) => {
                const hasChild =
                  Array.isArray(item.child) && item.child.length > 0;
                return (
                  <Box
                    key={`${idx}-${item.label}`}
                    onMouseEnter={(e) => {
                      if (hasChild) {
                        openMenuAtLevel(level + 1, e.currentTarget, item.child);
                      } else {
                        setMenus((prev) => prev.slice(0, level + 1));
                      }
                    }}
                    sx={{
                      bgcolor:
                        typeof item.isActive === "boolean"
                          ? item.isActive
                            ? theme.palette.primary.main
                            : "inherit"
                          : item?.isActive?.replaceAll(" ", "%20") ===
                            withoutQueryString()
                          ? theme.palette.primary.main
                          : "inherit",
                    }}
                  >
                    <MenuItem
                      onClick={() => {
                        if (!hasChild) handleClickLeaf(item.to);
                      }}
                      sx={{
                        justifyContent: "space-between",
                        whiteSpace: "nowrap",
                        py: 3,
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 500,
                          color: "#1F1B13",
                          cursor: "pointer",
                        }}
                        data-speech-control="true"
                      >
                        <SpeakableText cursor={true}>
                          {item.title}
                        </SpeakableText>
                      </Typography>
                      {hasChild && (
                        <ArrowDropDownIcon
                          fontSize="small"
                          sx={{ color: isColorInverted ? "#fff" : "inherit" }}
                        />
                      )}
                    </MenuItem>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Popper>
      ))}
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
        display: { xs: "flex", md: "none" },
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        color: "#1F1B13",
      }}
    >
      {!showBackIcon ? (
        <>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={(e) => setIsDrawerOpen(true)}
          >
            <MenuIcon sx={{ cursor: "pointer", color: "#1F1B13" }} />
          </IconButton>
          <Brand {..._brand} name={""} />
          {/* {!isShowLang && <Box />} */}
        </>
      ) : (
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
            variant="body1"
            component="div"
            sx={{ flexGrow: 1, textAlign: "left", fontWeight: 500 }}
          >
            <SpeakableText>{title}</SpeakableText>
          </Typography>
        </>
      )}
      {isShowLang && <LanguageSelect onLanguageChange={onLanguageChange} />}
      <CommonDrawer
        open={isDrawerOpen}
        onDrawerClose={() => setIsDrawerOpen(false)}
        items={navLinks}
        topElement={<Brand {..._brand} />}
      />
    </Box>
  );
};

const Brand = ({
  _box,
  name = "Pratham",
  logo = "/logo.png",
}: {
  _box?: any;
  name?: string;
  logo?: string;
}) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }} {..._box}>
      {_box?.brandlogo ?? (
        <>
          <img src={logo} alt="YouthNet" style={{ height: "40px" }} />
          {name && (
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 600,
                ...(_box?._text ?? {}),
              }}
            >
              <SpeakableText>{name}</SpeakableText>
            </Typography>
          )}
        </>
      )}
    </Box>
  );
};
