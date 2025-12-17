"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  LayoutProps,
  Layout,
  useTranslation,
  DrawerItemProp,
} from "@shared-lib";
import {
  AccountCircleOutlined,
  Home,
  AssignmentOutlined,
  Logout,
} from "@mui/icons-material";
import { useRouter, usePathname } from "next/navigation";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import ProfileMenu from "./ProfileMenu/ProfileMenu";
import ConfirmationModal from "./ConfirmationModal/ConfirmationModal";
import { checkAuth } from "@shared-lib-v2/utils/AuthService";
import MuiThemeProvider from "@learner/assets/theme/MuiThemeProvider";
import { useTenant } from "@learner/context/TenantContext";

// Custom DrawerItem interface
interface NewDrawerItemProp extends DrawerItemProp {
  variant?: "contained" | "text";
  isActive?: boolean;
  customStyle?: React.CSSProperties;
}
const getClubStyleNavConfig = ({
  router,
  t,
  handleNavClick,
  getLinkStyle,
  currentPage,
  setAnchorEl,
}: {
  router: any;
  t: any;
  handleNavClick: (cb: () => void) => void;
  getLinkStyle: (active: boolean) => React.CSSProperties;
  currentPage: string;
  setAnchorEl: (el: boolean) => void;
}): NewDrawerItemProp[] => {
  const navLinks: NewDrawerItemProp[] = [
    {
      title: t("LEARNER_APP.COMMON.COURSES"),
      icon: <AssignmentOutlined sx={{ width: 28, height: 28 }} />,
      to: () => handleNavClick(() => router.push("/courses-contents")),
      isActive: currentPage === "/courses-contents",
      customStyle: getLinkStyle(currentPage === "/courses-contents"),
    },
    {
      title: t("LEARNER_APP.COMMON.PROFILE"),
      icon: <AccountCircleOutlined sx={{ width: 28, height: 28 }} />,
      to: () => handleProfileMenuOpen(),
      isActive: currentPage === "/profile",
      customStyle: getLinkStyle(currentPage === "/profile"),
    },
  ];

  return navLinks;
};

// Nav config by userProgram
const NAV_CONFIG: Record<
  string,
  (params: {
    router: any;
    isMobile: boolean;
    t: any;
    handleNavClick: (cb: () => void) => void;
    handleProfileClick: () => void;
    handleLogoutModal: () => void;
    setAnchorEl: (el: boolean) => void;
    getLinkStyle: (active: boolean) => React.CSSProperties;
    currentPage: string;
    checkAuth: boolean;
  }) => NewDrawerItemProp[]
