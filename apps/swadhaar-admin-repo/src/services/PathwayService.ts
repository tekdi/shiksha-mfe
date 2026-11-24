import { API_ENDPOINTS } from '@/utils/API/APIEndpoints';
import { get, post, patch } from './RestClient';
import { getServiceHeaders } from '@/utils/API/serviceHeaders';
import { getCourseList } from './CourseService';
import { getCohortLearnerIds } from './CohortService';
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
 * A PATCH of a course's params must carry its current status back, otherwise the LMS can reset a published course
 * to unpublished and the admin has to publish it again.
 */
const statusOf = (current: any): { status?: string } => {
  const status = current?.data?.result?.status;
  return status ? { status } : {};
};

/** Groups and individual users already enrolled in a path (recorded on its courses' params) */
export const getPathwayEnrolled = async (pathwayId: string): Promise<{ groupIds: string[]; userIds: string[] }> => {
  const { content } = await getCourseList({ limit: 100 });
  const headers = getServiceHeaders();
  // The search results can lag behind a removal done from a group's page, so each course of the path is read again
  // and its saved params are used
  const params = await Promise.all(
    content
      .filter((course) => course.params?.pathwayId === pathwayId)
      .map(async (course) => {
        try {
          const current = await get(`${API_ENDPOINTS.lmsCourses}/${course.identifier}`, headers);
          return current?.data?.result?.params || course.params || {};
        } catch {
          return course.params || {};
        }
      })
  );
  const groupIds = new Set<string>();
  const userIds = new Set<string>();
  params.forEach((p: Record<string, any>) => {
    [p.cohortId, ...(p.enrolledCohortIds || [])].forEach((id) => id && groupIds.add(id));
    (p.enrolledUserIds || []).forEach((id: string) => userIds.add(id));
  });
  return { groupIds: Array.from(groupIds), userIds: Array.from(userIds) };
};

/**
 * Puts a course in a learning path (or takes it out with `null`) through the course's `params.pathwayId`:
 * PATCH /lms-service/v1/courses/:courseId (no userId query). The service replaces `params` as a whole, so the course is read first
 * and its other params are sent back with pathwayId added or removed. The path's selected certificate template is stored
 * alongside it as `params.certificateTemplateId` (and removed with the course).
 */
export const setCoursePathway = async (
  courseId: string,
  pathwayId: string | null,
  certificateTemplateId?: string
): Promise<void> => {
  try {
    const headers = getServiceHeaders();
    const courseUrl = `${API_ENDPOINTS.lmsCourses}/${courseId}`;
    const current = await get(courseUrl, headers);
    const { pathwayId: currentPathwayId, certificateTemplateId: currentTemplateId, ...otherParams } =
      current?.data?.result?.params || {};
    const nextTemplateId = pathwayId ? certificateTemplateId || undefined : undefined;
    if ((currentPathwayId || null) === pathwayId && (currentTemplateId || undefined) === nextTemplateId) return;

    const params: Record<string, any> = { ...otherParams };
    if (pathwayId) params.pathwayId = pathwayId;
    if (nextTemplateId) params.certificateTemplateId = nextTemplateId;
    await patch(courseUrl, { params, ...statusOf(current) }, headers);
  } catch (error) {
    console.error(`Error in PathwayService.setCoursePathway for ${courseId}:`, error);
    throw error;
  }
};

/**
 * Records the groups enrolled in a path as `params.enrolledCohortIds` on each of the path's courses (the backend has no
 * group link on a pathway). PATCH replaces `params` as a whole, so each course is read first and the ids are merged.
 */
export const addPathwayCohorts = async (courseIds: string[], cohortIds: string[]): Promise<void> => {
  const headers = getServiceHeaders();
  await Promise.all(
    courseIds.map(async (courseId) => {
      const courseUrl = `${API_ENDPOINTS.lmsCourses}/${courseId}`;
      const current = await get(courseUrl, headers);
      const params = current?.data?.result?.params || {};
      const merged = Array.from(new Set([...(params.enrolledCohortIds || []), ...cohortIds]));
      await patch(courseUrl, { params: { ...params, enrolledCohortIds: merged }, ...statusOf(current) }, headers);
    })
  );
};

/**
 * Records the individual users assigned to a path as `params.enrolledUserIds` on each of the path's courses, the way
 * addPathwayCohorts records groups, so the builder and the list can show them again (pathway/assign has no read API).
 */
