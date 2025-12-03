/* eslint-disable @nx/enforce-module-boundaries */
"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Grid, Typography } from "@mui/material";
import {
  calculateTrackData,
  calculateTrackDataItem,
  CourseCompletionBanner,
  trackDataPorps,
  findCourseUnitPath,
} from "@shared-lib";
import { hierarchyAPI } from "@content-mfes/services/Hierarchy";
import { trackingData } from "@content-mfes/services/TrackingService";
import LayoutPage from "@content-mfes/components/LayoutPage";
import UnitGrid from "@content-mfes/components/UnitGrid";
import CollapsebleGrid from "@content-mfes/components/CommonCollapse";
import InfoCard from "@content-mfes/components/Card/InfoCard";
import {
  getUserCertificateStatus,
  issueCertificate,
} from "@content-mfes/services/Certificate";
import AppConst from "@content-mfes/utils/AppConst/AppConst";
import { checkAuth, getUserId } from "@shared-lib-v2/utils/AuthService";
import { getUserId as getUserIdLocal } from "@content-mfes/services/LoginService";
import BreadCrumb from "../BreadCrumb";

interface DetailsProps {
  isShowLayout?: any;
  isHideInfoCard?: boolean;
  showBreadCrumbs?: any;
  id?: string;
  type?: "collapse" | "card";
  _config?: any;
  _box?: any;
}

const getUnitFromHierarchy = (resultHierarchy: any, unitId: string): any => {
  if (resultHierarchy?.identifier === unitId) {
    return resultHierarchy;
  }
  console.log("resultHierarchy", resultHierarchy);
  console.log("unitId", unitId);
  if (resultHierarchy?.children) {
    for (const child of resultHierarchy.children) {
      const unit = getUnitFromHierarchy(child, unitId);
      if (unit) {
        return unit;
      }
    }
  }
  return null;
};

