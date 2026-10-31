import { API_ENDPOINTS } from '@/utils/API/APIEndpoints';
import { get, post, patch } from './RestClient';
import { getServiceHeaders } from '@/utils/API/serviceHeaders';

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

/** Enrol a cohort (group) in a course: POST /enrollments */
export const enrolCohortInCourse = async (cohortId: string, courseId: string): Promise<any> => {
  try {
    const response = await post(API_ENDPOINTS.lmsEnrollmentCreate, { cohortId, courseId }, getServiceHeaders());
    return response?.data;
  } catch (error) {
    console.error('Error in PathwayService.enrolCohortInCourse:', error);
    throw error;
  }
};

/** Course ids of a pathway's steps, when the pathway response lists them */
export const pathwayCourseIds = (pathway: PathwayItem | null): string[] => {
  const steps: any[] = pathway?.items || pathway?.courses || pathway?.steps || [];
  return steps.map((step) => step?.courseId || step?.course_id || step?.id).filter(Boolean);
};
