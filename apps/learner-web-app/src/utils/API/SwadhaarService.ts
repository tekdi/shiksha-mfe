import { API_ENDPOINTS } from "./EndUrls";
import { post, get, put } from "./RestClient";
import { filterCoursesByLanguage, extractCourseLanguages } from "@learner/utils/courseLanguageUtils";

/**
 * Service for Swadhaar specific API calls and data processing.
 */

/**
 * Queries Composite Search API for all live courses in the channel,
 * and extracts all unique contentLanguage values configured across those courses.
 */
export const fetchAvailableCourseLanguagesFromSearch = async (): Promise<string[]> => {
  const apiUrl = API_ENDPOINTS.compositeSearch;
  const body = {
    request: {
      filters: {
        status: ["Live", "live"],
        primaryCategory: ["Course"],
        channel: "swadhaar-channel",
      },
      query: "",
      limit: 100,
      offset: 0,
    },
  };

  try {
    const response = await post(apiUrl, body);
    const content = response?.data?.result?.content || [];

    const uniqueLanguages = new Set<string>();

    content.forEach((course: any) => {
      const extracted = extractCourseLanguages(course);
      extracted.forEach((lang) => {
        if (lang) uniqueLanguages.add(lang);
      });
    });

    const result = Array.from(uniqueLanguages);
    return result.length > 0 ? result : ['English'];
  } catch (error) {
    console.error('Error fetching course languages from search API:', error);
    return ['English'];
  }
};

