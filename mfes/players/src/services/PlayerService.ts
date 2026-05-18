import { ContentCreate } from "../utils/Interface";
import { URL_CONFIG } from "../utils/url.config";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { offlineService } from "@shared-lib-v2/utils/OfflineService";

export const getHeaders = () => {
  const headers: any = {
    Accept: "application/json, text/plain, */*",
  };

  if (typeof window !== "undefined" && window.localStorage) {
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const tenantId =
      localStorage.getItem("domainTenantId") || localStorage.getItem("tenantId");
    if (tenantId) {
      headers["tenantid"] = tenantId;
    }

    const academicYearId = localStorage.getItem("academicYearId");
    if (academicYearId) {
      headers["academicyearid"] = academicYearId;
    }
  }

  return headers;
};

// Sanitized middleware URL to fix malformed domain issues
const getMiddlewareUrl = () => {
  let url = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || "https://interface.tekdinext.com/interface/v1";
  if (url.includes("https://interface/v1") && !url.includes("tekdinext.com")) {
    url = url.replace("https://interface/v1", "https://interface.tekdinext.com/interface/v1");
  }
  // Remove trailing slashes if any
  return url.replace(/\/$/, "");
};

// Global interceptor for all axios calls in this MFE
axios.interceptors.request.use(
  (config) => {
    // Sanitize the URL if it uses the malformed base
    if (config.url?.startsWith("https://interface/v1")) {
      config.url = config.url.replace("https://interface/v1", "https://interface.tekdinext.com/interface/v1");
    }

    const headers = getHeaders();
    Object.keys(headers).forEach((key) => {
      if (config.headers && !config.headers[key]) {
        config.headers[key] = headers[key];
      }
    });
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const fetchContent = async (identifier: any) => {
  if (!offlineService.isOnline()) {
    const stored = await offlineService.getStoredMetadata(identifier);
    if (stored) return stored.metadata;
    throw new Error("Content not available offline");
  }

  const FIELDS = URL_CONFIG.PARAMS.CONTENT_GET;
  const LICENSE_DETAILS = URL_CONFIG.PARAMS.LICENSE_DETAILS;
  const MODE = "edit";
  
  try {
    const API_URL = `${URL_CONFIG.API.CONTENT_READ}${identifier}`;
    const response = await axios.get(
      `${API_URL}?fields=${FIELDS}&mode=${MODE}&licenseDetails=${LICENSE_DETAILS}`
    );

    const content = response?.data?.result?.content || response?.data?.result?.questionset;
    // Auto-cache metadata if online (optional, or wait for explicit download)
    // await offlineService.downloadContentMetadata(identifier, content);
    
    return content;
  } catch (error) {
    console.warn(`Standard fetchContent failed for ${identifier}, trying QuestionSet Read API...`, error);
    try {
      // Fallback: Try QuestionSet Read API if Content Read fails
      const QUESTIONSET_API_URL = `${URL_CONFIG.API.QUESTIONSET_READ}${identifier}`;
      const response = await axios.get(
        `${QUESTIONSET_API_URL}?fields=${FIELDS}&mode=${MODE}&licenseDetails=${LICENSE_DETAILS}`
      );
      
      const content = response?.data?.result?.questionset || response?.data?.result?.content;
      return content;
    } catch (fallbackError) {
      console.error("Both Content and QuestionSet Read APIs failed:", fallbackError);
      throw fallbackError;
    }
  }
};

export const fetchBulkContents = async (identifiers: string[]) => {
  try {
    const options = {
      request: {
        filters: {
          identifier: identifiers,
        },
        fields: [
          "name",
          "appIcon",
          "medium",
          "subject",
          "resourceType",
          "contentType",
          "organisation",
          "topic",
          "mimeType",
          "trackable",
          "gradeLevel",
          "leafNodes",
        ],
      },
    };
    const response = await axios.post(URL_CONFIG.API.COMPOSITE_SEARCH, options, {
      headers: getHeaders(),
    });

    const result = response?.data?.result;
    if (response?.data?.result?.QuestionSet?.length) {
      const contents = result?.content
        ? [...result.content, ...result.QuestionSet]
        : [...result.QuestionSet];
      result.content = contents;
    }
    console.log("Bulk contents fetched:", result.content);
    return result.content;
  } catch (error) {
    console.error("Error fetching content:", error);
    throw error;
  }
};

export const getHierarchy = async (identifier: any) => {
  if (!offlineService.isOnline()) {
    const stored = await offlineService.getStoredMetadata(identifier);
    if (stored) return stored.hierarchy;
    throw new Error("Hierarchy not available offline");
  }

  try {
    const API_URL = `${URL_CONFIG.API.HIERARCHY_API}${identifier}`;
    const response = await axios.get(API_URL);

    return response?.data?.result?.content || response?.data?.result;
  } catch (error) {
    console.error("Error fetching content:", error);
    throw error;
  }
};

export const getQumlData = async (identifier: any) => {
  if (!offlineService.isOnline()) {
    const stored = await offlineService.getStoredMetadata(identifier);
    if (stored) return stored.hierarchy || stored.metadata;
    throw new Error("QUML data not available offline");
  }

  try {
    const API_URL = `${URL_CONFIG.API.HIERARCHY_API}${identifier}`;
    const response = await axios.get(API_URL);

    return response?.data?.result?.questionset || response?.data?.result?.content || response?.data?.result;
  } catch (error) {
    console.error("Error fetching QUML data via hierarchy API:", error);
    throw error;
  }
};
export const getQuestions = async (identifiers: string[]) => {
  try {
    const API_URL = URL_CONFIG.API.QUESTION_LIST;
    const response = await axios.post(
      API_URL,
      {
        request: {
          search: {
            identifier: identifiers,
          },
        },
      },
      {
        headers: getHeaders(),
      }
    );
    return response?.data?.result?.questions || [];
  } catch (error) {
    console.error("Error fetching questions list:", error);
    throw error;
  }
};

const getHeaders = () => {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  const tenantId = localStorage.getItem("tenantId");
  const academicYearId = localStorage.getItem("academicYearId");

  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenantId ? { tenantId, tenantid: tenantId } : {}),
    ...(academicYearId ? { academicyearid: academicYearId } : {}),
  };
};