export default function Details(props: DetailsProps) {
  const router = useRouter();
  const { courseId, unitId, identifier: contentId } = useParams();
  console.log("CourseUnitDetails - URL params:", {
    courseId,
    unitId,
    contentId,
  });
  const identifier = courseId;
  const [trackData, setTrackData] = useState<trackDataPorps[]>([]);
  const [selectedContent, setSelectedContent] = useState<any>({});
  const [courseItem, setCourseItem] = useState<any>({});
  const [breadCrumbs, setBreadCrumbs] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [certificateId, setCertificateId] = useState();

  console.log("CourseUnitDetails - selectedContent:", selectedContent);
  console.log(
    "CourseUnitDetails - selectedContent.posterImage:",
    selectedContent?.posterImage
  );
  console.log(
    "CourseUnitDetails - selectedContent.appIcon:",
    selectedContent?.appIcon
  );
  console.log("CourseUnitDetails - courseItem:", courseItem);
  console.log(
    "CourseUnitDetails - courseItem.posterImage:",
    courseItem?.posterImage
  );
  let activeLink = null;
  if (typeof window !== "undefined") {
    const searchParams = new URLSearchParams(window.location.search);
    activeLink = searchParams.get("activeLink");
  }
  useEffect(() => {
    console.log(
      "CourseUnitDetails - useEffect triggered with identifier:",
      identifier
    );
    const getDetails = async (identifier: string) => {
      try {
        console.log(
          "CourseUnitDetails - Calling hierarchyAPI with identifier:",
          identifier
        );
        const resultHierarchyCourse = await hierarchyAPI(identifier);

        // Fallback: If no children but we have relational_metadata, create a basic structure
        if (
          !resultHierarchyCourse?.children ||
          resultHierarchyCourse.children.length === 0
        ) {
          // Check if we have relational_metadata with hierarchical structure
          if (resultHierarchyCourse?.relational_metadata) {
            try {
              const relationalData = JSON.parse(
                resultHierarchyCourse.relational_metadata
              );
              console.log(
                "CourseUnitDetails - Parsed relational_metadata:",
                relationalData
              );

              // Get the root course structure
              const courseId = resultHierarchyCourse.identifier;
              if (courseId && relationalData[courseId]) {
                const courseStructure = relationalData[courseId];

                if (
                  courseStructure &&
                  courseStructure.children &&
                  courseStructure.children.length > 0
                ) {
                  console.log(
                    "CourseUnitDetails - Found course structure in relational_metadata:",
                    courseStructure
                  );

                  // Create children structure from relational_metadata
                  resultHierarchyCourse.children = courseStructure.children
                    .map((childId: string) => {
                      const childStructure = relationalData[childId];
                      if (childStructure) {
                        return {
                          identifier: childId,
                          name: childStructure.name,
                          mimeType: "application/vnd.ekstep.content-collection",
                          contentType: "CourseUnit",
                          description: childStructure.name,
                          appIcon: resultHierarchyCourse.appIcon,
                          posterImage: resultHierarchyCourse.posterImage,
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
                                      grandChildStructure?.mimeType ||
                                      "application/vnd.ekstep.ecml-archive",
                                    contentType:
                                      grandChildStructure?.contentType ||
                                      "Resource",
                                    description:
                                      grandChildStructure?.name ||
                                      `Content ${grandChildId}`,
                                    appIcon: resultHierarchyCourse.appIcon,
                                    posterImage:
                                      resultHierarchyCourse.posterImage,
                                  };
                                }
                              )
                            : [],
                        };
                      }
                      return null;
                    })
                    .filter(Boolean); // Remove null entries
                }
              }
            } catch (error) {
              console.error(
                "CourseUnitDetails - Failed to parse relational_metadata:",
                error
              );
            }
          }
        }

        let resultHierarchy = resultHierarchyCourse;
        console.log(
          "CourseUnitDetails - Initial resultHierarchyCourse:",
          resultHierarchyCourse
        );
        console.log("CourseUnitDetails - unitId:", unitId);
        if (unitId) {
          resultHierarchy = getUnitFromHierarchy(
            resultHierarchy,
            unitId as string
          );
          console.log(
            "CourseUnitDetails - After getUnitFromHierarchy:",
            resultHierarchy
          );
        } else {
          console.log(
            "CourseUnitDetails - No unitId, using resultHierarchyCourse directly"
          );
        }
        if (props?.showBreadCrumbs) {
          const breadcrum = findCourseUnitPath({
            contentBaseUrl: props?._config?.contentBaseUrl,
            node: resultHierarchyCourse,
            targetId: (unitId as string) || (courseId as string),
            keyArray: [
              "name",
              "identifier",
              "mimeType",
              {
                key: "link",
                suffix: activeLink ? `?activeLink=${activeLink}` : "",
              },
            ],
          });
          setBreadCrumbs([
            ...(props?.showBreadCrumbs?.prefix || []),
            ...(breadcrum || []),
            ...(props?.showBreadCrumbs?.suffix || []),
          ]);
        }
        if (unitId && !props?.isHideInfoCard) {
          setCourseItem(resultHierarchyCourse);
          const breadcrum = findCourseUnitPath({
            contentBaseUrl: props?._config?.contentBaseUrl,
            node: resultHierarchyCourse,
            targetId: (unitId as string) || (courseId as string),
            keyArray: [
              "name",
              "identifier",
              "mimeType",
              {
                key: "link",
                suffix: activeLink ? `?activeLink=${activeLink}` : "",
              },
            ],
          });
          setBreadCrumbs(breadcrum);
        }

        if (props?._config?.getContentData) {
          props?._config?.getContentData(resultHierarchy);
        }
        const userId = getUserId(props?._config?.userIdLocalstorageName);
        let startedOn = {};
        if (props?._config?.isEnrollmentRequired !== false) {
          if (checkAuth(Boolean(userId))) {
            const data = await getUserCertificateStatus({
              userId: userId as string,
              courseId: courseId as string,
            });
            if (
              ![
                "enrolled",
                "inprogress",
                "completed",
                "viewCertificate",
              ].includes(data?.result?.status)
            ) {
              router.replace(
                `${
                  props?._config?.contentBaseUrl ?? "/content"
                }-details/${courseId}${
                  activeLink ? `?activeLink=${activeLink}` : ""
                }`
              );
            } else {
              const userIdArray: string[] = Array.isArray(userId)
                ? (userId as string[]).filter(Boolean)
                : [userId as string].filter(Boolean);
              const course_track_data = await trackingData(userIdArray, [
                courseId as string,
              ]);
              console.log("course_track", course_track_data);
              const userTrackData =
                course_track_data.data.find(
                  (course: any) => course.userId === userId
                )?.course || [];
              console.log("userTrackData", userTrackData);
              console.log("resultHierarchy", resultHierarchy);
              const newTrackData = calculateTrackData(
                userTrackData?.[0] ?? {},
                resultHierarchy?.children ?? []
              );
              console.log("newTrackData", newTrackData);
              console.log("data?.result?.status", data?.result?.status);
              setTrackData(newTrackData ?? []);
              if (data?.result?.status === "viewCertificate") {
                if (props?._config?.userIdLocalstorageName !== "did") {
                  setCertificateId(data?.result?.certificateId);
                }
              } else if (course_track_data?.data && !unitId) {
                const course_track = calculateTrackDataItem(
                  userTrackData?.[0] ?? {},
                  resultHierarchy ?? {}
                );
                console.log("course_track", course_track);
                // Only issue certificate if ALL courses are completed (status === "completed")
                // Previously checked course_track?.completed === 1 which incorrectly issued
                // certificates when only 1 course was completed out of many
                if (
                  course_track?.status === "completed" &&
                  ["enrolled", "completed"].includes(data?.result?.status) &&
                  props?._config?.userIdLocalstorageName !== "did"
                ) {
                  try {
                    const userResponse: any = await getUserIdLocal();
                    const resultCertificate = await issueCertificate({
                      userId: userId,
                      courseId: courseId,
                      unitId: unitId,
                      issuanceDate: new Date().toISOString(),
                      expirationDate: new Date(
                        new Date().setFullYear(new Date().getFullYear() + 20)
                      ).toISOString(),
                      credentialId: data?.result?.usercertificateId,
                      firstName: userResponse?.firstName ?? "",
                      middleName: userResponse?.middleName ?? "",
                      lastName: userResponse?.lastName ?? "",
                      courseName: resultHierarchy?.name ?? "",
                    });
                    setCertificateId(
                      resultCertificate?.result?.credentialSchemaId
                    );
                  } catch (certError) {
                    console.warn(
                      "Certificate issuance failed, but continuing with content loading:",
                      certError
                    );
                    // Don't let certificate errors break the main content flow
                  }
                }
              }
            }
            startedOn = {
              startedOn: data?.result?.createdOn,
              issuedOn: data?.result?.issuedOn,
            };
          }
        }
        console.log(
          "CourseUnitDetails - Final resultHierarchy:",
          resultHierarchy
        );
        console.log(
          "CourseUnitDetails - Children count:",
          resultHierarchy?.children?.length || 0
        );
        console.log(
          "CourseUnitDetails - resultHierarchy.children:",
          resultHierarchy?.children
        );

        // Validate that we have valid content before setting it
        if (resultHierarchy && resultHierarchy.identifier) {
          const finalContent = { ...resultHierarchy, ...startedOn };
          console.log(
            "CourseUnitDetails - Setting selectedContent to:",
            finalContent
          );
          setSelectedContent(finalContent);
        } else {
          console.error(
            "CourseUnitDetails - Invalid hierarchy data received:",
            resultHierarchy
          );
          // Set a fallback content structure to prevent empty object issues
          setSelectedContent({
            identifier: courseId,
            name: "Course Content",
            children: [],
            mimeType: "application/vnd.ekstep.content-collection",
          });
        }
      } catch (error) {
        console.error("Failed to fetch content:", error);
      } finally {
        setLoading(false);
      }
    };
    console.log(
      "CourseUnitDetails - About to call getDetails with identifier:",
      identifier
    );
    if (identifier) {
      console.log("CourseUnitDetails - Calling getDetails");
      getDetails(identifier as string);
    } else {
      console.log("CourseUnitDetails - No identifier, not calling getDetails");
    }
  }, [
    identifier,
    courseId,
    router,
    unitId,
    props?._config,
    activeLink,
    props?.isHideInfoCard,
  ]);

  const handleItemClick = (subItem: any) => {
    if (props?._config?.handleCardClick) {
      props?._config.handleCardClick?.(subItem);
    } else {
      localStorage.setItem("unitId", subItem?.courseId);
      const path =
        subItem.mimeType === "application/vnd.ekstep.content-collection"
          ? `${props?._config?.contentBaseUrl ?? "/content"}/${courseId}/${
              subItem?.identifier
            }`
          : `${
              props?._config?.contentBaseUrl ?? "/content"
            }/${courseId}/${unitId}/${subItem?.identifier}`;
      router.push(`${path}${activeLink ? `?activeLink=${activeLink}` : ""}`);
    }
  };

  const onBackClick = () => {
    if (breadCrumbs?.length > 1) {
      if (breadCrumbs?.[breadCrumbs.length - 2]?.link) {
        router.push(breadCrumbs?.[breadCrumbs.length - 2]?.link);
      }
    } else {
      router.push(
        `${
          activeLink
            ? activeLink
            : `${props?._config?.contentBaseUrl ?? ""}/content`
        }`
      );
    }
  };

  return (
    <LayoutPage
      isShow={props?.isShowLayout}
      isLoadingChildren={loading}
      _topAppBar={{
        title: "Shiksha: Course Details",
        actionButtonLabel: "Action",
      }}
      onlyHideElements={["footer"]}
    >
      {!props?.isHideInfoCard && (
        <InfoCard
          item={selectedContent}
          topic={courseItem?.se_subjects ?? selectedContent?.se_subjects}
          onBackClick={onBackClick}
          _config={{
            ...props?._config,
            _infoCard: {
              breadCrumbs: breadCrumbs,
              isShowStatus:
                props?._config?.isEnrollmentRequired !== false
                  ? trackData
                  : false,
              isHideStatus: true,
              default_img: `${AppConst.BASEPATH}/assests/images/image_ver.png`,
              ...props?._config?._infoCard,
            },
          }}
        />
      )}
      {props?.showBreadCrumbs && (
        <BreadCrumb
          breadCrumbs={breadCrumbs}
          isShowLastLink
          customPlayerStyle={true}
          customPlayerMarginTop={25}
        />
      )}
      <Box
        sx={{
          pt: { xs: 4, md: 5 },
          pb: { xs: 4, md: 10 },
          px: { xs: 2, sm: 3, md: 10 },
          gap: 2,
          ...props?._box,
        }}
      >
        {certificateId && !unitId && (
          <CourseCompletionBanner certificateId={certificateId} />
        )}
        {props?.type === "collapse" ? (
          selectedContent?.children?.length > 0 && (
            <CollapsebleGrid
              data={selectedContent.children}
              trackData={trackData}
            />
          )
        ) : (
          <>
            {console.log(
              "CourseUnitDetails - Rendering UnitGrid with selectedContent:",
              selectedContent
            )}
            {console.log(
              "CourseUnitDetails - selectedContent.children:",
              selectedContent?.children
            )}
            {console.log(
              "CourseUnitDetails - selectedContent.children.length:",
              selectedContent?.children?.length
            )}
            {loading ? (
              <Grid container spacing={{ xs: 1, sm: 1, md: 2 }}>
                <Grid item xs={12} textAlign="center">
                  <Typography
                    variant="body1"
                    sx={{ mt: 4, textAlign: "center" }}
                  >
                    Loading content...
                  </Typography>
                </Grid>
              </Grid>
            ) : (
              <UnitGrid
                handleItemClick={handleItemClick}
                item={selectedContent}
                skipContentId={
                  typeof contentId === "string" ? contentId : undefined
                }
                trackData={trackData}
                _config={props?._config}
              />
            )}
          </>
        )}
      </Box>
    </LayoutPage>
  );
}