export const fetchSwadhaarLevelCourses = async (languageOverride?: string): Promise<any[]> => {
  const apiUrl = API_ENDPOINTS.compositeSearch;

  let language = languageOverride;
  if (!language && typeof window !== 'undefined') {
    language = localStorage.getItem('swadhaarLanguage') || localStorage.getItem('contentLanguage') || undefined;
  }

  if (language) {
    const norm = String(language).trim().toLowerCase();
    if (['marathi', 'mr'].includes(norm)) language = 'Marathi';
    else if (['hindi', 'hi'].includes(norm)) language = 'Hindi';
    else if (['english', 'en'].includes(norm)) language = 'English';
  }

  const filters: Record<string, any> = {
    status: ["Live", "live"],
    primaryCategory: ["Course"],
    channel: "swadhaar-channel",
  };

  // For non-English languages, filter directly at Search API level.
  // For English, do not pass filters.contentLanguage so legacy courses (without contentLanguage) are fetched too.
  if (language && language !== 'English') {
    filters.contentLanguage = [language];
  }

  const body = {
    request: {
      filters,
      query: "",
      limit: 20,
      offset: 0,
    },
  };

  try {
    const response = await post(apiUrl, body);
    let content = response?.data?.result?.content || [];

    // Filter courses based on selected language rules (English includes missing contentLanguage courses)
    content = filterCoursesByLanguage(content, language);

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

  // Deduplicate and filter out empty/falsy IDs
  const uniqueIds = [...new Set(ids.filter(id => id && typeof id === 'string' && id.trim().length > 0))];
  if (uniqueIds.length === 0) return [];

  // Attempt batch fetch first (max 25 per batch to avoid 400 errors from large payloads)
  const BATCH_SIZE = 25;
  const allQuestions: any[] = [];

  for (let i = 0; i < uniqueIds.length; i += BATCH_SIZE) {
    const batchIds = uniqueIds.slice(i, i + BATCH_SIZE);
    const batchBody = {
      request: {
        search: {
          identifier: batchIds,
        },
      },
    };

    try {
      const response = await post(apiUrl, batchBody);
      if (response?.data?.params?.status === 'successful') {
        const questions = response?.data?.result?.questions || [];
        allQuestions.push(...questions);
        continue;
      }
      throw new Error(response?.data?.params?.errmsg || 'Batch fetch failed');
    } catch (error) {
      console.warn(`Batch question fetch failed for batch starting at ${i}, falling back to individual requests`);
      
      // Fallback: Fetch one-by-one to isolate invalid identifiers
      const fetchOne = async (id: string) => {
        const body = { request: { search: { identifier: [id] } } };
        try {
          const resp = await post(apiUrl, body);
          return resp?.data?.result?.questions?.[0] || null;
        } catch (err) {
          // Silently skip invalid question IDs (e.g. section IDs)
          return null;
        }
      };

      const results = await Promise.all(batchIds.map(fetchOne));
      allQuestions.push(...results.filter(Boolean));
    }
  }

  return allQuestions;
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
export const trackCourseClick = async (courseId: string, contentId?: string): Promise<any> => {
  if (typeof window === "undefined") return;

  const userId = localStorage.getItem("userId");
  const academicYearId = localStorage.getItem("academicYearId");
  const tenantId = localStorage.getItem("tenantId");

  if (!userId || !academicYearId || !tenantId) {
    console.warn("Required IDs missing for status tracking:", { userId, academicYearId, tenantId });
    return;
  }

  try {
    const res = await createCourseEnrollment(userId, courseId, academicYearId, tenantId);
    // If a contentId is provided, also track that specific content
    if (contentId) {
      await createCourseEnrollment(userId, contentId, academicYearId, tenantId);
      await updateContentStatus({
        userId,
        courseId: courseId,
        contentId: contentId,
        status: 1,
        completionPercentage: 0,
      }).catch(e => console.warn('Secondary status update failed:', e));
    }
    return res;
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
  const academicYearId = localStorage.getItem("academicYearId") || "";
  const headers = {
    tenantid: tenantId,
    academicyearid: academicYearId,
  };
  const body = { userId: userIds, courseId: courseIds };

  try {
    const response = await post(apiUrl, body, headers);
    const rawData = response?.data?.data || response?.data?.result?.data || [];

    // Raw response logging removed to reduce console noise

    // Transform the response to a flat list of { contentId, status, completionPercentage }
    const transformedStatus: any[] = [];

    const processUserItem = (userItem: any) => {
      if (userItem.course && Array.isArray(userItem.course)) {
          userItem.course.forEach((courseItem: any) => {
            const cid = courseItem.contentId || courseItem.courseId;
            if (cid) {
              let statusVal = 0;
              const statusRaw = String(courseItem.status || '').toLowerCase();
              if (
                statusRaw === 'completed' || 
                courseItem.status === 2 || 
                courseItem.completed === true ||
                (typeof courseItem.completed === 'number' && courseItem.completed > 0 && !courseItem.children)
              ) {
                statusVal = 2;
              } else if (
                statusRaw === 'in-progress' || 
                courseItem.in_progress > 0 || 
                courseItem.status === 1 ||
                courseItem.completed > 0
              ) {
                statusVal = 1;
              }
            
            // Extract attempts count - Prioritize dedicated fields from backend
            let attemptsCount = 1;
            if (courseItem.attempts !== undefined && courseItem.attempts !== null) {
              attemptsCount = Number(courseItem.attempts);
            } else if (courseItem.totalAttempts !== undefined && courseItem.totalAttempts !== null) {
              attemptsCount = Number(courseItem.totalAttempts);
            } else if (courseItem.attemptCount !== undefined && courseItem.attemptCount !== null) {
              attemptsCount = Number(courseItem.attemptCount);
            } else {
              // Fallback calculation: Sum of in-progress and completed items
              attemptsCount = (courseItem.in_progress || 0) + (courseItem.completed || 0);
            }

            const existing = transformedStatus.find(s => s.contentId === cid);
            const defaultProgress = statusVal === 2 ? 100 : 0;
            
            // CLEANUP: Many backend responses default in-progress to 10%
            // We want to force it to 0% for quizzes or until significant video progress is made.
            let cleanPercentage = courseItem.completionPercentage ?? defaultProgress;
            if (statusVal === 1 && cleanPercentage === 10) {
              cleanPercentage = 0;
            }

            if (existing) {
              existing.status = Math.max(existing.status, statusVal);
              // Force 100% if completed, otherwise use clean percentage
              const finalPerc = statusVal === 2 ? 100 : cleanPercentage;
              existing.completionPercentage = Math.max(existing.completionPercentage, finalPerc);
              existing.attempts = Math.max(existing.attempts || 0, attemptsCount);
            } else {
              transformedStatus.push({ 
                contentId: cid, 
                status: statusVal, 
                completionPercentage: statusVal === 2 ? 100 : cleanPercentage,
                attempts: attemptsCount
              });
            }
          }

          if (courseItem.completed_list && Array.isArray(courseItem.completed_list)) {
            const parentId = courseItem.contentId || courseItem.courseId;
            courseItem.completed_list.forEach((id: string) => {
              // Skip self-referential entries (parent marking itself as completed)
              if (id === parentId) return;

              // NOTE: The Swadhaar backend records lesson completion ONLY in the parent
              // course aggregate's completed_list. Per-lesson dedicated rows always show
              // completed:0 because they are not the authoritative source. We trust the
              // parent's completed_list directly — only skip self-referential entries.

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
                const statusVal = typeof id === 'string' ? 1 : (id.status || 1);
                // CLEANUP: Remove hardcoded 50% fallback for in-progress items
                const percentage = typeof id === 'string' ? 0 : (id.completionPercentage || 0);
                
                if (existing) {
                  existing.status = Math.max(existing.status, statusVal);
                  existing.completionPercentage = Math.max(existing.completionPercentage, percentage);
                } else {
                  transformedStatus.push({ 
                    contentId: targetId, 
                    status: statusVal, 
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

    // Transformed status logging removed to reduce console noise
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
  attempts?: number;
}): Promise<any> => {
  const primaryUrl = API_ENDPOINTS.contentCourseStatusUpdate;
  const academicYearId = localStorage.getItem("academicYearId") || "";
  const tenantId = localStorage.getItem("tenantId") || "";
  
  const headers = {
    academicyearid: academicYearId,
    tenantid: tenantId,
  };

  const statusString = params.status === 2 ? 'completed' : 'in-progress';
  
  const payload: any = {
    userId: params.userId,
    courseId: params.courseId, 
    contentId: params.contentId,
    unitId: params.moduleId || params.contentId,
    status: statusString,
    completionPercentage: params.completionPercentage,
  };

  if (params.score !== undefined) {
    payload.score = params.score;
  }

  if (params.attempts !== undefined) {
    payload.attempts = params.attempts;
  }

  try {
    const response = await post(primaryUrl, payload, headers);
    const respData = response?.data;
    
    // Some backends return 200 OK but with status: "failed" in the body
    if (respData?.params?.status === 'failed') {
      console.warn('[TRACKING UPDATE] Backend reported failure:', respData?.params?.errmsg);
      throw new Error(respData?.params?.errmsg || 'Update failed');
    }
    
    return respData;
  } catch (error: any) {
    const statusCode = error?.response?.status;
    const errorBody = error?.response?.data;
    
    // If update fails, try to create enrollment/status first
    if (statusCode === 404 || statusCode === 405 || statusCode === 400 || (error.message && error.message.includes('already enrolled'))) {
      try {
        const createUrl = API_ENDPOINTS.userCertStatusCreate;
        const createPayload = { 
          userId: params.userId, 
          courseId: params.courseId || params.contentId 
        };
        const createResp = await post(createUrl, createPayload, headers);
        
        // After create (or if it failed with "already enrolled"), try update again with PUT
        const putResp = await put(primaryUrl, payload, headers);
        return putResp?.data;
      } catch (e) {
        console.error('[TRACKING UPDATE] Fallback chain failed:', e);
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