export const createContentTracking = async (reqBody: ContentCreate) => {
  console.log("reqBody player service", reqBody);
  const apiUrl = `${getMiddlewareUrl()}/tracking/content/create`;
  
  if (!offlineService.isOnline()) {
    console.log("[PlayerService] Offline: Queuing content tracking...");
    await offlineService.queueTelemetry('interact', {
      edata: {
        id: 'content-tracking',
        type: 'track',
        subtype: 'offline-persistence',
        pageid: 'player-page',
      },
      context: {
        cdata: [{ id: reqBody.contentId, type: 'Content' }]
      },
      details: reqBody
    });
    return { status: 'queued' };
  }

  try {
    // Validate required fields
    const requiredFields = [
      "userId",
      "contentId",
      "courseId",
      "unitId",
      "contentType",
      "contentMime",
      "lastAccessOn",
      "detailsObject",
    ];
    const missingFields = requiredFields.filter(
      (field) => !reqBody[field as keyof ContentCreate]
    );

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    const response = await axios.post(apiUrl, reqBody, {
      headers: getHeaders(),
      timeout: 10000, // 10 second timeout
    });

    return response?.data;
  } catch (error: any) {
    console.error("🔍 Full Error:", error);
    throw error;
  }
};

export const createAssessmentTracking = async ({
  identifierWithoutImg,
  contentId: propContentId,
  scoreDetails,
  assessmentSummary,
  courseId,
  unitId,
  userId: propUserId,
  maxScore,
  seconds,
  attemptId: propAttemptId,
  ...rest
}: any) => {
  try {
    let userId = "";
    if (propUserId && propUserId !== "null" && propUserId !== "undefined") {
      userId = propUserId;
    } else if (typeof window !== "undefined" && window.localStorage) {
      userId = localStorage.getItem("userId") ?? "";
    }

    const contentId = propContentId || identifierWithoutImg || rest.identifier;
    const attemptId = propAttemptId || uuidv4();
    const finalScoreDetails = scoreDetails || assessmentSummary || rest.data;
    
    let totalScore = 0;
    let totalMaxScore = maxScore || 0;

    if (Array.isArray(finalScoreDetails)) {
      totalScore = finalScoreDetails.reduce((sectionTotal, section) => {
        const dataArray = Array.isArray(section.data) ? section.data : [];
        const sectionScore = dataArray.reduce(
          (itemTotal: any, item: any) => {
            return itemTotal + (Number(item.score) || 0);
          },
          0
        );
        return sectionTotal + sectionScore;
      }, 0);

      if (!totalMaxScore || totalMaxScore === 0) {
        totalMaxScore = finalScoreDetails.reduce((sectionTotal, section) => {
          const dataArray = Array.isArray(section.data) ? section.data : [];
          const sectionMax = dataArray.reduce((itemMax: any, item: any) => {
            return itemMax + (Number(item.item?.maxscore) || 0);
          }, 0);
          return sectionTotal + sectionMax;
        }, 0);
      }
    } else {
      console.warn("⚠️ createAssessmentTracking: finalScoreDetails is not an array, skipping score calculation", finalScoreDetails);
    }

    const lastAttemptedOn = new Date().toISOString();
    if (userId) {
      const data: any = {
        userId: userId,
        contentId: contentId,
        courseId: courseId && unitId ? courseId : contentId,
        unitId: courseId && unitId ? unitId : contentId,
        attemptId: attemptId || rest.mid,
        lastAttemptedOn,
        timeSpent: seconds ?? rest.timeSpent ?? 0,
        totalMaxScore: totalMaxScore,
        totalScore,
        assessmentSummary: Array.isArray(finalScoreDetails) ? finalScoreDetails : [],
      };
      console.log("📤 Sending Assessment Data:", data);
      const apiUrl = `${getMiddlewareUrl()}/tracking/assessment/create`;

      const response = await axios.post(apiUrl, data, {
        headers: getHeaders(),
      });
      console.log("Assessment tracking created:", response.data);
      return response.data;
    } else {
      console.error("❌ createAssessmentTracking: userId is missing, cannot call API");
    }
  } catch (error) {
    console.error("Error in createAssessmentTracking:", error);
  }
};