> = {
  YouthNet: ({
    router,
    isMobile,
    t,
    handleNavClick,
    handleProfileClick,
    handleLogoutModal,
    setAnchorEl,
    getLinkStyle,
    currentPage,
    checkAuth,
  }) => {
    const navLinks: NewDrawerItemProp[] = [
      {
        title: t("LEARNER_APP.COMMON.L1_COURSES"),
        icon: <Home sx={{ width: 28, height: 28 }} />,
        to: () => handleNavClick(() => router.push("/content")),
        isActive: currentPage === "/content",
        customStyle: getLinkStyle(currentPage === "/content"),
      },
    ];

    const isVolunteer = JSON.parse(
      localStorage.getItem("isVolunteer") || "false"
    );
    if (isVolunteer) {
      navLinks.push({
        title: t("LEARNER_APP.COMMON.SURVEYS"),
        icon: <AssignmentOutlined sx={{ width: 28, height: 28 }} />,
        to: () => handleNavClick(() => router.push("/observations")),
        isActive: currentPage === "/observations",
        customStyle: getLinkStyle(currentPage === "/observations"),
      });
    }

    if (checkAuth) {
      if (isMobile) {
        navLinks.push(
          {
            title: t("LEARNER_APP.COMMON.PROFILE"),
            icon: <AccountCircleOutlined sx={{ width: 28, height: 28 }} />,
            to: () => handleNavClick(handleProfileClick),
            isActive: currentPage === "/profile",
            customStyle: getLinkStyle(currentPage === "/profile"),
          },
          {
            title: t("COMMON.LOGOUT"),
            icon: <Logout sx={{ width: 28, height: 28 }} />,
            to: () => handleNavClick(handleLogoutModal),
            isActive: false,
            customStyle: {},
          }
        );
      } else {
        navLinks.push({
          title: t("COMMON.SKILLING_CENTERS"),
          icon: (
            <img
              src="/images/engineering.png"
              alt="Skill Center"
              style={{ width: 28, height: 28 }}
            />
          ),
          to: () => handleNavClick(() => router.push("/skill-center")),
          isActive: currentPage === "/skill-center",
          customStyle: {},
        });
      }
    }

    // Always add Profile link at the end
    navLinks.push({
      title: t("LEARNER_APP.COMMON.PROFILE"),
      icon: <AccountCircleOutlined sx={{ width: 28, height: 28 }} />,
      to: () => handleProfileMenuOpen(),
      isActive: currentPage === "/profile",
      customStyle: getLinkStyle(currentPage === "/profile"),
    });

    return navLinks;
  },

  "Camp to Club": ({
    router,
    t,
    handleNavClick,
    getLinkStyle,
    currentPage,
    setAnchorEl,
  }) =>
    getClubStyleNavConfig({
      router,
      t,
      handleNavClick,
      getLinkStyle,
      currentPage,
      setAnchorEl,
    }),

  Pragyanpath: ({
    router,
    t,
    handleNavClick,
    getLinkStyle,
    currentPage,
    setAnchorEl,
  }) =>
    getClubStyleNavConfig({
      router,
      t,
      handleNavClick,
      getLinkStyle,
      currentPage,
      setAnchorEl,
    }),
};

