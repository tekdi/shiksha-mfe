import { log } from "console";
import { ContentCreate } from "../utils/Interface";
import { URL_CONFIG } from "../utils/url.config";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

export const fetchContent = async (identifier: any) => {
  try {
    const API_URL = `${URL_CONFIG.API.CONTENT_READ}${identifier}`;
    const FIELDS = URL_CONFIG.PARAMS.CONTENT_GET;
    const LICENSE_DETAILS = URL_CONFIG.PARAMS.LICENSE_DETAILS;
    const MODE = "edit";
    const response = await axios.get(
      `${API_URL}?fields=${FIELDS}&mode=${MODE}&licenseDetails=${LICENSE_DETAILS}`
    );

    return response?.data?.result?.content;
  } catch (error) {
    console.error("Error fetching content:", error);
    throw error;
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
    const response = await axios.post(URL_CONFIG.API.COMPOSITE_SEARCH, options);

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
  try {
    const API_URL = `${URL_CONFIG.API.QUESTIONSET_READ}${identifier}`;
    const FIELDS = URL_CONFIG.PARAMS.HIERARCHY_FEILDS;
    const response = await axios.get(`${API_URL}?fields=${FIELDS}`);

    return response?.data?.result?.content || response?.data?.result;
  } catch (error) {
    console.error("Error fetching content:", error);
    throw error;
  }
};

export const createContentTracking = async (reqBody: ContentCreate) => {
  console.log("reqBody player service", reqBody);
  const apiUrl = `${process.env.NEXT_PUBLIC_MIDDLEWARE_URL}/tracking/content/create`;
  
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
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        tenantId: localStorage.getItem("tenantId")
      },
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
  scoreDetails,
  courseId,
  unitId,
  userId: propUserId,
  maxScore,
  seconds,
}: any) => {
  try {
    let userId = "";
    if (propUserId) {
      userId = propUserId;
    } else if (typeof window !== "undefined" && window.localStorage) {
      userId = localStorage.getItem("userId") ?? "";
    }
    const attemptId = uuidv4();
    let totalScore = 0;
    if (Array.isArray(scoreDetails)) {
      totalScore = scoreDetails.reduce((sectionTotal, section) => {
        const sectionScore = section.data.reduce(
          (itemTotal: any, item: any) => {
            return itemTotal + (item.score || 0);
          },
          0
        );
        return sectionTotal + sectionScore;
      }, 0);
    } else {
      console.error("Parsed scoreDetails is not an array");
      throw new Error("Invalid scoreDetails format");
    }
    const lastAttemptedOn = new Date().toISOString();
    if (userId !== undefined || userId !== "") {
      const data: any = {
        userId: userId,
        contentId: identifierWithoutImg,
        courseId: courseId && unitId ? courseId : identifierWithoutImg,
        unitId: courseId && unitId ? unitId : identifierWithoutImg,
        attemptId,
        lastAttemptedOn,
        timeSpent: seconds ?? 0,
        totalMaxScore: maxScore ?? 0,
        totalScore,
        assessmentSummary: scoreDetails,
      };
      const apiUrl = `${process.env.NEXT_PUBLIC_MIDDLEWARE_URL}/tracking/assessment/create`;

      const response = await axios.post(apiUrl, data);
      console.log("Assessment tracking created:", response.data);
      return response.data;
    }
  } catch (error) {
    console.error("Error in contentWithTelemetryData:", error);
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
  const apiUrl = `${process.env.NEXT_PUBLIC_MIDDLEWARE_URL}/tracking/content/course/status`;
  const data = {
    courseId: [course?.identifier],
    userId: [userId],
  };
  console.log("data 198", data);
  try {
    const response = await axios.post(apiUrl, data);
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
  const apiUrl = `${process.env.NEXT_PUBLIC_MIDDLEWARE_URL}/tracking/user_certificate/status/update`;

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
        headers: {
          tenantId: tenantId,
        },
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
  const apiUrl = `${process.env.NEXT_PUBLIC_MIDDLEWARE_URL}/tracking/certificate/issue`;
  try {
    const response = await axios.post(apiUrl, reqBody, {
      headers: {
        tenantId: localStorage.getItem("tenantId"),
      },
    });
    return response?.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getUserId = async (): Promise<any> => {
  const apiUrl = `${process.env.NEXT_PUBLIC_MIDDLEWARE_URL}/user/auth`;

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