export const updateCOurseAndIssueCertificate = async ({
  course,
  userId,
  unitId,
  isGenerateCertificate,
}: {
  course: any;
  userId: string;
  unitId: any;
  isGenerateCertificate?: boolean;
}) => {
  const apiUrl = `${getMiddlewareUrl()}/tracking/content/course/status`;
  const data = {
    courseId: [course?.identifier],
    userId: [userId],
  };
  console.log("data 198", data);
  try {
    const response = await axios.post(apiUrl, data, {
      headers: getHeaders(),
    });
    console.log("Course status updated:", response.data);
    const courseStatus = calculateCourseStatus({
      statusData: response?.data?.data?.[0]?.course?.[0],
      allCourseIds: course?.leafNodes ?? [],
      courseId: course?.identifier,
    });

    if (courseStatus?.status === "in progress") {
      updateUserCourseStatus({
        userId,
        courseId: course?.identifier,
        status: "inprogress",
      });
    } else if (courseStatus?.status === "completed" && isGenerateCertificate) {
      const userResponse: any = await getUserId();
      await issueCertificate({
        userId: userId,
        courseId: course?.identifier,
        unitId: unitId,
        issuanceDate: new Date().toISOString(),
        expirationDate: new Date(
          new Date().setFullYear(new Date().getFullYear() + 20)
        ).toISOString(),
        // credentialId: data?.result?.usercertificateId,
        firstName: userResponse?.firstName ?? "",
        middleName: userResponse?.middleName ?? "",
        lastName: userResponse?.lastName ?? "",
        courseName: course?.name ?? "",
      });
    } else {
      updateUserCourseStatus({
        userId,
        courseId: course?.identifier,
        status: "completed",
      });
    }
  } catch (error) {
    console.error("Error in updateCOurseAndIssueCertificate:", error);
    throw error;
  }
};

export function calculateCourseStatus({
  statusData,
  allCourseIds,
  courseId,
}: {
  statusData: { completed_list: string[]; in_progress_list: string[] };
  allCourseIds: string[];
  courseId: string;
}) {
  const completedList = new Set(statusData.completed_list || []);
  const inProgressList = new Set(statusData.in_progress_list || []);

  let completedCount = 0;
  let inProgressCount = 0;
  const completed_list: string[] = [];
  const in_progress_list: string[] = [];

  for (const id of allCourseIds) {
    if (completedList.has(id)) {
      completedCount++;
      completed_list.push(id);
    } else if (inProgressList.has(id)) {
      inProgressCount++;
      in_progress_list.push(id);
    }
  }

  const total = allCourseIds.length;
  let status = "not started";

  if (completedCount === total && total > 0) {
    status = "completed";
  } else if (completedCount > 0 || inProgressCount > 0) {
    status = "in progress";
  }

  const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return {
    completed_list,
    in_progress_list,
    completed: completedCount,
    in_progress: inProgressCount,
    courseId,
    status,
    percentage: percentage,
  };
}

export const updateUserCourseStatus = async ({
  userId,
  courseId,
  status,
}: {
  userId: string;
  courseId: string;
  status: string;
}) => {
  const apiUrl = `${getMiddlewareUrl()}/tracking/user_certificate/status/update`;

  // Get tenantId safely
  const tenantId = localStorage.getItem("tenantId");

  if (!tenantId) {
    console.error("tenantId is missing from localStorage");
    throw new Error("Tenant ID is required");
  }

  console.log("apiUrl", apiUrl);
  console.log("Request payload:", { userId, courseId, status, tenantId });

  try {
    const response = await axios.post(
      apiUrl,
      {
        userId,
        courseId,
        status,
      },
      {
        headers: getHeaders(),
      }
    );
    return response?.data?.result;
  } catch (error) {
    console.error("Error in updating user course status:", error);

    // Enhanced error logging
    if (axios.isAxiosError(error)) {
      console.error("Response data:", error.response?.data);
      console.error("Response status:", error.response?.status);
      console.error("Response headers:", error.response?.headers);
    }

    throw error;
  }
};

export const issueCertificate = async (reqBody: any) => {
  const apiUrl = `${getMiddlewareUrl()}/tracking/certificate/issue`;
  try {
    const response = await axios.post(apiUrl, reqBody, {
      headers: getHeaders(),
    });
    return response?.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getUserId = async (): Promise<any> => {
  const apiUrl = `${getMiddlewareUrl()}/user/auth`;

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authorization token not found");
    }

    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response?.data?.result;
  } catch (error) {
    console.error("Error in fetching user details", error);
    throw error;
  }
};