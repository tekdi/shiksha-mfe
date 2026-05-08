import { API_ENDPOINTS } from "./EndUrls";
import { post, get, put } from "./RestClient";

/**
 * Service for Swadhaar specific API calls and data processing.
 */

export const fetchSwadhaarLevelCourses = async (): Promise<any[]> => {
  const apiUrl = API_ENDPOINTS.compositeSearch;
  const body = {
    request: {
      filters: {
        status: ["Live", "live"],
        primaryCategory: ["Course"],
        channel: "swadhaar-channel",
      },
      query: "",
      limit: 20,
      offset: 0,
    },
  };

  try {
    const response = await post(apiUrl, body);
    const content = response?.data?.result?.content || [];

    // Preserve backend/API order as primary sort strategy.
    // Each item gets its original API position as a fallback index.
    const contentWithApiOrder = content.map((item: any, apiIdx: number) => ({
      ...item,
      _apiOrder: apiIdx,
    }));
    const sortedContent = [...content].sort((a: any, b: any) => {
      // 1st priority: explicit sequence fields from API
      const seqA = a.se_Sequence ?? a.index;
      const seqB = b.se_Sequence ?? b.index;
      if (seqA != null && seqB != null) return seqA - seqB;
      if (seqA != null) return -1;
      if (seqB != null) return 1;
      
      // 2nd priority: createdOn ascending (older first, newer below)
      const dateA = new Date(a.createdOn || 0).getTime();
      const dateB = new Date(b.createdOn || 0).getTime();
      return dateA - dateB;
    });

    // Fetch hierarchy for each course to get children/modules
    const levelPromises = sortedContent.map(async (course: any) => {
      try {
        const hierarchy = await getCourseHierarchy(course.identifier);
        return {
          ...course,
          children: hierarchy?.children || [],
        };
      } catch (err) {
        console.warn(`Failed to fetch hierarchy for ${course.identifier}`, err);
        return { ...course, children: [] };
      }
    });

    const results = await Promise.all(levelPromises);
    const finalResults = results.filter(Boolean);
    console.log('[SwadhaarService] fetchSwadhaarLevelCourses results:', finalResults.map(r => r.name));
    return finalResults;
  } catch (error) {
    console.error("Error fetching Swadhaar level courses:", error);
    throw error;
  }
};

export const getCourseHierarchy = async (courseId: string): Promise<any> => {
  const apiUrl = API_ENDPOINTS.courseHierarchy(courseId);
  try {
    const response = await get(apiUrl);
    return response?.data?.result?.content;
  } catch (error) {
    console.error(`Error fetching hierarchy for course ${courseId}:`, error);
    throw error;
  }
};

export const getQuestions = async (ids: string[]): Promise<any[]> => {
  const apiUrl = API_ENDPOINTS.questionList;
  
  // Attempt batch fetch first
  const batchBody = {
    request: {
      search: {
        identifier: ids,
      },
    },
  };

  try {
    const response = await post(apiUrl, batchBody);
    if (response?.data?.params?.status === 'successful') {
      return response?.data?.result?.questions || [];
    }
    throw new Error(response?.data?.params?.errmsg || 'Batch fetch failed');
  } catch (error) {
    console.warn("Batch question fetch failed, falling back to individual requests:", error);
    
    // Fallback: Fetch one-by-one to isolate invalid identifiers
    const fetchOne = async (id: string) => {
      const body = { request: { search: { identifier: [id] } } };
      try {
        const resp = await post(apiUrl, body);
        return resp?.data?.result?.questions?.[0] || null;
      } catch (err) {
        console.warn(`Failed to fetch question ${id}:`, err);
        return null;
      }
    };

    const results = await Promise.all(ids.map(fetchOne));
    return results.filter(Boolean);
  }
};

export const getUserCourseStatus = async (
  userId: string,
  courseId: string,
  academicYearId: string,
  tenantId: string
): Promise<any> => {
  const apiUrl = API_ENDPOINTS.userCertStatusGet;
  const headers = {
    academicyearid: academicYearId,
    tenantid: tenantId,
  };
  const body = { userId, courseId };

  try {
    const response = await post(apiUrl, body, headers);
    return response?.data?.data;
  } catch (error) {
    console.error(`Error fetching course status for user ${userId}:`, error);
    throw error;
  }
};