const App: React.FC<LayoutProps> = ({ children, onlyHideElements, ...props }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { t, setLanguage } = useTranslation();
  const { tenant, contentFilter } = useTenant();

  // Get tenant colors
  const primaryColor = contentFilter?.theme?.primaryColor || "#E6873C";
  const secondaryColor = contentFilter?.theme?.secondaryColor || "#1A1A1A";
  const backgroundColor = contentFilter?.theme?.backgroundColor || "#F5F5F5";
  const tenantName =
    contentFilter?.title ||
    tenant?.name ||
    (typeof window !== "undefined"
      ? localStorage.getItem("userProgram") || ""
      : "");
  const tenantIcon = contentFilter?.icon || "/logo.png";

  const [defaultNavLinks, setDefaultNavLinks] = useState<NewDrawerItemProp[]>(
    []
  );
  const [anchorEl, setAnchorEl] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleClose = () => setAnchorEl(null);
  const handleProfileClick = () => {
    if (pathname !== "/profile") {
      router.push("/profile");
    }
    handleClose();
  };
  const handleProfileMenuOpen = (event?: React.MouseEvent<HTMLElement>) => {
    // For desktop, try to open menu if we have an anchor
    // For mobile or if no event, directly navigate
    if (event && !isMobile) {
      setAnchorEl(event.currentTarget);
    } else {
      // Directly navigate to profile
      handleProfileClick();
    }
  };
  const handleLogoutClick = () => router.push("/logout");
  const handleLogoutModal = () => setModalOpen(true);
  const handleCloseModel = () => setModalOpen(false);
  const handleNavClick = (callback: () => void) => {
    callback();
  };

  const getLinkStyle = (isActive: boolean): React.CSSProperties => ({
    backgroundColor: isActive ? `${primaryColor}20` : "transparent",
    borderRadius: 8,
    color: isActive ? primaryColor : secondaryColor,
  });

  const getMessage = () => (modalOpen ? t("COMMON.SURE_LOGOUT") : "");
  useEffect(() => {
    let currentPage = "";
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const activeLink = searchParams.get("activeLink");
      currentPage = activeLink || window.location.pathname || "";
    }

    const program = localStorage.getItem("userProgram") || "";

    const disallowedPathsMap: Record<string, string[]> = {
      YouthNet: ["/courses-contents"],
      "Camp to Club": ["/content", "/observations", "/skill-center"],
      Pragyanpath: ["/content", "/observations", "/skill-center"],
    };

    const disallowedPaths = disallowedPathsMap[program] || [];

    if (disallowedPaths.includes(currentPage)) {
      // Redirect to a safe/default page
      const fallbackPath =
        program === "Camp to Club" ? "/courses-contents" : "/content";
      router.push("/unauthorized");
      return;
    }

    const configFn = NAV_CONFIG[program];
    const navLinks = configFn
      ? configFn({
          router,
          isMobile,
          t,
          handleNavClick,
          handleProfileClick,
          handleLogoutModal,
          setAnchorEl,
          getLinkStyle,
          currentPage,
          checkAuth: checkAuth(),
        })
      : [];

    setDefaultNavLinks(navLinks);
  }, [t, router, isMobile]);

  useEffect(() => {
    let currentPage = "";
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const activeLink = searchParams.get("activeLink");
      currentPage = activeLink || window.location.pathname || "";
    }

    const program = localStorage.getItem("userProgram") || "";
    const configFn = NAV_CONFIG[program];

    const navLinks = configFn
      ? configFn({
          router,
          isMobile,
          t,
          handleNavClick,
          handleProfileClick,
          handleLogoutModal,
          setAnchorEl,
          getLinkStyle,
          currentPage,
          checkAuth: checkAuth(),
        })
      : [];

    setDefaultNavLinks(navLinks);
  }, [t, router, isMobile]);

  const onLanguageChange = (val: string) => setLanguage(val);

  const computedHideElements =
    onlyHideElements && onlyHideElements.length > 0
      ? onlyHideElements
      : ["footer"];

  return (
    <Layout
      onlyHideElements={computedHideElements}
      {...props}
      _topAppBar={{
        _brand: {
          name: tenantName,
          icon: tenantIcon,
          _box: {
            onClick: () => {
              const programName =
                tenant?.name ||
                (typeof window !== "undefined"
                  ? localStorage.getItem("userProgram") || ""
                  : "");
              if (programName === "YouthNet") {
                router.push("/content");
              } else if (programName === "Camp to Club") {
                router.push("/courses-contents");
              } else if (programName === "Pragyanpath") {
                router.push("/courses-contents");
              }
            },

            sx: {
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 1,
            },
            _text: {
              fontWeight: 400,
              fontSize: "22px",
              lineHeight: "28px",
              textAlign: "center",
            },
          },
        },
        navLinks: defaultNavLinks,
        // Push nav links (including Profile icon) to the right side of the header
        _navLinkBox: { gap: 5, marginLeft: "auto" },
        onLanguageChange,
        ...props?._topAppBar,
      }}
    >
      <Box>
        {children}
        {/* {!isMobile && ( */}
        <Box sx={{ marginTop: "20px" }}>
          <ProfileMenu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            onProfileClick={handleProfileClick}
            onLogout={handleLogoutModal}
          />
        </Box>
        {/* )} */}
      </Box>
      <ConfirmationModal
        message={getMessage()}
        handleAction={handleLogoutClick}
        buttonNames={{
          primary: t("COMMON.LOGOUT"),
          secondary: t("COMMON.CANCEL"),
        }}
        handleCloseModal={handleCloseModel}
        modalOpen={modalOpen}
      />
    </Layout>
  );
};

export default function AppWrapper(props: Readonly<LayoutProps>) {
  return (
    <MuiThemeProvider>
      <App {...props} />
    </MuiThemeProvider>
  );
}
