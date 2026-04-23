/* eslint-disable @nx/enforce-module-boundaries */
// pages/content-details/[identifier].tsx

"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Alert,
} from "@mui/material";
import { useRouter, useParams } from "next/navigation";
import LayoutPage from "@content-mfes/components/LayoutPage";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  createUserCertificateStatus,
  getUserCertificateStatus,
} from "@content-mfes/services/Certificate";
import InfoCard from "@content-mfes/components/Card/InfoCard";
import { hierarchyAPI } from "@content-mfes/services/Hierarchy";
import { ContentSearchResponse } from "@content-mfes/services/Hierarchy";
import { checkAuth, getUserId } from "@shared-lib-v2/utils/AuthService";
import SpeakableText from "@shared-lib-v2/lib/textToSpeech/SpeakableText";
import { useTranslation } from "@shared-lib-v2/lib/context/LanguageContext";
import { Loader } from "@shared-lib-v2/lib/Loader/Loader";
import UnitGrid from "@content-mfes/components/UnitGrid";
import { ContentItem } from "@shared-lib";
import {telemetryFactory} from "../../utils/telemetry";
interface ContentDetailsProps {
  isShowLayout: boolean;
  id?: string;
  getIfEnrolled?: (content: ContentSearchResponse) => void;
  _config?: any;
}