export const createCourseEnrollment = async (
  userId: string,
  courseId: string,
  academicYearId: string,
  tenantId: string
): Promise<any> => {
  const apiUrl = API_ENDPOINTS.userCertStatusCreate;
  const headers = {
    academicyearid: academicYearId,
    tenantid: tenantId,
  };
  const body = { userId, courseId };

  try {
    const response = await post(apiUrl, body, headers);
    return response?.data;
  } catch (error) {
    console.error(`Error enrolling user ${userId} in course ${courseId}:`, error);
    throw error;
  }
};

/**
 * Tracks a click on a course, module, or subtopic by creating/updating status.
 * Retrieves required IDs from localStorage.
 */
export const trackCourseClick = async (courseId: string): Promise<any> => {
  if (typeof window === "undefined") return;

  const userId = localStorage.getItem("userId");
  const academicYearId = localStorage.getItem("academicYearId");
  const tenantId = localStorage.getItem("tenantId");

  if (!userId || !academicYearId || !tenantId) {
    console.warn("Required IDs missing for status tracking:", { userId, academicYearId, tenantId });
    return;
  }

  try {
    return await createCourseEnrollment(userId, courseId, academicYearId, tenantId);
  } catch (error) {
    console.error(`Status tracking failed for course ${courseId}:`, error);
  }
};

export const getContentCourseStatus = async (
  userIds: string[],
  courseIds: string[],
  tenantId: string
): Promise<any[]> => {
  const apiUrl = API_ENDPOINTS.contentCourseStatus;
  const academicYearId = localStorage.getItem("academicYearId");
  const headers = {
    tenantid: tenantId,
    ...(academicYearId ? { academicyearid: academicYearId } : {}),
  };
  const body = { userId: userIds, courseId: courseIds };

  try {
    const response = await post(apiUrl, body, headers);
    const rawData = response?.data?.data || response?.data?.result?.data || [];

    console.log('[getContentCourseStatus] raw response:', JSON.stringify(response?.data, null, 2));

    // Transform the response to a flat list of { contentId, status, completionPercentage }
    const transformedStatus: any[] = [];
    
    const processUserItem = (userItem: any) => {
      if (userItem.course && Array.isArray(userItem.course)) {
        userItem.course.forEach((courseItem: any) => {
          const cid = courseItem.courseId || courseItem.contentId;
          if (cid) {
            let statusVal = 0;
            if (courseItem.status === 'completed' || courseItem.status === 2) {
              statusVal = 2;
            } else if (courseItem.status === 'in-progress' || courseItem.in_progress > 0 || courseItem.completed > 0 || courseItem.status === 1) {
              statusVal = 1;
            }
            
            const existing = transformedStatus.find(s => s.contentId === cid);
            if (existing) {
              existing.status = Math.max(existing.status, statusVal);
              existing.completionPercentage = Math.max(existing.completionPercentage, courseItem.completionPercentage ?? (statusVal === 2 ? 100 : 10));
              existing.attempts = (existing.attempts || 0) + (courseItem.in_progress || 0) + (courseItem.completed || 0);
            } else {
              transformedStatus.push({ 
                contentId: cid, 
                status: statusVal, 
                completionPercentage: courseItem.completionPercentage ?? (statusVal === 2 ? 100 : 10),
                attempts: Math.max(1, (courseItem.in_progress || 0) + (courseItem.completed || 0))
              });
            }
          }

          if (courseItem.completed_list && Array.isArray(courseItem.completed_list)) {
            courseItem.completed_list.forEach((id: string) => {
              const existing = transformedStatus.find(s => s.contentId === id);
              if (existing) {
                existing.status = 2;
                existing.completionPercentage = 100;
              } else {
                transformedStatus.push({ contentId: id, status: 2, completionPercentage: 100, attempts: 1 });
              }
            });
          }
          if (courseItem.in_progress_list && Array.isArray(courseItem.in_progress_list)) {
            courseItem.in_progress_list.forEach((id: string | any) => {
              const targetId = typeof id === 'string' ? id : id.contentId;
              if (targetId) {
                const existing = transformedStatus.find(s => s.contentId === targetId);
                const status = typeof id === 'string' ? 1 : (id.status || 1);
                const percentage = typeof id === 'string' ? 50 : (id.completionPercentage || 50);
                
                if (existing) {
                  existing.status = Math.max(existing.status, status);
                  existing.completionPercentage = Math.max(existing.completionPercentage, percentage);
                } else {
                  transformedStatus.push({ 
                    contentId: targetId, 
                    status, 
                    completionPercentage: percentage,
                    attempts: 1
                  });
                }
              }
            });
          }
        });
      }
      // Recursively process nested data if present
      if (userItem.data && Array.isArray(userItem.data)) {
        userItem.data.forEach(processUserItem);
      }
    };

    rawData.forEach(processUserItem);

    console.log('[getContentCourseStatus] transformed:', transformedStatus);
    return transformedStatus;
  } catch (error) {
    console.error(`Error fetching subtopic status:`, error);
    throw error;
  }
};