export const addPathwayUsers = async (courseIds: string[], userIds: string[]): Promise<void> => {
  const headers = getServiceHeaders();
  await Promise.all(
    courseIds.map(async (courseId) => {
      const courseUrl = `${API_ENDPOINTS.lmsCourses}/${courseId}`;
      const current = await get(courseUrl, headers);
      const params = current?.data?.result?.params || {};
      const merged = Array.from(new Set([...(params.enrolledUserIds || []), ...userIds]));
      await patch(courseUrl, { params: { ...params, enrolledUserIds: merged }, ...statusOf(current) }, headers);
    })
  );
};

/**
 * Links a group to the courses of a learning path: PATCH /lms-service/v1/courses/:courseId with params.cohortId
 * (a course holds one cohortId, so it moves from any group it was linked to). The service takes `params` as a whole,
 * so each course is read first and its other params are sent back. The group is also added to
 * `params.enrolledCohortIds`, which the learning path list reads.
 */
export const assignCohortToCourses = async (courseIds: string[], cohortId: string): Promise<void> => {
  const headers = getServiceHeaders();
  await Promise.all(
    courseIds.map(async (courseId) => {
      const courseUrl = `${API_ENDPOINTS.lmsCourses}/${courseId}`;
      const current = await get(courseUrl, headers);
      const params = current?.data?.result?.params || {};
      const enrolled = Array.from(new Set([...(params.enrolledCohortIds || []), cohortId]));
      await patch(courseUrl, { params: { ...params, cohortId, enrolledCohortIds: enrolled }, ...statusOf(current) }, headers);
    })
  );
};

/**
 * Enrols one learner in every active course of the group:
 * POST /lms-service/v1/enrollments/cohort?userId=<admin> { learnerId, cohortId }
 */
export const enrolLearnerInCohortCourses = async (learnerId: string, cohortId: string): Promise<any> => {
  const adminId = (typeof window !== 'undefined' ? localStorage.getItem('userId') : null) || '';
  const response = await post(API_ENDPOINTS.lmsEnrollCohort(adminId), { learnerId, cohortId }, getServiceHeaders());
  return response?.data;
};

/** Learning paths linked to a group: the paths of the courses whose params.cohortId (or enrolledCohortIds) holds this group */
export const getCohortLearningPaths = async (cohortId: string): Promise<Array<{ id: string; name: string }>> => {
  // The courses are filtered here (not by the search's cohortId filter) so a course also counts when the group is
  // only in its enrolledCohortIds
  const { content: all } = await getCourseList({ limit: 100 });
  const content = all.filter(
    (c) => c.params?.cohortId === cohortId || (c.params?.enrolledCohortIds || []).includes(cohortId)
  );
  const pathIds = Array.from(new Set(content.map((c) => c.params?.pathwayId).filter(Boolean) as string[]));
  const { pathways } = await getPathwayList({ limit: 100 }).catch(() => ({ pathways: [] as PathwayItem[] }));
  const withoutPath = content.filter((c) => !c.params?.pathwayId).map((c) => ({ id: c.identifier, name: c.title }));
  return [
    ...pathIds.map((id) => ({ id, name: pathways.find((p) => p.id === id)?.name || 'Learning path' })),
    ...withoutPath,
  ];
};

/**
 * The learning path a course belongs to (through params.pathwayId): its name and the course's step in it.
 * The step is the course's place among the path's courses in their LMS order.
 */
export const getCoursePathway = async (
  courseId: string
): Promise<{ id: string; name: string; step: number; total: number } | null> => {
  const { content } = await getCourseList({ limit: 100 });
  const course = content.find((c) => c.identifier === courseId);
  const pathwayId = course?.params?.pathwayId;
  if (!pathwayId) return null;
  const inPath = content.filter((c) => c.params?.pathwayId === pathwayId);
  const pathway = await getPathwayById(pathwayId).catch(() => null);
  return {
    id: pathwayId,
    name: pathway?.name || 'Learning path',
    step: inPath.findIndex((c) => c.identifier === courseId) + 1,
    total: inPath.length,
  };
};


/**
 * Withdraws learners from courses: POST /lms-service/v1/enrollments/withdraw { learnerIds, courseIds }. The LMS archives
 * the enrollments, so the courses leave the learner's list; progress is kept and comes back if they are enrolled again.
 */
export const withdrawLearnersFromCourses = async (learnerIds: string[], courseIds: string[]): Promise<number> => {
  if (learnerIds.length === 0 || courseIds.length === 0) return 0;
  const response = await post(API_ENDPOINTS.lmsEnrollmentWithdraw, { learnerIds, courseIds }, getServiceHeaders());
  const result = response?.data?.result ?? response?.data;
  return Number(result?.withdrawnCount) || 0;
};

