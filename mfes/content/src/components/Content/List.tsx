/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @nx/enforce-module-boundaries */
"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import SearchIcon from "@mui/icons-material/Search";
import { Box, Button } from "@mui/material";
import {
  calculateTrackDataItem,
  CommonSearch,
  ContentItem,
  getData,
} from "@shared-lib";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import BackToTop from "@content-mfes/components/BackToTop";
import RenderTabContent from "@content-mfes/components/ContentTabs";
import HelpDesk from "@content-mfes/components/HelpDesk";
import {
  ContentSearch,
  ContentSearchResponse as ImportedContentSearchResponse,
} from "@content-mfes/services/Search";
import FilterDialog from "@content-mfes/components/FilterDialog";
import { trackingData } from "@content-mfes/services/TrackingService";
import LayoutPage from "@content-mfes/components/LayoutPage";
import { getUserCertificates } from "@content-mfes/services/Certificate";
import { getUserId } from "@shared-lib-v2/utils/AuthService";
import {telemetryFactory} from "../../utils/telemetry";
// Constants
const SUPPORTED_MIME_TYPES = [
  "application/vnd.ekstep.ecml-archive",
  "application/vnd.ekstep.html-archive",
  "application/vnd.ekstep.h5p-archive",
  "application/pdf",
  "video/mp4",
  "video/webm",
  "application/epub",
  "video/x-youtube",
  "application/vnd.sunbird.questionset",
  "audio/mpeg",
  "audio/mp3",
];

const DEFAULT_TABS = [
  { label: "Courses", type: "Course" },
  { label: "Content", type: "Learning Resource" },
];

const LIMIT = 10;
const DEFAULT_FILTERS = {
  limit: LIMIT,
  offset: 0,
};

interface TrackDataItem {
  courseId: string;
  enrolled: boolean;
  [key: string]: any;
}

export interface ContentProps {
  _config?: any;
  filters?: object;
  contentTabs?: string[];
  activeTab?: string;
  pageName?: string;
  handleCardClick?: (content: ContentItem) => void | undefined;
  showFilter?: boolean;
  showSearch?: boolean;
  showBackToTop?: boolean;
  showHelpDesk?: boolean;
  isShowLayout?: boolean;
  hasMoreData?: boolean;
  filterFramework?: any;
  staticFilter?: any;
  onTotalCountChange?: (count: number) => void;
}

