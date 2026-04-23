/* eslint-disable @nx/enforce-module-boundaries */
import dynamic from "next/dynamic";
import React, { useState, useCallback, memo, useEffect } from "react";
import { Box, Button, Chip, Drawer, Stack, Typography, CircularProgress } from "@mui/material";
import { useTranslation } from "@shared-lib";
import {
  Close as CloseIcon,
  FilterAltOutlined,
  FilterList,
  Search,
} from "@mui/icons-material";
import SearchComponent from "./SearchComponent";
import FilterComponent from "./FilterComponent";
import { gredientStyle } from "@learner/utils/style";
import { logEvent } from "@learner/utils/googleAnalytics";
import { useTenant } from "@learner/context/TenantContext";
import { telemetryFactory } from "../../utils/telemtery";

interface LearnerCourseProps {
  title?: string;
  activeTab?: string;
  isLoading?: boolean;
  _content?: any;
}

const LoadingFallback = () => {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "200px",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">
        {t("LEARNER_APP.COURSE.LOADING_CONTENT") || "आपके लेसन लोड हो रहे हैं…"}
      </Typography>
    </Box>
  );
};

const Content = dynamic(() => import("@Content"), {
  ssr: false,
  loading: () => <LoadingFallback />,
});

export default memo(function LearnerCourse({
  title,
  activeTab,
  isLoading,
  _content,
}: LearnerCourseProps) {
  const { contentFilter } = useTenant();
  
  // Get tenant colors
  const primaryColor = contentFilter?.theme?.primaryColor || "#E6873C";
  const secondaryColor = contentFilter?.theme?.secondaryColor || "#1A1A1A";
  const backgroundColor = contentFilter?.theme?.backgroundColor || "#F5F5F5";
  
  const [filterState, setFilterState] = useState<any>({ limit: 10 });
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { t } = useTranslation();
  const { staticFilter, filterFramework } = _content ?? {};

  // Shared style for mobile Filter and Search buttons - ensures pixel-perfect match
  const mobileActionStyle = {
    height: "48px",
    minHeight: "48px",
    maxHeight: "48px", // Lock height to prevent visual growth
    borderRadius: "8px",
    border: "1px solid #DADADA",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "#DADADA",
    padding: "0 12px",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: "0.1px",
    boxSizing: "border-box" as const,
    backgroundColor: "#fff",
    overflow: "hidden", // Prevents visual growth
    lineHeight: 1, // Prevent line-height from affecting height
    outline: "none", // Remove any default outline
    "&:focus": {
      outline: "none",
      border: "1px solid #DADADA", // Keep border same on focus
    },
    "&:hover": {
      border: "1px solid #DADADA", // Keep border same on hover
    },
  };
  useEffect(() => {
    setFilterState(_content?.filters ?? {});
  }, [_content?.filters, _content?.searchParams]);

  const handleTabChange = useCallback((tab: any) => {
    const type = tab === "Course" ? "Course" : "Learning Resource";
    setFilterState((prevState: any) => ({
      ...prevState,
      query: "",
      type,
    }));
  }, []);
  const handleSearchClick = useCallback(
    (searchValue: string) => {
      
      if (typeof window !== "undefined") {
        const windowUrl = window.location.pathname;
        const cleanedUrl = windowUrl;
        logEvent({
          action: "search content by " + searchValue,
          category: cleanedUrl,
          label: "Search content",
        });
      }
      const type =
        _content?.tab === "Course"
          ? "Course"
          : "Learning Resource";
      
      // Use functional update to prevent race conditions
      setFilterState((prevState: any) => {
        const newState = {
          ...prevState,
          query: searchValue,
          offset: 0,
          type,
        };
        
        // Only update if there's actually a change
        if (JSON.stringify(prevState) === JSON.stringify(newState)) {
          return prevState; // No change, return same object
        }
        
        return newState;
      });
    },
    [_content]
  );

  const handleFilterChange = (newFilterState: typeof filterState) => {
    const telemetryInteract = {
      context: { env: "prod", cdata: [] },
      edata: {
        id: "dashboard-filter-click",
        type: "CLICK",
        pageid: `filter-${newFilterState}`,
        uid: localStorage.getItem("userId") || "Anonymous",
      },
    };
    telemetryFactory.interact(telemetryInteract);
    setFilterState((prevState: any) => {
      const newState = {
        ...prevState,
        filters: newFilterState,
      };
      
      // Only update if there's actually a change
      if (JSON.stringify(prevState) === JSON.stringify(newState)) {
        return prevState; // No change, return same object
      }
      
      return newState;
    });
  };

  return (
    <Stack sx={{ gap: { xs: 0, sm: 0, md: 2 }, pb: 4, backgroundColor: backgroundColor }}>
      {title && (
        <Box
          sx={{
            position: "sticky",
            top: 0,
            bgcolor: backgroundColor,
            px: { xs: 1, md: 4 },
            py: { xs: 1, md: 2 },
            zIndex: 1,
          }}
          style={gredientStyle}
        >
          <Box
            display="flex"
            flexDirection={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems="center"
            sx={{
              gap: { xs: 2, md: 0 },
              px: { xs: 1, md: 0 },
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 400,
                fontSize: "22px",
                lineHeight: "28px",
              }}
            >
              {t(title ?? "LEARNER_APP.COURSE.GET_STARTED")}
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Box sx={{ display: { xs: "block", md: "none" } }}>
                <Button
                  variant="outlined"
                  onClick={() => setIsOpen(true)}
                  size="large"
                  sx={{
                    borderRadius: "8px",
                    borderWidth: "1px",
                    borderColor: "#DADADA !important",
                    padding: "8px 10px",
                  }}
                >
                  <FilterList sx={{ width: 20, height: 20, mr: 0.5 }} />
                  <Typography
                    sx={{
                      fontWeight: 500,
                      fontSize: "14px",
                      lineHeight: "20px",
                      letterSpacing: "0.1px",
                      mr: 0.5,
                    }}
                  >
                    {t("LEARNER_APP.CONTENT.FILTERS")}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 500,
                      fontSize: "14px",
                      lineHeight: "20px",
                      letterSpacing: "0.1px",
                    }}
                  >
                    {Object.keys(filterState?.filters || {}).filter(
                      (e) =>
                        !["limit", ...Object.keys(staticFilter ?? {})].includes(
                          e
                        )
                    ).length
                      ? `(${
                          Object.keys(filterState.filters).filter(
                            (e) =>
                              ![
                                "limit",
                                ...Object.keys(staticFilter ?? {}),
                              ].includes(e)
                          ).length
                        })`
                      : null}
                  </Typography>
                </Button>
              </Box>
              <SearchComponent
                onSearch={handleSearchClick}
                value={filterState?.query}
              />
            </Box>
            <Box
              sx={{
                display: { xs: "flex", sm: "flex", md: "none" },
                overflowY: "auto",
                width: "100%",
              }}
            >
              <FilterChip
                filters={filterState.filters}
                staticFilter={staticFilter}
                handleFilterChange={handleFilterChange}
              />
            </Box>
          </Box>
        </Box>
      )}
      <Stack
        direction="row"
        sx={{ gap: 4, px: { xs: 2, md: 4 }, py: { xs: 1, md: 2 } }}
      >
        <Drawer
          anchor="left"
          open={isOpen}
          onClose={() => setIsOpen(false)}
          PaperProps={{
            sx: {
              width: "80%",
            },
          }}
        >
          <FilterComponent
            filterFramework={filterFramework}
            staticFilter={staticFilter}
            filterState={filterState}
            handleFilterChange={handleFilterChange}
            onlyFields={_content?.onlyFields ?? []}
            isOpenColapsed={_content?.isOpenColapsed ?? []}
            _config={{
              _filterText: { sx: { pt: 2, px: 2 } },
              _filterBox: { sx: { gap: 0 } },
              _filterBody: {
                sx: {
                  py: 2,
                  px: 2,
                  height: "calc(100vh - 130px)",
                  overflowY: "auto",
                },
              },
            }}
          />
          <Box
            sx={{
              bgcolor: "#f1f1f1",
              p: 2,
              position: "absolute",
              bottom: 0,
              width: "100%",
            }}
          >
            <Button
              variant="contained"
              fullWidth
              onClick={() => setIsOpen(false)}
            >
              {t("LEARNER_APP.COURSE.DONE")}
            </Button>
          </Box>
        </Drawer>
        {/* Mobile Search Drawer */}
        <Drawer
          anchor="bottom"
          open={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          PaperProps={{
            sx: {
              borderTopLeftRadius: "16px",
              borderTopRightRadius: "16px",
              maxHeight: "80vh",
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Typography variant="h6" sx={{ flex: 1, fontWeight: 600 }}>
                {t("LEARNER_APP.SEARCH_COMPONENT.PLACEHOLDER")}
              </Typography>
              <Button
                onClick={() => setIsSearchOpen(false)}
                sx={{ minWidth: "auto", p: 1 }}
              >
                <CloseIcon />
              </Button>
            </Box>
            <SearchComponent
              onSearch={(value) => {
                handleSearchClick(value);
                setIsSearchOpen(false);
              }}
              value={filterState?.query}
            />
          </Box>
        </Drawer>

        <Box
          flex={35}
          sx={{
            display: { xs: "none", md: "flex" },
            position: "sticky",
            top: !title ? 0 : 100,
            alignSelf: "flex-start",
          }}
        >
          <FilterComponent
            filterFramework={filterFramework}
            staticFilter={staticFilter}
            filterState={filterState}
            handleFilterChange={handleFilterChange}
            onlyFields={_content?.onlyFields ?? []}
            isOpenColapsed={_content?.isOpenColapsed ?? []}
          />
        </Box>
        <Box flex={127}>
          {!title && (
            <Box
              display="flex"
              justifyContent="space-between"
              flexDirection={{
                xs: "column-reverse",
                sm: "column-reverse",
                md: "row",
              }}
              gap={2}
              sx={{ mb: 2 }}
            >
              <Box sx={{ display: "flex", flexWrap: "wrap" }}>
                <FilterChip
                  filters={filterState.filters}
                  staticFilter={staticFilter}
                  handleFilterChange={handleFilterChange}
                />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "stretch",
                  width: "100%",
                  // No gap - use padding instead for exact 50/50 split
                }}
              >
                {/* Mobile Filter - using Box instead of Button for pixel-perfect match */}
                <Box 
                  sx={{ 
                    display: { xs: "flex", md: "none" }, 
                    width: { xs: "50%", md: "auto" },
                    pr: { xs: 0.5, md: 0 }, // Right padding instead of gap
                    boxSizing: "border-box",
                    margin: 0,
                    padding: 0,
                    flexShrink: 0,
                  }}
                >
                  <Box
                    onClick={() => setIsOpen(true)}
                    sx={{
                      ...mobileActionStyle,
                      justifyContent: "flex-start",
                      cursor: "pointer",
                      width: "100%",
                      border: "1px solid #DADADA", // Explicit border override
                      borderStyle: "solid",
                      borderWidth: "1px",
                      borderColor: "#DADADA",
                    }}
                  >
                    <FilterList sx={{ fontSize: 18, width: 18, height: 18, flexShrink: 0 }} />
                    <Typography
                      component="span"
                      sx={{
                        fontSize: 13,
                        fontWeight: 500,
                        lineHeight: 1,
                        margin: 0,
                        padding: 0,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "inline-block",
                      }}
                    >
                      {t("LEARNER_APP.CONTENT.FILTERS")}
                    </Typography>
                    {Object.keys(filterState?.filters || {}).filter(
                      (e) =>
                        ![
                          "limit",
                          ...Object.keys(staticFilter ?? {}),
                        ].includes(e)
                    ).length > 0 && (
                      <Typography
                        component="span"
                        sx={{
                          fontSize: 13,
                          fontWeight: 500,
                          lineHeight: 1,
                          margin: 0,
                          padding: 0,
                          flexShrink: 0,
                          display: "inline-block",
                        }}
                      >
                        ({Object.keys(filterState.filters).filter(
                          (e) =>
                            ![
                              "limit",
                              ...Object.keys(staticFilter ?? {}),
                            ].includes(e)
                        ).length})
                      </Typography>
                    )}
                  </Box>
                </Box>
                {/* Desktop Filter - keep original Button */}
                <Box sx={{ display: { xs: "none", md: "block" }, mr: { md: 2 } }}>
                  <Button
                    variant="outlined"
                    onClick={() => setIsOpen(true)}
                    size="large"
                    sx={{
                      borderRadius: "8px",
                      borderWidth: "1px",
                      borderColor: "#DADADA !important",
                      padding: "8px 10px",
                    }}
                  >
                    <FilterList sx={{ width: 20, height: 20, mr: 0.5 }} />
                    <Typography
                      sx={{
                        fontWeight: 500,
                        fontSize: "14px",
                        lineHeight: "20px",
                        letterSpacing: "0.1px",
                        mr: 0.5,
                      }}
                    >
                      {t("LEARNER_APP.CONTENT.FILTERS")}
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 500,
                        fontSize: "14px",
                        lineHeight: "20px",
                        letterSpacing: "0.1px",
                      }}
                    >
                      {Object.keys(filterState?.filters || {}).filter(
                        (e) =>
                          ![
                            "limit",
                            ...Object.keys(staticFilter ?? {}),
                          ].includes(e)
                      ).length
                        ? `(${
                            Object.keys(filterState.filters).filter(
                              (e) =>
                                ![
                                  "limit",
                                  ...Object.keys(staticFilter ?? {}),
                                ].includes(e)
                            ).length
                          })`
                        : null}
                    </Typography>
                  </Button>
                </Box>
                {/* Mobile Search - using Box with shared style */}
                <Box 
                  sx={{ 
                    display: { xs: "flex", md: "none" },
                    width: { xs: "50%", md: "auto" },
                    pl: { xs: 0.5, md: 0 }, // Left padding instead of gap
                    boxSizing: "border-box",
                    margin: 0,
                    padding: 0,
                    flexShrink: 0,
                  }}
                >
                  <Box
                    onClick={() => setIsSearchOpen(true)}
                    sx={{
                      ...mobileActionStyle,
                      justifyContent: "space-between",
                      cursor: "text",
                      width: "100%",
                      border: "1px solid #DADADA", // Explicit border override
                      borderStyle: "solid",
                      borderWidth: "1px",
                      borderColor: "#DADADA",
                    }}
                  >
                    <Typography
                      component="span"
                      sx={{
                        fontSize: 13,
                        fontWeight: 500,
                        lineHeight: 1,
                        margin: 0,
                        padding: 0,
                        color: filterState?.query ? "#000" : "#9E9E9E",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                        display: "inline-block",
                      }}
                    >
                      {filterState?.query || t("LEARNER_APP.SEARCH_COMPONENT.PLACEHOLDER")}
                    </Typography>
                    <Search sx={{ fontSize: 18, width: 18, height: 18, color: "#6B6B6B", flexShrink: 0 }} />
                  </Box>
                </Box>
                {/* Desktop Search - original with toggle */}
                <Box sx={{ display: { xs: "none", md: "block" } }}>
                  <ButtonToggale icon={<Search />} _button={{ color: "primary" }}>
                    <SearchComponent
                      onSearch={handleSearchClick}
                      value={filterState?.query}
                    />
                  </ButtonToggale>
                </Box>
              </Box>
            </Box>
          )}
          <Content
            key="content-mfe" // Prevent re-mounting
            isShowLayout={false}
            activeTab={activeTab}
            contentTabs={
              _content?.tab === "Course"
                ? ["Course"]
                : ["Course", "Learning Resource"]
            }
            showFilter={true}
            showSearch={false}
            showHelpDesk={false}
            filterFramework={filterFramework}
            staticFilter={staticFilter}
            {..._content}
            _config={{
              tabChange: handleTabChange,
              default_img: "/images/image_ver.png",
              _card: {},
              _subBox: { sx: { px: 0.5 } },
              userIdLocalstorageName: "userId",
              ..._content?._config,
            }}
            filters={{
              ...filterState,
              filters: {
                ...filterState.filters,
                ...staticFilter,
              },
            }}
          />
        </Box>
      </Stack>
    </Stack>
  );
});