interface PathCourse {
  identifier: string;
  params?: Record<string, any>;
}

/** The courses behind an entry of a group's Learning Paths card: a path's courses, or a single course not in a path */
const coursesForPathOrCourse = async (id: string): Promise<PathCourse[]> => {
  const { content } = await getCourseList({ limit: 100 });
  const inPath = content.filter((c) => c.params?.pathwayId === id);
  return inPath.length ? inPath : content.filter((c) => c.identifier === id);
};

/** Rewrites one course's params (read first, since PATCH replaces params as a whole) */
const patchCourseParams = async (courseId: string, change: (params: Record<string, any>) => Record<string, any>) => {
  const headers = getServiceHeaders();
  const courseUrl = `${API_ENDPOINTS.lmsCourses}/${courseId}`;
  const current = await get(courseUrl, headers);
  const params = current?.data?.result?.params || {};
  await patch(courseUrl, { params: change({ ...params }), ...statusOf(current) }, headers);
};

/**
 * Learners who still get the courses another way once `removed` is taken off: assigned to them individually, or as
 * a learner of another group still enrolled in the courses. They are not withdrawn.
 */
const learnersStillCovered = async (
  courses: PathCourse[],
  removed: { cohortId?: string; userId?: string }
): Promise<Set<string>> => {
  const userIds = new Set<string>();
  const groupIds = new Set<string>();
  courses.forEach((c) => {
    (c.params?.enrolledUserIds || []).forEach((id: string) => id !== removed.userId && userIds.add(id));
    [c.params?.cohortId, ...(c.params?.enrolledCohortIds || [])].forEach(
      (id: string | undefined) => id && id !== removed.cohortId && groupIds.add(id)
    );
  });
  const groupLearners = await Promise.all(
    Array.from(groupIds).map((id) => getCohortLearnerIds(id).catch(() => [] as string[]))
  );
  groupLearners.flat().forEach((id) => userIds.add(id));
  return userIds;
};

/**
 * Takes a learning path (or a single course) away from a group: the group is removed from the courses' params
 * (cohortId and enrolledCohortIds, so new members are no longer enrolled), then the group's learners are withdrawn
 * from the courses, except those who still have them individually or through another group.
 * Returns how many learners were withdrawn.
 */
export const removePathFromCohort = async (pathOrCourseId: string, cohortId: string): Promise<number> => {
  const courses = await coursesForPathOrCourse(pathOrCourseId);
  if (courses.length === 0) return 0;
  await Promise.all(
    courses.map((c) =>
      patchCourseParams(c.identifier, (params) => {
        const { cohortId: linked, ...rest } = params;
        const next: Record<string, any> = {
          ...rest,
          enrolledCohortIds: (params.enrolledCohortIds || []).filter((id: string) => id !== cohortId),
        };
        if (linked && linked !== cohortId) next.cohortId = linked;
        return next;
      })
    )
  );
  const [learners, covered] = await Promise.all([
    getCohortLearnerIds(cohortId),
    learnersStillCovered(courses, { cohortId }),
  ]);
  const toWithdraw = learners.filter((id) => !covered.has(id));
  await withdrawLearnersFromCourses(toWithdraw, courses.map((c) => c.identifier));
  return toWithdraw.length;
};

/**
 * Takes a learning path away from one individually assigned user: the user is removed from the courses'
 * params.enrolledUserIds and withdrawn from the courses, unless a group they belong to still has the path.
 * Returns false when the user keeps the courses through a group.
 */
export const removePathFromUser = async (pathwayId: string, userId: string): Promise<boolean> => {
  const { content } = await getCourseList({ limit: 100 });
  const courses = content.filter((c) => c.params?.pathwayId === pathwayId);
  if (courses.length === 0) return true;
  await Promise.all(
    courses
      .filter((c) => (c.params?.enrolledUserIds || []).includes(userId))
      .map((c) =>
        patchCourseParams(c.identifier, (params) => ({
          ...params,
          enrolledUserIds: (params.enrolledUserIds || []).filter((id: string) => id !== userId),
        }))
      )
  );
  const covered = await learnersStillCovered(courses, { userId });
  if (covered.has(userId)) return false;
  await withdrawLearnersFromCourses([userId], courses.map((c) => c.identifier));
  return true;
};


/** Id of a pathway returned by create/update */
export const pathwayIdFromResponse = (res: any): string =>
  res?.result?.id || res?.result?.pathway?.id || res?.result?.pathwayId || res?.id || '';