export const compositeSearch = async (
  query: string,
  category: string = "Course"
): Promise<any> => {
  const apiUrl = API_ENDPOINTS.compositeSearch;
  const body = {
    request: {
      filters: {
        status: ["Live"],
        primaryCategory: [category],
      },
      query: query,
      limit: 10,
    },
  };

  try {
    const response = await post(apiUrl, body);
    return response?.data;
  } catch (error) {
    console.error("Error in compositeSearch:", error);
    throw error;
  }
};

export const updateContentStatus = async (params: {
  userId: string;
  courseId: string;
  contentId: string;
  status: number;
  completionPercentage: number;
  moduleId?: string;
  score?: number;
}): Promise<any> => {
  const primaryUrl = API_ENDPOINTS.contentCourseStatusUpdate;
  const academicYearId = localStorage.getItem("academicYearId") || "";
  const tenantId = localStorage.getItem("tenantId") || "";
  
  const headers = {
    academicyearid: academicYearId,
    tenantid: tenantId,
  };

  const statusString = params.status === 2 ? 'completed' : 'in-progress';
  
  // Simple completion update matching the working pattern
  const payload: any = {
    userId: params.userId,
    courseId: params.contentId, // Working tenant uses lesson ID as courseId here
    contentId: params.contentId,
    status: statusString,
  };

  if (params.score !== undefined) {
    payload.score = params.score;
  }

  try {
    console.log('[TRACKING UPDATE]', payload);
    const response = await post(primaryUrl, payload, headers);
    return response?.data;
  } catch (error: any) {
    const statusCode = error?.response?.status;
    if (statusCode === 404 || statusCode === 405) {
      try {
        // Try PUT or Create if Update is not found
        const createUrl = API_ENDPOINTS.userCertStatusCreate;
        await post(createUrl, { userId: params.userId, courseId: params.contentId }, headers);
        const putResp = await put(primaryUrl, payload, headers);
        return putResp?.data;
      } catch (e) {
        return null;
      }
    }
    throw error;
  }
};

export const syncContentProgressTelemetry = async (params: {
  userId: string;
  courseId: string;
  contentId: string;
  unitId?: string;
  percentage: number;
  status: string;
  mimeType?: string;
  contentType?: string;
  duration?: number;
}): Promise<any> => {
  const apiUrl = API_ENDPOINTS.contentCreate;
  const tenantId = localStorage.getItem("tenantId") || "";
  
  const headers = {
    tenantid: tenantId,
  };

  const progress = params.percentage / 100;
  
  const payload = {
    userId: params.userId,
    contentId: params.contentId,
    courseId: params.courseId,
    unitId: params.unitId || params.contentId,
    contentType: params.contentType || "YOUTUBE_X_VIDEO",
    contentMime: params.mimeType || "video/x-youtube",
    lastAccessOn: new Date().toISOString(),
    detailsObject: [
      {
        eid: "START",
        edata: { type: "content", mode: "play", pageid: "", duration: 0 },
        identifier: params.contentId,
        contentType: "v1"
      },
      {
        eid: "END",
        edata: {
          type: "content",
          mode: "play",
          pageid: "sunbird-player-Endpage",
          summary: [
            { progress: progress },
            { totallength: params.duration || 0 }
          ],
          duration: 0
        },
        identifier: params.contentId,
        contentType: "v1"
      }
    ]
  };

  try {
    console.log('[TELEMETRY SYNC]', payload);
    const response = await post(apiUrl, payload, headers);
    return response?.data;
  } catch (error) {
    console.error('Error syncing telemetry progress:', error);
    return null;
  }
};

export const updateUserProfile = async (
  userId: string,
  firstName: string,
  lastName?: string
): Promise<any> => {
  const apiUrl = `${API_ENDPOINTS.userUpdatePatch}/${userId}`;
  const body: any = { request: { userId, firstName } };
  if (lastName !== undefined) body.request.lastName = lastName;
  try {
    const response = await post(apiUrl, body);
    return response?.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

const SwadhaarService = {
  fetchSwadhaarLevelCourses,
  getCourseHierarchy,
  getQuestions,
  getUserCourseStatus,
  createCourseEnrollment,
  trackCourseClick,
  getContentCourseStatus,
  compositeSearch,
  updateContentStatus,
  updateUserProfile,
  syncContentProgressTelemetry,
};

export default SwadhaarService;