interface FilterChipProps {
  filters: Record<string, any>;
  staticFilter?: Record<string, object>;
  handleFilterChange: (newFilterState: any) => void;
}

const FilterChip: React.FC<FilterChipProps> = ({
  filters,
  staticFilter,
  handleFilterChange,
}) => {
  return (
    <>
      {filters
        ? Object.entries(filters)
            .filter(
              ([key, _]) =>
                !["limit", ...Object.keys(staticFilter ?? {})].includes(key)
            )
            .map(([key, value], index) => {
              if (typeof value === "object") {
                return (value as string[]).map((option, index) => (
                  <Chip
                    key={`${key}-${index}`}
                    label={option}
                    onDelete={() => {
                      const { [key]: options, ...rest } = filters ?? {};
                      const newOptions = options.filter(
                        (o: any) => o !== option
                      );
                      if (newOptions.length === 0) {
                        handleFilterChange({
                          ...rest,
                        });
                      } else {
                        handleFilterChange({
                          ...rest,
                          [key]: newOptions,
                        });
                      }
                    }}
                    sx={{ mr: 1, mb: 1, borderRadius: "8px" }}
                  />
                ));
              } else {
                return (
                  <Chip
                    key={key}
                    label={`${key}: ${value}`}
                    onDelete={() => {
                      const { [key]: _, ...rest } = filters ?? {};
                      handleFilterChange(rest);
                    }}
                    sx={{ mr: 1, mb: 1, borderRadius: "8px" }}
                  />
                );
              }
            })
        : null}
    </>
  );
};

