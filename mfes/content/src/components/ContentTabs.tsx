import { Box, Tab, Tabs, CircularProgress } from "@mui/material";
import { ContentItem, Loader, useTranslation } from "@shared-lib"; // Updated import
import React, { memo } from "react";
import { ContentSearchResponse } from "@content-mfes/services/Search";
import ContentCardGrid from "@content-mfes/components/Card/ContentCardGrid";
import ContentCardCarousel from "@content-mfes/components/Card/ContentCardCarousel";

const RenderTabContent = memo(
  ({
    contentData,
    _config,
    trackData,
    type,
    handleCardClick,
    hasMoreData,
    handleLoadMore,
    tabs,
    value,
    onChange,
    ariaLabel,
    isLoadingMoreData,
    isPageLoading,
    isSearching,
    isHideEmptyDataMessage,
  }: {
    contentData: ContentSearchResponse[];
    _config: any;
    trackData?: [];
    type: string;
    handleCardClick: (content: ContentItem, e?: any) => void;
    hasMoreData: boolean;
    handleLoadMore: (e: any) => void;
    tabs?: any[];
    value?: number;
    onChange?: (event: React.SyntheticEvent, newValue: number) => void;
    ariaLabel?: string;
    isLoadingMoreData: boolean;
    isPageLoading: boolean;
    isSearching?: boolean;
    isHideEmptyDataMessage?: boolean;
  }) => {
    const { t } = useTranslation();
    const { _box, _tabs } = _config ?? {};
    return (
      <Box sx={{ width: "100%", ...(_box?.sx ?? {}) }}>
        {tabs?.length !== undefined && tabs?.length > 1 && (
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              {..._tabs}
              value={value ?? 0}
              onChange={onChange}
              aria-label={ariaLabel}
            >
              {tabs.map((tab: any, index: number) => (
                <Tab
                  key={tab.label}
                  icon={tab.icon ?? undefined}
                  label={tab.label}
                  {...{
                    id: `simple-tab-${index}`,
                    "aria-controls": `simple-tabpanel-${index}`,
                  }}
                />
              ))}
            </Tabs>
          </Box>
        )}
        <Box
          sx={{
            flexGrow: 1,
            mt: tabs?.length !== undefined && tabs?.length > 1 ? 2 : 0,
          }}
        >
          {/* Only show loader for initial page load, not for search operations */}
          {isPageLoading && !contentData.length ? (
            <Loader
              isLoading={isPageLoading}
              layoutHeight={197}
              isHideMaxHeight
              _loader={{ backgroundColor: "transparent" }}
            >
              <div />
            </Loader>
          ) : (
            <>
              {/* Subtle search loading indicator */}
              {isSearching && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    zIndex: 1000,
                    pointerEvents: "none",
                  }}
                >
                  <CircularProgress size={24} />
                </Box>
              )}
              {contentData?.length > 0 && _config?.isShowInCarousel && (
                <ContentCardCarousel
                  contentData={contentData}
                  _config={_config}
                  type={type}
                  handleCardClick={handleCardClick}
                  trackData={trackData}
                  hasMoreData={hasMoreData}
                  handleLoadMore={handleLoadMore}
                  isLoadingMoreData={isLoadingMoreData}
                  isHideEmptyDataMessage={isHideEmptyDataMessage}
                />
              )}
              {!_config?.isShowInCarousel && (
                <ContentCardGrid
                  contentData={contentData}
                  _config={_config}
                  type={type}
                  handleCardClick={handleCardClick}
                  trackData={trackData}
                  hasMoreData={hasMoreData}
                  handleLoadMore={handleLoadMore}
                  isLoadingMoreData={isLoadingMoreData}
                  isHideEmptyDataMessage={isHideEmptyDataMessage}
                />
              )}
            </>
          )}
        </Box>
      </Box>
    );
  }
);

RenderTabContent.displayName = "RenderTabContent";
export default RenderTabContent;
