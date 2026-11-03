import { API_ENDPOINTS } from '@/utils/API/APIEndpoints';
import { get, post, patch } from './RestClient';
import { getServiceHeaders } from '@/utils/API/serviceHeaders';
import { getCourseList } from './CourseService';

export interface PathwayItem {
  id: string;
  key: string;
  name: string;
  description?: string;
  display_order?: number;
  is_active: boolean;
  tags?: Array<{ id: string; name: string }>;
  total_items?: number;
  video_count?: number;
  resource_count?: number;
  created_at?: string;
  [key: string]: any;
}

export interface PathwayListPayload {
  isActive?: boolean;
  limit?: number;
  offset?: number;
  filters?: Record<string, any>;
}

/** The pathway endpoints answer with `result`; the list is under `pathways`, `items` or the result itself */
const readPathwayList = (res: any): { pathways: PathwayItem[]; count: number } => {
  const result = res?.result ?? res;
  const list: any[] = Array.isArray(result)
    ? result
    : result?.pathways || result?.items || result?.data || result?.rows ||
      (Object.values(result || {}).find(Array.isArray) as any[] | undefined) || [];
  const count = Number(result?.totalCount ?? result?.count ?? result?.total ?? list.length) || list.length;
  return { pathways: list, count };
};

export const getPathwayList = async (
  payload: PathwayListPayload = {}
): Promise<{ pathways: PathwayItem[]; count: number }> => {
  try {
    const body = { isActive: true, limit: 50, offset: 0, filters: {}, ...payload };
    const response = await post(API_ENDPOINTS.pathwayList, body, getServiceHeaders());
    return readPathwayList(response?.data);
  } catch (error) {
    console.error('Error in PathwayService.getPathwayList:', error);
    throw error;
  }
};

export const getPathwayById = async (id: string): Promise<PathwayItem | null> => {
  try {
    const response = await get(API_ENDPOINTS.pathwayById(id), getServiceHeaders());
    const result = response?.data?.result;
    return result?.pathway ?? result ?? null;
  } catch (error) {
    console.error(`Error in PathwayService.getPathwayById for ${id}:`, error);
    throw error;
  }
};

export const createPathway = async (payload: Partial<PathwayItem>): Promise<any> => {
  try {
    const response = await post(API_ENDPOINTS.pathwayCreate, payload, getServiceHeaders());
    return response?.data;
  } catch (error) {
    console.error('Error in PathwayService.createPathway:', error);
    throw error;
  }
};

export const updatePathway = async (id: string, payload: Partial<PathwayItem>): Promise<any> => {
  try {
    const response = await patch(API_ENDPOINTS.pathwayUpdate(id), payload, getServiceHeaders());
    return response?.data;
  } catch (error) {
    console.error(`Error in PathwayService.updatePathway for ${id}:`, error);
    throw error;
  }
};

/**
 * POST /user/v1/pathway/order/structure. `id` is a pathway id (not a course id). The service rejects (409) any
 * order number held by a pathway that is not in the payload, so send every pathway whose position changes,
 * normally the full list in its new order.
 */
export const updatePathwayOrderStructure = async (
  orders: Array<{ id: string; order: number }>
): Promise<any> => {
  try {
    const response = await post(API_ENDPOINTS.pathwayOrderStructure, { orders }, getServiceHeaders());
    return response?.data;
  } catch (error) {
    console.error('Error in PathwayService.updatePathwayOrderStructure:', error);
    throw error;
  }
};

export const assignPathwayToUser = async (
  userId: string,
  pathwayId: string,
  userGoal = ''
): Promise<any> => {
  try {
    const adminId = (typeof window !== 'undefined' ? localStorage.getItem('userId') : null) || undefined;
    const response = await post(
      API_ENDPOINTS.pathwayAssign,
      { userId, pathwayId, userGoal, created_by: adminId, updated_by: adminId },
      getServiceHeaders()
    );
    return response?.data;
  } catch (error) {
    console.error('Error in PathwayService.assignPathwayToUser:', error);
    throw error;
  }
};

/** Enrol one learner in courses: POST /lms-service/v1/enrollments { learnerId, courseId: [ids] } */
export const enrolLearnerInCourses = async (learnerId: string, courseIds: string[]): Promise<any> => {
  try {
    const response = await post(
      API_ENDPOINTS.lmsEnrollmentCreate,
      { learnerId, courseId: courseIds },
      getServiceHeaders()
    );
    return response?.data;
  } catch (error) {
    console.error('Error in PathwayService.enrolLearnerInCourses:', error);
    throw error;
  }
};

/** Ids of the courses linked to a path through params.pathwayId (see setCoursePathway) */
export const getPathwayCourseIds = async (pathwayId: string): Promise<string[]> => {
  const { content } = await getCourseList({ limit: 100 });
  return content.filter((course) => course.params?.pathwayId === pathwayId).map((course) => course.identifier);
};

/**
 * Puts a course in a learning path (or takes it out with `null`) through the course's `params.pathwayId`:
 * PATCH /lms-service/v1/courses/:courseId (no userId query). The service replaces `params` as a whole, so the course is read first
 * and its other params are sent back with pathwayId added or removed.
 */
export const setCoursePathway = async (courseId: string, pathwayId: string | null): Promise<void> => {
  try {
    const headers = getServiceHeaders();
    const courseUrl = `${API_ENDPOINTS.lmsCourses}/${courseId}`;
    const current = await get(courseUrl, headers);
    const { pathwayId: currentPathwayId, ...otherParams } = current?.data?.result?.params || {};
    if ((currentPathwayId || null) === pathwayId) return;

    await patch(courseUrl, { params: pathwayId ? { ...otherParams, pathwayId } : otherParams }, headers);
  } catch (error) {
    console.error(`Error in PathwayService.setCoursePathway for ${courseId}:`, error);
    throw error;
  }
};

/** Id of a pathway returned by create/update */
export const pathwayIdFromResponse = (res: any): string =>
  res?.result?.id || res?.result?.pathway?.id || res?.result?.pathwayId || res?.id || '';