export default function Content(props: Readonly<ContentProps>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const [searchValue, setSearchValue] = useState("");
  const [tabValue, setTabValue] = useState<number>(0);
  const [tabs, setTabs] = useState<typeof DEFAULT_TABS>([]);
  const [contentData, setContentData] = useState<
    ImportedContentSearchResponse[]
  >([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(false);
  // Stabilize loading state to prevent blinking
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [localFilters, setLocalFilters] = useState<
    typeof DEFAULT_FILTERS & {
      type?: string;
      query?: string;
      filters?: object;
      identifier?: string;
    }
  >(DEFAULT_FILTERS);
  const [trackData, setTrackData] = useState<TrackDataItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [filterShow, setFilterShow] = useState(false);
  const [propData, setPropData] = useState<ContentProps>();
  const [filterFramework, setFilterFramework] = useState<any>(null);
  const [staticFilter, setStaticFilter] = useState<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasInitialized = useRef(false);
  // Session keys - memoized to prevent unnecessary re-renders
  const sessionKeys = useMemo(
    () => ({
      filters: `${props?.pageName}_savedFilters`,
      search: `${props?.pageName}_searchValue`,
      scrollId: `${props?.pageName}_scrollToContentId`,
    }),
    [props?.pageName]
  );

  // Save filters to session
  const persistFilters = useCallback(
    (f: any) => sessionStorage.setItem(sessionKeys.filters, JSON.stringify(f)),
    [sessionKeys.filters]
  );

  const handleSetFilters = useCallback((updater: any) => {
    setLocalFilters((prev) => {
      const updated =
        typeof updater === "function" ? updater(prev) : { ...prev, ...updater };

      // Only update if there's actually a change
      if (JSON.stringify(prev) === JSON.stringify(updated)) {
        return prev; // No change, return same object to prevent re-render
      }

      return { ...updated, loadOld: false };
    });
  }, []);

  // Sync tabValue with activeTab prop
  useEffect(() => {
    if (props.activeTab) {
      const tabIndex = props.activeTab === "Course" ? 0 : 1;
      setTabValue(tabIndex);

      // Update filters when activeTab changes
      const tabType =
        props.activeTab === "Course" ? "Course" : "Learning Resource";
      setLocalFilters((prev) => ({
        ...prev,
        offset: 0,
        type: tabType,
        loadOld: false,
      }));
    }
  }, [props.activeTab]);

  // Sync filters from props
  useEffect(() => {
    if (props.filters) {
      setLocalFilters((prev) => {
        // Only update if filters actually changed to prevent unnecessary re-renders
        const newFilters = { ...prev, ...props.filters, loadOld: false };
        if (JSON.stringify(prev) === JSON.stringify(newFilters)) {
          return prev; // No change, return same object to prevent re-render
        }
        return newFilters;
      });
    }
  }, [props.filters]);

  // Restore saved state
  useEffect(() => {
    // Prevent duplicate initialization in React StrictMode
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const init = async () => {
      const savedFilters = JSON.parse(
        sessionStorage.getItem(sessionKeys.filters) || "null"
      );
      const savedSearch = sessionStorage.getItem(sessionKeys.search) || "";

      // Get tab value from URL parameter
      const urlTab = searchParams.get("tab");
      const parsedTab = urlTab ? parseInt(urlTab) : 0;
      // Ensure savedTab is within valid range for DEFAULT_TABS
      const savedTab = Math.max(
        0,
        Math.min(parsedTab, DEFAULT_TABS.length - 1)
      );

      const config = props ?? (await getData("mfes_content_pages_content"));
      setPropData(config);
      setSearchValue(savedSearch);

      // Fetch framework data for dynamic filters
      try {
        const collectionFramework = localStorage.getItem("collectionFramework");
        const channelId = localStorage.getItem("channelId");

        if (collectionFramework) {
          // Import filterContent dynamically to avoid SSR issues
          const { filterContent, staticFilterContent } = await import(
            "@shared-lib-v2/utils/AuthService"
          );

          const [frameworkData, staticData] = await Promise.all([
            filterContent({ instantId: collectionFramework }),
            channelId
              ? staticFilterContent({ instantFramework: channelId })
              : null,
          ]);

          // Filter out invalid terms with template placeholders
          const cleanedFrameworkData = {
            ...frameworkData,
            framework: {
              ...frameworkData?.framework,
              categories:
                frameworkData?.framework?.categories?.map((category: any) => {
                  const originalTerms = category.terms || [];
                  const filteredTerms = originalTerms.filter((term: any) => {
                    const hasTemplate =
                      term.code?.includes("{{") || term.name?.includes("{{");
                    const isLive = term.status === "Live";
                    const isValid = !hasTemplate && isLive;

                    if (!isValid) {
                     
                    }

                    return isValid;
                  });

                  console.log(
                    `🔍 Content MFE - Category ${category.name}: ${originalTerms.length} original terms, ${filteredTerms.length} filtered terms`
                  );

                  return {
                    ...category,
                    terms: filteredTerms,
                  };
                }) || [],
            },
          };

          setFilterFramework(cleanedFrameworkData);
          setStaticFilter(staticData);

          // Debug: Log framework data
        

          // Log each category with its terms
          if (frameworkData?.framework?.categories) {
            frameworkData.framework.categories.forEach(
              (category: any, index: number) => {
             
                if (category.terms) {
                  category.terms.forEach((term: any, termIndex: number) => {
                 
                  });
                }
              }
            );
          }
        }
      } catch (error) {
        console.error("Error fetching framework data:", error);
      }
      if (savedFilters) {
        setLocalFilters({
          ...(config?.filters ?? {}),
          ...(props?.filters ?? {}), // Use filters from props
          type:
            props?.contentTabs?.length === 1
              ? props.contentTabs[savedTab]
              : DEFAULT_TABS[savedTab]?.type || DEFAULT_TABS[0].type,
          ...savedFilters,
          loadOld: true,
        });
      } else {
        setLocalFilters((prev) => ({
          ...prev,
          ...(config?.filters ?? {}),
          ...(props?.filters ?? {}), // Use filters from props
          type:
            props?.contentTabs?.length === 1
              ? props.contentTabs[savedTab]
              : DEFAULT_TABS[savedTab]?.type || DEFAULT_TABS[0].type,
          loadOld: false,
        }));
      }

      setTabs(
        DEFAULT_TABS.filter((tab) =>
          config?.contentTabs?.length
            ? config.contentTabs.includes(tab.label.toLowerCase())
            : true
        )
      );
      setTabValue(savedTab);
      setIsPageLoading(false);
    };
    init();
  }, [
    props.contentTabs,
    sessionKeys.filters,
    sessionKeys.search,
    searchParams,
  ]);
  // Fetch content with loop to load full data up to offset
  const fetchAllContent = useCallback(
    async (filter: any) => {
      const content: any[] = [];
      const QuestionSet: any[] = [];
      let count = 0;

      // Determine type - prioritize activeTab prop to ensure correct primaryCategory
      // Tab 0 (Course): activeTab="Course" → type="Course" → primaryCategory=["Course"]
      // Tab 1 (Content): activeTab="content" → type="Learning Resource" → primaryCategory=[all content categories]
      let determinedType: string | undefined;
      
      if (props.activeTab === "Course") {
        determinedType = "Course";
      } else if (props.activeTab && props.activeTab !== "Course") {
        determinedType = "Learning Resource";
      } else {
        // Fallback to filter.type or tab-based determination
        determinedType = filter.type || 
          (tabs[tabValue]?.type) || 
          (tabs[tabValue]?.label === "Courses" || tabs[tabValue]?.label === "Course"
            ? "Course"
            : "Learning Resource");
      }

      if (!determinedType) {
        console.warn('⚠️ fetchAllContent - No type determined, skipping fetch');
        return { content, QuestionSet, count };
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Calculate adjusted limit if loadOld is true
      const adjustedLimit = filter.loadOld
        ? Math.min(filter.offset + filter.limit, 10) // Cap at 10 to prevent large API calls
        : filter.limit;
      const adjustedOffset = filter.loadOld ? 0 : filter.offset;

      // Extract type and filters separately to ensure type is passed correctly
      const { type, filters: filterFilters, query: filterQuery, ...restFilter } = filter;
      
      // Log for debugging
     
      const resultResponse = await ContentSearch({
        type: determinedType, // Use the determined type
        query: filterQuery || filter.query,
        filters: filterFilters || filter.filters,
        offset: adjustedOffset,
        limit: adjustedLimit,
      });
      if (resultResponse?.result?.count) {
        setTotalCount(resultResponse?.result?.count);
      }

      const response = resultResponse?.result;
      if (props?._config?.getContentData) {
        props._config.getContentData(response);
      }

      content.push(...(response?.content || []));
      QuestionSet.push(...(response?.QuestionSet || []));
      count = response?.count || 0;

      return {
        content,
        QuestionSet,
        count,
      };
    },
    [props?._config, props.activeTab, tabs, tabValue]
  );

  // Memoized track data fetching
  const fetchDataTrack = useCallback(
    async (
      resultData: ImportedContentSearchResponse[]
    ): Promise<TrackDataItem[]> => {
      if (!resultData.length) {
        return [];
      }

      try {
        const courseList = resultData
          .map((item) => item.identifier)
          .filter((id): id is string => id !== undefined);
        const userId = getUserId(props?._config?.userIdLocalstorageName);

        if (!userId || !courseList.length) {
          return [];
        }
        const userIdArray = userId.split(",").filter(Boolean);
        const [courseTrackData, certificates] = await Promise.all([
          trackingData(userIdArray, courseList),
          getUserCertificates({
            userId: userId,
            courseId: courseList,
            limit: localFilters.limit,
            offset: localFilters.offset,
          }),
        ]);

        if (!courseTrackData?.data) return [];

        const userTrackData =
          courseTrackData.data.find((course: any) => course.userId === userId)
            ?.course ?? [];

        return userTrackData.map((item: any) => ({
          ...item,
          ...calculateTrackDataItem(
            item,
            resultData.find(
              (subItem) => item.courseId === subItem.identifier
            ) ?? {}
          ),
          enrolled: Boolean(
            certificates.result.data.find(
              (cert: any) => cert.courseId === item.courseId
            )?.status === "enrolled"
          ),
        }));
      } catch (error) {
        console.error("Error fetching track data:", error);
        return [];
      }
    },
    [
      localFilters.limit,
      localFilters.offset,
      props?._config?.userIdLocalstorageName,
    ]
  );

  // Load content when filters change
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (
        !localFilters.type ||
        !localFilters.limit ||
        localFilters.offset === undefined
      )
        return;

      // Prevent duplicate API calls
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Only show loading spinner for initial load, not for search
      if (localFilters.offset === 0 && !localFilters.query) {
        setIsLoading(true);
        setIsInitialLoad(true);
      } else if (localFilters.query) {
        // For search operations, use a different loading state
        setIsSearching(true);
      }

      try {
        const response = await fetchAllContent(localFilters);
    

        if (!response || !isMounted) return;
        const newContentData = [
          ...(response.content ?? []),
          ...(response?.QuestionSet ?? []),
        ];

        // Set content data immediately
        if (localFilters.offset === 0) {
          setContentData(newContentData);
        } else {
          setContentData((prev) => [...(prev ?? []), ...newContentData]);
        }

        // Fetch track data in parallel (non-blocking)
        fetchDataTrack(newContentData)
          .then((userTrackData) => {
            if (!isMounted) return;
            if (localFilters.offset === 0) {
              setTrackData(userTrackData);
            } else {
              setTrackData((prev) => [...prev, ...userTrackData]);
            }
          })
          .catch((error) => {
            console.error("🔍 Error fetching track data:", error);
          });

        setHasMoreData(
          propData?.hasMoreData === false
            ? false
            : response.count > localFilters.offset + newContentData.length
        );

        // Clear loading states
        setIsLoading(false);
        setIsSearching(false);
        if (localFilters.offset === 0) {
          setIsInitialLoad(false);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        // Set empty arrays on error to maintain array type
        if (localFilters.offset === 0) {
          setContentData([]);
          setTrackData([]);
        }
        setIsLoading(false);
        setIsSearching(false);
        if (localFilters.offset === 0) {
          setIsInitialLoad(false);
        }
      }
    };
    fetchData();

    return () => {
      isMounted = false;
      abortControllerRef.current?.abort();
    };
  }, [localFilters, propData]);

  // Scroll to saved card ID
  useEffect(() => {
    const scrollId = sessionStorage.getItem(sessionKeys.scrollId);
    if (!scrollId || !contentData?.length) return;
    const el = document.getElementById(scrollId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      sessionStorage.removeItem(sessionKeys.scrollId);
      sessionStorage.removeItem(sessionKeys.filters);
    } else {
      // Retry in the next animation frame if element not yet mounted
      requestAnimationFrame(() => {
        const retryEl = document.getElementById(scrollId);
        if (retryEl) {
          retryEl.scrollIntoView({ behavior: "smooth" });
          sessionStorage.removeItem(sessionKeys.scrollId);
          sessionStorage.removeItem(sessionKeys.filters);
        }
      });
    }
  }, [contentData, sessionKeys.scrollId]);

  // Event handlers
  const handleLoadMore = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      // Use the type from the tab object, or fallback to checking the label
      const type = tabs[tabValue]?.type || 
        (tabs[tabValue]?.label === "Courses" || tabs[tabValue]?.label === "Course"
          ? "Course"
          : "Learning Resource");
      
    
      handleSetFilters({
        ...localFilters,
        offset: localFilters.offset + localFilters.limit,
        type,
      });
    },
    [handleSetFilters, localFilters, tabs, tabValue]
  );

  // UI Handlers
  const handleSearchClick = useCallback(() => {
    sessionStorage.setItem(sessionKeys.search, searchValue);
    handleSetFilters((prev: any) => ({
      ...prev,
      query: searchValue.trim(),
      offset: 0,
    }));
  }, [searchValue, sessionKeys.search, handleSetFilters]);

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchValue(event.target.value);
    },
    []
  );

  const handleTabChange = (event: any, newValue: number) => {
    setTabValue(newValue);

    // If there's a parent tabChange handler, use it instead of handling URL ourselves
    if (propData?._config?.tabChange) {
      propData._config.tabChange(tabs[newValue].label);
      // Don't call handleSetFilters here - let the parent handle the data fetching
    } else {
      // Update URL with new tab parameter only if no parent handler
      const url = new URL(window.location.href);
      url.searchParams.set("tab", newValue.toString());
      router.replace(url.pathname + url.search);

      // Only call handleSetFilters when there's no parent handler
      handleSetFilters({
        offset: 0,
        type: tabs[newValue].type,
      });
    }
  };
  const handleCardClickLocal = useCallback(
    async (content: ContentItem) => {
      const telemetryInteract = {
        context: { env: "prod", cdata: [] },
        edata: {
          id: "content-click",
          type: "CLICK",
          pageid: `content-${content.identifier}`,
          uid: localStorage.getItem("userId") || "Anonymous",
        },
      };
      telemetryFactory.interact(telemetryInteract);
      try {
        sessionStorage.setItem(sessionKeys.scrollId, content.identifier);
        persistFilters(localFilters);
        if (propData?.handleCardClick) {
          propData.handleCardClick(content);
        } else if (SUPPORTED_MIME_TYPES.includes(content?.mimeType)) {
          // Get unitId from URL params if available
          const unitId = params?.unitId as string;
          const courseId = params?.courseId as string;

          // Build URL with unitId if available
          let activeLinkUrl = window.location.pathname;

          // Include tab parameter in activeLink
          if (tabValue !== undefined) {
            activeLinkUrl += `?tab=${tabValue}`;
          }

          let playerUrl = `${props?._config?.contentBaseUrl ?? ""}/player/${
            content?.identifier
          }?activeLink=${encodeURIComponent(activeLinkUrl)}`;

          if (unitId) {
            playerUrl += `&unitId=${unitId}`;
          }
          if (courseId) {
            playerUrl += `&courseId=${courseId}`;
          }

          router.push(playerUrl);
        } else {
          // Get unitId from URL params if available
          const unitId = params?.unitId as string;
          const courseId = params?.courseId as string;
          // Build URL with unitId if available
          let activeLinkUrl = window.location.pathname;

          // Include tab parameter in activeLink
          if (tabValue !== undefined) {
            activeLinkUrl += `?tab=${tabValue}`;
          }

          let contentDetailsUrl = `${
            props?._config?.contentBaseUrl ?? ""
          }/content-details/${
            content?.identifier
          }?activeLink=${encodeURIComponent(activeLinkUrl)}`;

          if (unitId) {
            contentDetailsUrl += `&unitId=${unitId}`;
          }
          if (courseId) {
            contentDetailsUrl += `&courseId=${courseId}`;
          }

          router.push(contentDetailsUrl);
        }
      } catch (error) {
        console.error("Failed to handle card click:", error);
      }
    },
    [
      propData?.handleCardClick,
      props?._config?.contentBaseUrl,
      sessionKeys.scrollId,
      router,
      localFilters,
      persistFilters,
      params,
    ]
  );

  const handleApplyFilters = useCallback((selectedValues: any) => {
    setFilterShow(false);
    handleSetFilters((prev: any) => ({
      ...prev,
      offset: 0,
      filters:
        Object.keys(selectedValues).length === 0
          ? {}
          : { ...prev.filters, ...selectedValues },
    }));
  }, []);

  // Memoized JSX
  const searchAndFilterSection = useMemo(
    () =>
      (propData?.showSearch ?? propData?.showFilter) && (
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            overflow: "unset !important",
          }}
        >
          {propData?.showSearch && (
            <CommonSearch
              placeholder="Search content.."
              rightIcon={<SearchIcon />}
              onRightIconClick={handleSearchClick}
              inputValue={searchValue}
              onInputChange={handleSearchChange}
              onKeyPress={(ev: any) =>
                ev.key === "Enter" && handleSearchClick()
              }
              sx={{
                backgroundColor: "#f0f0f0",
                padding: "4px",
                borderRadius: "50px",
                width: "100%",
                marginLeft: "10px",
              }}
            />
          )}
          {propData?.showFilter && (
            <Box>
              <Button
                variant="outlined"
                onClick={() => {
                
                  setFilterShow(true);
                }}
              >
                <FilterAltOutlinedIcon />
              </Button>
              <FilterDialog
                open={filterShow}
                onClose={() => setFilterShow(false)}
                filterValues={localFilters}
                filterFramework={filterFramework}
                staticFilter={staticFilter}
                onApply={handleApplyFilters}
              />
              {/* Debug: Log when FilterDialog is rendered */}
              {filterShow &&
                (() => {
                  console.log("🔍 Content - Rendering FilterDialog with:", {
                    filterFramework: filterFramework,
                    categoriesCount:
                      filterFramework?.framework?.categories?.length,
                    staticFilter: staticFilter,
                  });
                  return null;
                })()}
            </Box>
          )}
        </Box>
      ),
    [
      propData?.showSearch,
      propData?.showFilter,
      searchValue,
      filterShow,
      localFilters,
      handleSearchClick,
      handleSearchChange,
      handleApplyFilters,
    ]
  );

  // Call onTotalCountChange callback when totalCount changes
  useEffect(() => {
    if (props?.onTotalCountChange) {
      props.onTotalCountChange(totalCount);
    }
  }, [totalCount, props?.onTotalCountChange]);

  // Infinite scroll implementation
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - 1000 &&
        hasMoreData &&
        !isLoading
      ) {
        handleLoadMore({} as React.MouseEvent);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMoreData, isLoading, handleLoadMore]);

  return (
    <LayoutPage
      isLoadingChildren={isInitialLoad}
      isShow={propData?.isShowLayout}
    >
      {searchAndFilterSection}
      <RenderTabContent
        {...propData}
        value={tabValue}
        onChange={handleTabChange}
        contentData={contentData}
        _config={propData?._config ?? {}}
        trackData={trackData as any}
        type={localFilters?.type ?? ""}
        handleCardClick={handleCardClickLocal}
        hasMoreData={hasMoreData}
        handleLoadMore={handleLoadMore}
        isLoadingMoreData={isLoading}
        isPageLoading={isInitialLoad}
        isSearching={isSearching}
        tabs={tabs}
        isHideEmptyDataMessage={propData?.hasMoreData !== false}
      />
      {propData?.showHelpDesk && <HelpDesk />}
      {propData?.showBackToTop && <BackToTop />}
    </LayoutPage>
  );
}