const ButtonToggale = ({ children, icon }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);

  return (
    <Box sx={{ width: { xs: "100%", sm: "auto" }, display: "flex", flexDirection: "row", gap: { xs: 1, sm: 0 }, alignItems: "stretch" }}>
      {isOpen && (
        <Box sx={{ flex: { xs: 1, sm: "none" }, minWidth: 0, display: "flex", alignItems: "stretch" }}>
          {children}
        </Box>
      )}
      <Button
        onClick={toggle}
        variant={isOpen ? "contained" : "outlined"}
        color={isOpen ? "primary" : "inherit"}
        size="large"
        fullWidth={!isOpen}
        sx={{ 
          ml: { xs: 0, sm: 1 }, 
          borderRadius: "8px",
          minWidth: 0,
          height: { xs: "48px", sm: "auto" },
          width: { xs: isOpen ? "48px" : "100%", sm: "auto" },
          padding: { xs: "8px 12px", sm: "8px 16px" },
          flexShrink: { xs: isOpen ? 0 : 0, sm: 0 },
          borderWidth: { xs: isOpen ? 0 : "1px", sm: 0 },
          borderColor: { xs: isOpen ? "transparent" : "#DADADA !important", sm: "transparent" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          "& .MuiSvgIcon-root": {
            width: { xs: 18, sm: 20 },
            height: { xs: 18, sm: 20 },
          },
        }}
      >
        {isOpen ? <CloseIcon /> : icon}
      </Button>
    </Box>
  );
};