const ContentDetails = (props: ContentDetailsProps) => {
  const [checkLocalAuth, setCheckLocalAuth] = useState(false);
  const [isProgressCompleted, setIsProgressCompleted] = useState(false);
  const router = useRouter();
  const params = useParams();
  const identifier = props.id ?? params?.identifier; // string | string[] | undefined
  const [contentDetails, setContentDetails] =
    useState<ContentSearchResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  let activeLink = null;
  if (typeof window !== "undefined") {
    const searchParams = new URLSearchParams(window.location.search);
    activeLink = searchParams.get("activeLink");
    if (!activeLink) {
      activeLink = "";
    }
  }
  const { t } = useTranslation();
  useEffect(() => {
    const telemetryInteract = {
            context: { env: "prod", cdata: [] },
            edata: {
              id: "course-click",
              type: "CLICK",
              pageid: `course-${identifier}`,
              uid: localStorage.getItem("userId") || "Anonymous",
            },
          };
          telemetryFactory.interact(telemetryInteract);
    const fetchContentDetails = async () => {
      try {
        if (!identifier) {
          console.error("ContentEnroll - No identifier provided");
          setIsLoading(false);
          return;
        }

        console.log(
          "ContentEnroll - Fetching content details for identifier:",
          identifier
        );
        const result = await hierarchyAPI(identifier as string);

        // Fallback: If no children but we have leafNodes, create a basic structure
        if (!result?.children || result.children.length === 0) {
          // Check if we have relational_metadata with hierarchical structure
          if (result?.relational_metadata) {
            try {
              const relationalData = JSON.parse(result.relational_metadata);
              console.log(
                "ContentEnroll - Parsed relational_metadata:",
                relationalData
              );

              // Get the root course structure
              const courseId = result.identifier;
              if (courseId && relationalData[courseId]) {
                const courseStructure = relationalData[courseId];

                if (
                  courseStructure &&
                  courseStructure.children &&
                  courseStructure.children.length > 0
                ) {
                  console.log(
                    "ContentEnroll - Found course structure in relational_metadata:",
                    courseStructure
                  );

                  // Create children structure from relational_metadata
                  result.children = courseStructure.children.map(
                    (childId: string) => {
                      const childStructure = relationalData[childId];
                      if (childStructure) {
                        return {
                          identifier: childId,
                          name: childStructure.name,
                          mimeType: "application/vnd.ekstep.content-collection",
                          contentType: "CourseUnit",
                          description: childStructure.name,
                          appIcon: result.appIcon,
                          posterImage: result.posterImage,
                          children: childStructure.children
                            ? childStructure.children.map(
                                (grandChildId: string) => {
                                  const grandChildStructure =
                                    relationalData[grandChildId];
                                  return {
                                    identifier: grandChildId,
                                    name:
                                      grandChildStructure?.name ||
                                      `Content ${grandChildId}`,
                                    mimeType:
                                      "application/vnd.ekstep.ecml-archive",
                                    contentType: "Resource",
                                    description:
                                      grandChildStructure?.name ||
                                      "Content item",
                                    appIcon: result.appIcon,
                                    posterImage: result.posterImage,
                                  };
                                }
                              )
                            : [],
                        };
                      }
                      return {
                        identifier: childId,
                        name: `Unit ${childId}`,
                        mimeType: "application/vnd.ekstep.content-collection",
                        contentType: "CourseUnit",
                        description: "Course unit",
                        appIcon: result.appIcon,
                        posterImage: result.posterImage,
                        children: [],
                      };
                    }
                  );

                  console.log(
                    "ContentEnroll - Created children from relational_metadata:",
                    result.children
                  );
                } else if (result?.leafNodes && result.leafNodes.length > 0) {
                  console.log(
                    "ContentEnroll - Creating fallback children structure from leafNodes"
                  );
                  // Create a basic children structure from leafNodes
                  result.children = result.leafNodes.map(
                    (leafNodeId: string, index: number) => ({
                      identifier: leafNodeId,
                      name: `Content ${index + 1}`,
                      mimeType: "application/vnd.ekstep.ecml-archive", // Default mime type
                      contentType: "Resource",
                      description: "Content item",
                      appIcon: result.appIcon,
                      posterImage: result.posterImage,
                    })
                  );
                  console.log(
                    "ContentEnroll - Created fallback children:",
                    result.children
                  );
                }
              }
            } catch (error) {
              console.error(
                "ContentEnroll - Error parsing relational_metadata:",
                error
              );
              // Fallback to leafNodes if relational_metadata parsing fails
              if (result?.leafNodes && result.leafNodes.length > 0) {
                console.log(
                  "ContentEnroll - Creating fallback children structure from leafNodes after parsing error"
                );
                result.children = result.leafNodes.map(
                  (leafNodeId: string, index: number) => ({
                    identifier: leafNodeId,
                    name: `Content ${index + 1}`,
                    mimeType: "application/vnd.ekstep.ecml-archive",
                    contentType: "Resource",
                    description: "Content item",
                    appIcon: result.appIcon,
                    posterImage: result.posterImage,
                  })
                );
              }
            }
          } else if (result?.leafNodes && result.leafNodes.length > 0) {
            console.log(
              "ContentEnroll - Creating fallback children structure from leafNodes"
            );
            // Create a basic children structure from leafNodes
            result.children = result.leafNodes.map(
              (leafNodeId: string, index: number) => ({
                identifier: leafNodeId,
                name: `Content ${index + 1}`,
                mimeType: "application/vnd.ekstep.ecml-archive", // Default mime type
                contentType: "Resource",
                description: "Content item",
                appIcon: result.appIcon,
                posterImage: result.posterImage,
              })
            );
            console.log(
              "ContentEnroll - Created fallback children:",
              result.children
            );
          }
        }

        const userId = getUserId(props?._config?.userIdLocalstorageName);
        setCheckLocalAuth(checkAuth(Boolean(userId)));
        if (props?._config?.isEnrollmentRequired !== false) {
          if (checkAuth(Boolean(userId))) {
            const data = await getUserCertificateStatus({
              userId: userId as string,
              courseId: identifier as string,
            });
            if (
              [
                "enrolled",
                "inprogress",
                "completed",
                "viewCertificate",
              ].includes(data?.result?.status)
            ) {
              if (props?.getIfEnrolled) {
                props?.getIfEnrolled(
                  result as unknown as ContentSearchResponse
                );
              } else {
                router.replace(
                  `${
                    props?._config?.contentBaseUrl ?? "/content"
                  }/${identifier}${
                    activeLink ? `?activeLink=${activeLink}` : ""
                  }`
                );
              }
            } else {
              setIsProgressCompleted(true);
            }
          } else {
            setIsProgressCompleted(true);
          }
        } else {
          router.replace(
            `${props?._config?.contentBaseUrl ?? "/content"}/${identifier}${
              activeLink ? `?activeLink=${activeLink}` : ""
            }`
          );
        }
        console.log("result fetchContentDetails", result);

        setContentDetails(result as unknown as ContentSearchResponse);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unknown error while fetching content details.";
        console.error("ContentEnroll - Failed to fetch content:", {
          error: error,
          identifier: identifier,
          errorMessage: message,
          stack: error instanceof Error ? error.stack : undefined,
        });
        setErrorMessage(
          `Unable to fetch course details for ${identifier}. ${
            (error as any)?.response?.status
              ? `Server responded with ${(error as any).response.status}.`
              : message
          }`
        );

        // Set a fallback content structure to prevent complete failure
        setContentDetails({
          identifier: identifier as string,
          name: "Content Not Available",
          description:
            "Unable to load content details. Please try again later.",
          children: [],
          appIcon: "/images/image_ver.png",
          posterImage: "/images/image_ver.png",
        } as unknown as ContentSearchResponse);
        setIsProgressCompleted(true);
      } finally {
        setIsLoading(false);
      }
    };
    if (identifier) {
      fetchContentDetails();
    } else {
      setIsLoading(false);
    }
  }, [identifier, activeLink, props, router]);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const userId = getUserId(props?._config?.userIdLocalstorageName);
      if (userId) {
        await createUserCertificateStatus({
          userId,
          courseId: identifier as string,
        });

        router.replace(
          `${props?._config?.contentBaseUrl ?? "/content"}/${identifier}${
            activeLink ? `?activeLink=${activeLink}` : ""
          }`
        );
      } else {
        router.replace(
          `/login?redirectUrl=${
            props?._config?.contentBaseUrl ?? "/content"
          }-details/${identifier}${
            activeLink ? `&activeLink=${activeLink}` : ""
          }`
        );
      }
    } catch (error) {
      console.error("Failed to create user certificate:", error);
    }
    setIsLoading(false);
  };
  const onBackClick = () => {
    router.back();
  };

  if (!isProgressCompleted) {
    return <Loader isLoading={true} />;
  } else {
    return (
      <LayoutPage
        isLoadingChildren={isLoading || activeLink === null}
        isShow={props?.isShowLayout}
      >
        <InfoCard
          item={contentDetails}
          topic={contentDetails?.se_subjects?.join(",")}
          onBackClick={onBackClick}
          _config={{ 
            onButtonClick: handleClick, 
            userIdLocalstorageName: props?._config?.userIdLocalstorageName || 'userId',
            ...props?._config 
          }}
          checkLocalAuth={checkLocalAuth}
        />
        {errorMessage && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="error">{errorMessage}</Alert>
          </Box>
        )}
        <Box sx={{ display: "flex" }}>
          <Box
            sx={{
              display: { xs: "none", sm: "none", md: "flex" },
              flex: { xs: 6, md: 4, lg: 3, xl: 3 },
            }}
          />
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              flex: { xs: 6, md: 8, lg: 9, xl: 9 },
              px: "18px",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                py: 4,
                width: { sx: "100%", sm: "90%", md: "85%" },
              }}
            >
              <Box>
                <Typography
                  variant="body1"
                  component="div"
                  sx={{
                    fontWeight: 400,
                    // fontSize: '16px',
                    // lineHeight: '24px',
                    letterSpacing: "0.5px",
                    color: "#4D4639",
                    textTransform: "capitalize",
                  }}
                  fontWeight={400}
                >
                  <SpeakableText>
                    {contentDetails?.description ?? "No description available"}
                  </SpeakableText>
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                }}
              >
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 400,
                    // fontSize: '22px',
                    // lineHeight: '28px',
                    letterSpacing: "0px",
                    verticalAlign: "middle",
                    color: "#1F1B13",
                  }}
                >
                  <SpeakableText>{t("COMMON.WHAT_YOU_LL_LEARN")}</SpeakableText>
                </Typography>

                {contentDetails?.children &&
                  contentDetails?.children?.length > 0 && (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      {contentDetails?.children?.map(
                        (item: any, index: number) => (
                          <Accordion
                            key={item.identifier || index}
                            defaultExpanded={index === 0}
                          >
                            <AccordionSummary
                              expandIcon={<ExpandMoreIcon />}
                              aria-controls={`panel${index}-content`}
                              id={`panel${index}-header`}
                            >
                              <Typography variant="h6">{item.name}</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              {(() => {
                                console.log(
                                  `ContentEnroll - About to render UnitGrid for item ${index}:`,
                                  {
                                    identifier: item.identifier,
                                    name: item.name,
                                    childrenLength: item?.children?.length,
                                    children: item?.children,
                                  }
                                );
                                return (
                                  <UnitGrid
                                    item={item}
                                    _config={{
                                      ...props?._config,
                                      userIdLocalstorageName: props?._config?.userIdLocalstorageName || 'userId'
                                    }}
                                    handleItemClick={(content: ContentItem) => {
                                      // Handle navigation to content details or player
                                      const unitId = item?.identifier;
                                     const telemetryInteract = {
                                             context: { env: "prod", cdata: [] },
                                             edata: {
                                               id: "unit-click",
                                               type: "CLICK",
                                               pageid: `unit-${unitId}`,
                                               uid: localStorage.getItem("userId") || "Anonymous",
                                             },
                                           };
                                           telemetryFactory.interact(telemetryInteract);
                                      const courseId = Array.isArray(identifier)
                                        ? identifier[0]
                                        : identifier;
                                      const queryParams = new URLSearchParams();
                                      if (unitId)
                                        queryParams.append("unitId", unitId);
                                      if (courseId)
                                        queryParams.append(
                                          "courseId",
                                          courseId
                                        );

                                      if (
                                        content?.mimeType ===
                                        "application/vnd.ekstep.content-collection"
                                      ) {
                                        // Navigate to content details for collections
                                        router.push(
                                          `${
                                            props?._config?.contentBaseUrl ?? ""
                                          }/content-details/${
                                            content?.identifier
                                          }?${queryParams.toString()}&activeLink=${
                                            window.location.pathname
                                          }`
                                        );
                                      } else {
                                        // Navigate to player for individual content
                                        router.push(
                                          `${
                                            props?._config?.contentBaseUrl ?? ""
                                          }/player/${
                                            content?.identifier
                                          }?${queryParams.toString()}&activeLink=${
                                            window.location.pathname
                                          }`
                                        );
                                      }
                                    }}
                                  />
                                );
                              })()}
                            </AccordionDetails>
                          </Accordion>
                        )
                      )}
                    </Box>
                  )}
              </Box>
            </Box>
          </Box>
        </Box>
      </LayoutPage>
    );
  }
};

export default ContentDetails;