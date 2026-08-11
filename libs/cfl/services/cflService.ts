import { post, get } from '@shared-lib';
import { Trainer, CourseProgress, AlertFeedback } from '../types';
import axios from 'axios';
import { getContentCourseStatus } from '@learner/utils/API/SwadhaarService';

// Direct backend URL - used with @shared-lib post() which injects auth headers via interceptor
const BACKEND_URL = process.env.NEXT_PUBLIC_INTERFACE_URL || 'https://interface.tekdinext.com/interface/v1';
// Middleware/proxy URL - used for standard app API calls
const BASE_URL = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'https://interface.tekdinext.com/interface/v1';

export const getTrainerList = async (tenantId: string): Promise<Trainer[]> => {
  const apiUrl = `${BASE_URL}/user/list`;
  const payload = {
    limit: 50,
    offset: 0,
    filters: {
      role: 'Learner',
      tenantId: tenantId,
    },
  };

  try {
    const response = await post(apiUrl, payload);
    const users = response?.data?.result?.userData || [];
    
    // Mapping to our Trainer interface
    // In a real scenario, we'd also fetch progress stats for each trainer
    const trainers = users.map((u: any) => ({
      id: u.userId,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username,
      avatarUrl: u.avatar,
      currentLevel: u.currentLevel || 'Beginner Level',
      location: `CFL: ${u.state || 'Jharkhand'} - ${u.district || 'Torpa'}`,
      progress: Math.floor(Math.random() * 101),
      courses: [
        { id: '1', name: 'Beginner Level', status: 'completed', completionCount: 4, totalCount: 4 },
        { id: '2', name: 'Intermediate Level', status: 'in-progress', completionCount: 1, totalCount: 4 },
        { id: '3', name: 'Advance Level', status: 'locked', completionCount: 0, totalCount: 4 },
      ]
    }));

    if (trainers.length === 0) {
      return [
        { id: '1', name: 'Jaya K', currentLevel: 'Advance Level', location: 'CFL: Jharkhand - Torpa', progress: 100, courses: [{ id: '1', name: 'Beginner Level', status: 'completed', completionCount: 4, totalCount: 4 }, { id: '2', name: 'Intermediate Level', status: 'in-progress', completionCount: 1, totalCount: 4 }, { id: '3', name: 'Advance Level', status: 'locked', completionCount: 0, totalCount: 4 }] },
        { id: '2', name: 'Pappu', currentLevel: 'Intermediate Level', location: 'CFL: Jharkhand - Torpa', progress: 100, courses: [{ id: '1', name: 'Beginner Level', status: 'completed', completionCount: 4, totalCount: 4 }, { id: '2', name: 'Intermediate Level', status: 'in-progress', completionCount: 1, totalCount: 4 }, { id: '3', name: 'Advance Level', status: 'locked', completionCount: 0, totalCount: 4 }] },
        { id: '3', name: 'Seema', currentLevel: 'Intermediate Level', location: 'CFL: Jharkhand - Torpa', progress: 75, courses: [{ id: '1', name: 'Beginner Level', status: 'completed', completionCount: 4, totalCount: 4 }, { id: '2', name: 'Intermediate Level', status: 'in-progress', completionCount: 1, totalCount: 4 }, { id: '3', name: 'Advance Level', status: 'locked', completionCount: 0, totalCount: 4 }] },
        { id: '4', name: 'Sagar', currentLevel: 'Beginner Level', location: 'CFL: Jharkhand - Torpa', progress: 0, courses: [{ id: '1', name: 'Beginner Level', status: 'completed', completionCount: 4, totalCount: 4 }, { id: '2', name: 'Intermediate Level', status: 'in-progress', completionCount: 1, totalCount: 4 }, { id: '3', name: 'Advance Level', status: 'locked', completionCount: 0, totalCount: 4 }] },
      ];
    }
    return trainers;
  } catch (error) {
    console.error('Error fetching trainer list:', error);
    return [
      { id: '1', name: 'Jaya K', currentLevel: 'Advance Level', location: 'CFL: Jharkhand - Torpa', progress: 100, courses: [{ id: '1', name: 'Beginner Level', status: 'completed', completionCount: 4, totalCount: 4 }, { id: '2', name: 'Intermediate Level', status: 'in-progress', completionCount: 1, totalCount: 4 }, { id: '3', name: 'Advance Level', status: 'locked', completionCount: 0, totalCount: 4 }] },
      { id: '2', name: 'Pappu', currentLevel: 'Intermediate Level', location: 'CFL: Jharkhand - Torpa', progress: 100, courses: [{ id: '1', name: 'Beginner Level', status: 'completed', completionCount: 4, totalCount: 4 }, { id: '2', name: 'Intermediate Level', status: 'in-progress', completionCount: 1, totalCount: 4 }, { id: '3', name: 'Advance Level', status: 'locked', completionCount: 0, totalCount: 4 }] },
      { id: '3', name: 'Seema', currentLevel: 'Intermediate Level', location: 'CFL: Jharkhand - Torpa', progress: 75, courses: [{ id: '1', name: 'Beginner Level', status: 'completed', completionCount: 4, totalCount: 4 }, { id: '2', name: 'Intermediate Level', status: 'in-progress', completionCount: 1, totalCount: 4 }, { id: '3', name: 'Advance Level', status: 'locked', completionCount: 0, totalCount: 4 }] },
      { id: '4', name: 'Sagar', currentLevel: 'Beginner Level', location: 'CFL: Jharkhand - Torpa', progress: 0, courses: [{ id: '1', name: 'Beginner Level', status: 'completed', completionCount: 4, totalCount: 4 }, { id: '2', name: 'Intermediate Level', status: 'in-progress', completionCount: 1, totalCount: 4 }, { id: '3', name: 'Advance Level', status: 'locked', completionCount: 0, totalCount: 4 }] },
    ];
  }
};

export const cfllearnerlist = async (
  overrideCohortId?: string,
  overrideTenantId?: string,
  overrideToken?: string,
  overrideAcademicYearId?: string,
  excludeManagement: boolean = false
) => {
  const apiUrl = `${BACKEND_URL}/cohortmember/list`;
  
  let storageUserId = '';
  let storageAcademicYearId = '';
  let storageTenantId = '';
  let token = '';
  let storageCohortId = '';
  let storageUserRole = '';

  if (typeof window !== 'undefined' && window.localStorage) {
    storageUserId = localStorage.getItem('userId') || '';
    storageAcademicYearId = localStorage.getItem('academicYearId') || '';
    storageTenantId = localStorage.getItem('tenantId') || '';
    token = localStorage.getItem('token') || '';
    storageCohortId = localStorage.getItem('cohortId') || '';
    storageUserRole = localStorage.getItem('userRole') || '';
  }

  let actualCohortId = overrideCohortId;

  const finalAcademicYearId = overrideAcademicYearId || storageAcademicYearId || 'edf1d200-21d8-417e-b844-1d04f92435f4';
  const finalTenantId = overrideTenantId || storageTenantId || '8cf74da8-392d-4d02-8ac3-ae2204e34c0a';
  const finalToken = overrideToken || token;

  if (!actualCohortId && storageUserId) {
    try {
      const searchHeaders: Record<string, string> = {
        'tenantid': finalTenantId,
        'accept': 'application/json, text/plain, */*',
        'authorization': finalToken ? `Bearer ${finalToken}` : ''
      };
      // const searchResp = await get(`${BASE_URL}/cohort/mycohorts/${storageUserId}?customField=true&children=true`, searchHeaders);
const searchResp = await get(`${BASE_URL}/cohort/mycohorts/${storageUserId}?customField=true&children=true`, searchHeaders);
      const data = searchResp?.data?.data || searchResp?.data || searchResp;
      const userCohorts = data?.result || [];
      if (userCohorts.length > 0) {
        // Try to find the actual CFL cohort (usually type COHORT, not SCHOOL)
        let cflCohort = userCohorts.find((c: any) => c.type !== 'SCHOOL');
        if (!cflCohort) {
          for (const c of userCohorts) {
            if (c.childData && c.childData.length > 0) {
              const childCfl = c.childData.find((child: any) => child.type !== 'SCHOOL');
              if (childCfl) {
                cflCohort = childCfl;
                break;
              }
            }
          }
        }
        cflCohort = cflCohort || userCohorts[0];
        actualCohortId = cflCohort.cohortId || cflCohort.id;
      }
    } catch (err) {
      console.warn('Failed to dynamically resolve CFL cohort ID', err);
    }
  }

  const finalCohortId = actualCohortId || storageCohortId || "19388f9f-5aca-4bcd-8576-b3254d0ae942";

  const payload: any = {
    limit: 0,
    offset: 0,
    filters: {
      cohortId: finalCohortId,
      status: ['active'],
    }
  };

  // if (finalAcademicYearId) {
  //   payload.academicYearId = finalAcademicYearId;
  // }

  const headers: Record<string, string> = {
    'academicyearid': finalAcademicYearId,
    'tenantid': finalTenantId,
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-GB,en;q=0.9'
  };

  if (finalToken) {
    headers['authorization'] = `Bearer ${finalToken}`;
  } else {
    headers['authorization'] = `Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJxSEJLb1JaSkRVOHUweEROYk95dUF2S3Roelo0TXo2c0l6OHRiSXRWWVBnIn0.eyJleHAiOjE3ODAzNzkzOTcsImlhdCI6MTc4MDI5Mjk5NywianRpIjoiNzM1MjI3Y2MtMGVhMC00M2ZjLWI4Y2ItMDRjODFjNTlmYTdlIiwiaXNzIjoiaHR0cHM6Ly9hZG1pbi5zdW5iaXJkc2Fhcy5jb20vYXV0aC9yZWFsbXMvc2hpa3NoYSIsImF1ZCI6ImFjY291bnQiLCJzdWIiOiJiN2NjMWY3Ny05MGNhLTRmMzMtOTMzYS03NjQ3YjFiMzk1YWMiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzaGlrc2hhIiwic2Vzc2lvbl9zdGF0ZSI6IjdhYzUxMGU2LWU1MjItNDE2NS05NzNlLWQ0ZjA5ZTEyYzNkMCIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiaHR0cHM6Ly9kZXYuc25haWxuZXR3b3JrLm9yZyIsImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMyIsImh0dHBzOi8vd3d3LnNuYWlsbmV0d29yay5vcmciLCIqIiwiaHR0cHM6Ly9hZG1pbi5zdW5iaXJkc2Fhcy5jb20iLCJodHRwOi8vbG9jYWxob3N0OjQxMjAiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iLCJkZWZhdWx0LXJvbGVzLXByYXRoYW0iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6ImVtYWlsIHByb2ZpbGUgcHJhdGhhbS1yb2xlIiwic2lkIjoiN2FjNTEwZTYtZTUyMi00MTY1LTk3M2UtZDRmMDllMTJjM2QwIiwidGVuYW50X2lkIjoiMGQ3M2JjZjktYWI2Mi00NGVmLTk0NWUtODhiMWE3N2FiM2MzIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJvcmdfaWQiOiI4Y2Y3NGRhOC0zOTJkLTRkMDItOGFjMy1hZTIyMDRlMzRjMGEiLCJuYW1lIjoiYWRtaW5fb2JsZiBhZG1pbl9vYmxmIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiYWRtaW5fb2JsZiIsImdpdmVuX25hbWUiOiJhZG1pbl9vYmxmIiwiZmFtaWx5X25hbWUiOiJhZG1pbl9vYmxmIiwidXNlcl9yb2xlc190ZXN0IjpbeyJ0aXRsZSI6IkxlYXJuZXIifV19.U9qTOc2k0bHSjob9OS5XsZgIiu1JFswa-ddlHQKv1LGCHf38rMqHkXFyT0ehy-_TCVwfvk6cDIUa4VldAJittTXgrsnvIGudggNZp9VB62hIK6aOVgwUsvxdrGK_Ip73tFDWGXn0LZbmFQQF9pqZchcT4i9m3LHgbuhQAf5BZqAM2z21xgWcaez1LdN6HxtfiIZ-eBW2Vj5oZ8YksQBzK3BlzV5T7x8jPcROBQAT4xHUVlb1MSzJp_xXgcp8I7cnumefhraXEwzxaCRS1HN6-HHLxIwS9JlUtjYPHO_g-aUu6CzHVY7dNyOgr61t4w-QHG7K9gi8eHaEzKmRqu7lJQ`;
  }

  try {
    const response = await post(apiUrl, payload, headers);
    const data = response?.data?.data || response?.data;
    let userDetails = data?.result?.userDetails || [];

    if (excludeManagement) {
      userDetails = userDetails.filter((u: any) => {
        const isSelf = u.userId === storageUserId;
        const roleStr = String(u.role || '').toLowerCase();
        const isManagement = roleStr === 'arm' || roleStr === 'district incharge' || roleStr === 'cfl' || roleStr === 'cfl incharge' || roleStr === 'di';
        return !isSelf && !isManagement;
      });
    }

    const searchUrl = `${BASE_URL}/action/composite/v3/search`;
    let liveCourses: any[] = [];
    try {
      const searchPayload = {
        request: {
          filters: {
            primaryCategory: ['Course'],
            status: ['live'],
            channel: "swadhaar-channel"
          },
          limit: 10,
          offset: 0,
        }
      };
      const searchResponse = await axios.post(searchUrl, searchPayload, { headers });
      liveCourses = searchResponse?.data?.result?.content || [];
      // Sort exactly as learner's fetchSwadhaarLevelCourses does:
      // 1st priority: se_Sequence / index, 2nd: createdOn ascending
      liveCourses.sort((a: any, b: any) => {
        const seqA = a.se_Sequence ?? a.index;
        const seqB = b.se_Sequence ?? b.index;
        if (seqA != null && seqB != null) return seqA - seqB;
        if (seqA != null) return -1;
        if (seqB != null) return 1;
        const dateA = new Date(a.createdOn || 0).getTime();
        const dateB = new Date(b.createdOn || 0).getTime();
        return dateA - dateB;
      });
    } catch (e) {
      console.warn("Search API fetch failed", e);
    }

    const trainerIds = userDetails.map((u: any) => u.userId);
    const courseIds = liveCourses.map((c: any) => c.identifier);

    // ── Step 1: Fetch full hierarchy for each course ONCE (shared across all trainers) ──
    // This is the same approach as fetchSwadhaarLevelCourses + swadhaar-home's loadData:
    // we need the full tree of modules → subtopics → lessons to compute accurate progress.
    const courseHierarchies: any[] = [];
    const allHierarchyIds: string[] = [];

    for (const course of liveCourses) {
      try {
        const hierarchyUrl = `${BASE_URL}/action/content/v3/hierarchy/${course.identifier}`;
        const hierarchyResp = await axios.get(hierarchyUrl, { headers: { tenantId: finalTenantId } });
        const courseData = hierarchyResp.data?.result?.content;
        if (courseData) {
          courseHierarchies.push(courseData);
          // Collect ALL IDs in the hierarchy (course + modules + subtopics + lessons)
          const collectIds = (node: any) => {
            allHierarchyIds.push(node.identifier);
            (node.children || []).forEach((child: any) => collectIds(child));
          };
          collectIds(courseData);
        } else {
          courseHierarchies.push({ ...course, children: [] });
          allHierarchyIds.push(course.identifier);
        }
      } catch (e) {
        console.warn(`[CFL] Hierarchy fetch failed for ${course.identifier}`, e);
        courseHierarchies.push({ ...course, children: [] });
        allHierarchyIds.push(course.identifier);
      }
    }

    // ── Step 2: Fetch leaf-level status for each trainer ──
    // Uses getContentCourseStatus with ALL hierarchy IDs (not just course-level IDs).
    // This returns per-lesson completion, which we then aggregate from leaf nodes up
    // using calculateNodeLessons — identical to the learner home page.
    const perUserStatusMap: Record<string, any[]> = {};
    if (trainerIds.length > 0 && allHierarchyIds.length > 0) {
      await Promise.all(
        trainerIds.map(async (uid: string) => {
          try {
            // Batch fetch (100 IDs per call) — same as learner home
            let status: any[] = [];
            const batchSize = 100;
            for (let i = 0; i < allHierarchyIds.length; i += batchSize) {
              const batch = allHierarchyIds.slice(i, i + batchSize);
              const batchStatus = await getContentCourseStatus([uid], batch, finalTenantId).catch(() => []);
              status = [...status, ...batchStatus];
            }
            perUserStatusMap[uid] = status;
          } catch (e) {
            console.warn(`[CFL] getContentCourseStatus failed for ${uid}`, e);
            perUserStatusMap[uid] = [];
          }
        })
      );
    }

    // ── Helper: recursive lesson-based completion (same as swadhaar-home) ──
    const calcNodeLessons = (node: any, statusList: any[]): { total: number; completed: number } => {
      const id = node.identifier || node.id;
      if (!node.children || node.children.length === 0) {
        const s = statusList.find((d: any) => d.contentId === id);
        const perc = s?.completionPercentage ?? (s?.status === 2 ? 100 : 0);
        return { total: 1, completed: perc / 100 };
      }
      let total = 0;
      let completed = 0;
      node.children.forEach((child: any) => {
        const res = calcNodeLessons(child, statusList);
        total += res.total;
        completed += res.completed;
      });
      return { total, completed };
    };

    const trainers = userDetails.map((user: any) => {
      const stateField = user.customField?.find((field: any) => field.label === 'STATE' || field.fieldId === 'state')?.value || 'Jharkhand';
      const districtField = user.customField?.find((field: any) => field.label === 'DISTRICT' || field.fieldId === 'district')?.value || 'Torpa';

      const userStatusList = perUserStatusMap[user.userId] || [];

      // ── Step 3: Compute per-course completion from leaf lessons (same as learner) ──
      const courses = courseHierarchies.map((courseHierarchy: any, idx: number) => {
        const { total, completed } = calcNodeLessons(courseHierarchy, userStatusList);
        const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

        let status = 'locked';
        if (completionPct >= 70) {
          status = 'completed';
        } else if (completionPct > 0) {
          status = 'in-progress';
        } else {
          // Check if any lesson has been started at all
          const courseItem = userStatusList.find((s: any) => s.contentId === courseHierarchy.identifier);
          if (courseItem && (courseItem.status >= 1 || courseItem.completionPercentage > 0)) {
            status = 'in-progress';
          }
        }

        return {
          id: courseHierarchy.identifier,
          name: courseHierarchy.name || liveCourses[idx]?.name,
          status,
          completionPercentage: completionPct,
          completionCount: status === 'completed' ? 4 : (status === 'in-progress' ? Math.max(1, Math.round((completionPct / 100) * 4)) : 0),
          totalCount: 4
        };
      });

      // Calculate overall progress as the average completionPercentage across all courses
      const totalPct = courses.reduce((sum, c) => sum + (c.completionPercentage || 0), 0);
      const progressPercent = courses.length > 0 ? Math.floor(totalPct / courses.length) : 0;

      console.log(`[CFL] User ${user.firstName} — courses:`, courses.map(c => `${c.name}: ${c.status} (${c.completionPercentage}%)`), '→ overall:', progressPercent + '%');

      const actualCourses = courses.length > 0 ? courses : [
        { id: '1', name: 'Beginner Level', status: 'completed', completionPercentage: 100, completionCount: 4, totalCount: 4 },
        { id: '2', name: 'Intermediate Level', status: 'in-progress', completionPercentage: 25, completionCount: 1, totalCount: 4 },
      ];

      const inProgressCourse = actualCourses.find((c: any) => c.status === 'in-progress') 
                            || actualCourses.find((c: any) => c.status === 'locked') 
                            || actualCourses[actualCourses.length - 1];

      const currentCourseName = inProgressCourse?.name || user.currentLevel || 'Beginner Level';

      return {
        id: user.userId,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        avatarUrl: user.avatar || user.profileImage || null,
        currentLevel: currentCourseName,
        location: `CFL: ${stateField} - ${districtField}`,
        progress: progressPercent,
        designation: user.role && (String(user.role).toLowerCase() === 'district incharge' || String(user.role).toLowerCase() === 'cfl' || String(user.role).toLowerCase() === 'cfl incharge' || String(user.role).toLowerCase() === 'di') ? 'District Incharge' : 'Trainer/CFL Incharge',
        courses: actualCourses
      };
    });

    // Ensure District Incharge is always at the top of the list
    trainers.sort((a: any, b: any) => {
      if (a.designation === 'District Incharge' && b.designation !== 'District Incharge') return -1;
      if (a.designation !== 'District Incharge' && b.designation === 'District Incharge') return 1;
      return 0;
    });

    // ── Step 4: Batch-fetch real profile images from getUserDetails ──
    // Profile photo URL is stored in userData.name (set by uploadProfilePhoto flow).
    // We run these in parallel and patch avatarUrl on each trainer.
    try {
      const profileUrl = `${BASE_URL}/user/read`;
      await Promise.all(
        trainers.map(async (trainer: any) => {
          try {
            const profileResp = await axios.get(
              `${profileUrl}/${trainer.id}?fieldvalue=true`,
              {
                headers: {
                  'authorization': finalToken ? `Bearer ${finalToken}` : undefined,
                  'tenantid': finalTenantId,
                } as any
              }
            );
            const profileData = profileResp?.data?.result?.userData;
            // The photo URL is stored in the `name` field by the uploadProfilePhoto flow
            const photoUrl = profileData?.name || null;
            // Only set if it looks like a URL (not a name string)
            if (photoUrl && (photoUrl.startsWith('http') || photoUrl.startsWith('https'))) {
              trainer.avatarUrl = photoUrl;
            }
          } catch {
            // silently ignore individual profile fetch failures
          }
        })
      );
    } catch {
      // silently ignore batch profile fetch failures
    }

    return trainers;
  } catch (error) {
    console.error('Error fetching CFL learner list:', error);
    throw error;
  }
};

export const getDICohorts = async () => {
  const apiUrl = `${BASE_URL}/cohort/search`;

  let storageAcademicYearId = '';
  let storageTenantId = '';
  let token = '';
  let storageCohortId = '';

  let storageUserId = '';
  let storageUserRole = '';

  if (typeof window !== 'undefined' && window.localStorage) {
    storageAcademicYearId = localStorage.getItem('academicYearId') || '';
    storageTenantId = localStorage.getItem('tenantId') || '';
    token = localStorage.getItem('token') || '';
    storageCohortId = localStorage.getItem('cohortId') || '';
    storageUserId = localStorage.getItem('userId') || '';
    storageUserRole = localStorage.getItem('userRole')?.trim().toUpperCase() || '';
  }

  const finalCohortId = storageCohortId || "19388f9f-5aca-4bcd-8576-b3254d0ae942";
  const finalAcademicYearId = storageAcademicYearId || 'edf1d200-21d8-417e-b844-1d04f92435f4';
  const finalTenantId = storageTenantId || '8cf74da8-392d-4d02-8ac3-ae2204e34c0a';

  // 1. First call: get all cohorts (useful for CFL to find their own details)
  const initialPayload = {
    limit: 0,
    offset: 0,
    sort: ["createdAt", "desc"],
    filters: {
      tenantId: finalTenantId,
    }
  };

  const headers: Record<string, string> = {
    'academicyearid': finalAcademicYearId,
    'tenantid': finalTenantId,
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-GB,en;q=0.9',
    'content-type': 'application/json'
  };

  if (token) {
    headers['authorization'] = `Bearer ${token}`;
  }

  try {
    const firstResponse = await post(apiUrl, initialPayload, headers);
    const data = firstResponse?.data?.data || firstResponse?.data || firstResponse;
    const allCohorts = data?.result?.results?.cohortDetails || data?.cohortDetails || data?.result?.cohortDetails || [];
    
    let cohortDetails: any[] = [];
    // --- ROLE BASED LOGIC ---
    if (storageUserRole === 'ARM') {
      // Find the DI cohort dynamically using the mycohorts API
     let diCohortIdToUse = finalCohortId;
      try {
        const myCohortsResp = await get(`${BASE_URL}/cohort/mycohorts/${storageUserId}?customField=true&children=true`, headers);
        const mcData = myCohortsResp?.data?.data || myCohortsResp?.data || myCohortsResp;
        const myCohorts = mcData?.result || [];
        if (myCohorts.length > 0) {
          diCohortIdToUse = myCohorts[0].cohortId || myCohorts[0].id;
        }
      } catch (e) {
        console.warn("Failed to fetch DI's own cohorts", e);
      }

      // If DI: Search for all child cohorts that have the DI's cohortId as their parent
      const secondPayload = {
        limit: 10,
        offset: 0,
        sort: ["createdAt", "desc"],
        filters: {
          tenantId: finalTenantId,
          parentId: [diCohortIdToUse]
        }
      };
      const secondResponse = await post(apiUrl, secondPayload, headers);
      const secondData = secondResponse?.data?.data || secondResponse?.data || secondResponse;
      cohortDetails = secondData?.result?.results?.cohortDetails || secondData?.cohortDetails || secondData?.result?.cohortDetails || [];
    } else {
      // If CFL: Just find their OWN cohort from the first call and show only that
      const myCohort = allCohorts.find((c: any) => c.cohortId === finalCohortId);
      if (myCohort) {
        cohortDetails = [myCohort];
      } else {
        console.warn("CFL Cohort not found in the list.");
        return [];
      }
    }

    const promises = cohortDetails.map(async (cohort: any) => {
      let trainers: any[] = [];
      try {
        trainers = await cfllearnerlist(cohort.cohortId, finalTenantId, token, finalAcademicYearId);
      } catch (e) {
        console.warn("Failed to fetch trainers for cohort", cohort.cohortId, e);
      }
      
      const cflInchargeFromList = trainers.find((t: any) => t.designation === 'District Incharge' || t.designation === 'CFL Incharge');
      
      if (cflInchargeFromList) {
        // Use the actual CFL user's data from the member list
        return [cflInchargeFromList];
      }
      
      // Fallback: create a placeholder CFL entry from cohort metadata
      const cflIncharge = {
        id: cohort.cohortId,
        name: cohort.name || 'CFL Incharge',
        avatarUrl: null,
        currentLevel: 'Beginner Level',
        location: 'District Level',
        progress: 0, 
        designation: 'District Incharge',
        courses: [
          { id: '1', name: 'Beginner Level', status: 'locked', completionPercentage: 0, completionCount: 0, totalCount: 4 },
          { id: '2', name: 'Intermediate Level', status: 'locked', completionPercentage: 0, completionCount: 0, totalCount: 4 },
        ]
      };
      return [cflIncharge];
    });

    const results = await Promise.all(promises);
    return results.flat();
  } catch (error) {
    console.error('Error fetching DI cohorts:', error);
    throw error;
  }
};

export const getDIForCFL = async (): Promise<{ id: string, name: string } | null> => {
  const apiUrl = `${BACKEND_URL}/cohort/search`;

  let storageAcademicYearId = '';
  let storageTenantId = '';
  let token = '';
  let storageCohortId = '';

  if (typeof window !== 'undefined' && window.localStorage) {
    storageAcademicYearId = localStorage.getItem('academicYearId') || '';
    storageTenantId = localStorage.getItem('tenantId') || '';
    token = localStorage.getItem('token') || '';
    storageCohortId = localStorage.getItem('cohortId') || '';
  }

  const finalCohortId = storageCohortId || "19388f9f-5aca-4bcd-8576-b3254d0ae942";
  const finalAcademicYearId = storageAcademicYearId || 'edf1d200-21d8-417e-b844-1d04f92435f4';
  const finalTenantId = storageTenantId || '8cf74da8-392d-4d02-8ac3-ae2204e34c0a';

  const headers: Record<string, string> = {
    'academicyearid': finalAcademicYearId,
    'tenantid': finalTenantId,
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-GB,en;q=0.9',
    'content-type': 'application/json'
  };

  if (token) headers['authorization'] = `Bearer ${token}`;

  try {
    const firstResponse = await post(apiUrl, {
      limit: 0, offset: 0, filters: { tenantId: finalTenantId }
    }, headers);
    
    // post() returns response.data, and cohortList API returns { result: { results: { cohortDetails: [] } } }
    const responseData = firstResponse?.data || firstResponse;
    const allCohorts = 
      responseData?.result?.results?.cohortDetails || 
      responseData?.results?.cohortDetails || 
      responseData?.cohortDetails || [];

    console.log('[getDIForCFL] allCohorts count:', allCohorts.length, 'finalCohortId:', finalCohortId);

    // Build a quick lookup map: cohortId → cohort
    const cohortMap: Record<string, any> = {};
    allCohorts.forEach((c: any) => { cohortMap[c.cohortId] = c; });

    // Step 1: Find the CFL's own cohort
    const myCohort = allCohorts.find((c: any) => c.cohortId === finalCohortId);
    console.log('[getDIForCFL] myCohort:', myCohort);

    if (!myCohort) {
      console.warn('[getDIForCFL] CFL cohort not found in allCohorts. Proceeding to fallback.');
    }

    // Step 2: Walk up the parent chain from CFL cohort to find the DI cohort
    // The chain is: CFL cohort → intermediate cohort (type SCHOOL) → DI cohort (type SCHOOL with name "DI")
    // Each cohort's parentId might be another cohortId in the list
    let diUserId: string | null = null;
    let diName = 'ARM';

    let foundDiCohortId: string | null = null;
    
    if (myCohort) {
      // Traverse up to 5 levels
      let currentParentId = myCohort.parentId;
      for (let i = 0; i < 5 && currentParentId; i++) {
        // Check if parentId is a cohortId in the map
        const parentCohort = cohortMap[currentParentId];
        if (parentCohort) {
          console.log('[getDIForCFL] Parent cohort:', parentCohort.name || parentCohort.cohortName, parentCohort.type);
          // If this parent is a DI cohort
          const pName = parentCohort.name || parentCohort.cohortName || '';
          if (
            pName.toLowerCase() === 'arm' ||
            pName.toLowerCase() === 'di' || 
            pName.toLowerCase().includes('district') ||
            (parentCohort.type?.toUpperCase() === 'SCHOOL' && (!parentCohort.parentId || !parentCohort.parentId.includes('-')))
          ) {
            foundDiCohortId = parentCohort.cohortId;
            diUserId = parentCohort.parentId;
            console.log('[getDIForCFL] Found DI cohort:', pName, '| DI cohortId:', foundDiCohortId, '| initial DI userId:', diUserId);
            break;
          }
          // Go one level up
          currentParentId = parentCohort.parentId;
        } else {
          // parentId is NOT a cohortId — it might be a userId at the top of the chain
          console.log('[getDIForCFL] parentId', currentParentId, 'not found in cohortMap - may be top-level userId');
          break;
        }
      }
    }

    // Step 3: If DI userId is empty but we found the DI cohort, fetch its members to find the DI
    if (foundDiCohortId && (!diUserId || diUserId.length < 10)) {
      try {
        console.log(`[getDIForCFL] Fetching members for DI cohort ${foundDiCohortId}...`);
        const membersResponse = await post(`${BACKEND_URL}/cohortmember/list`, {
          limit: 0,
          offset: 0,
          filters: { cohortId: foundDiCohortId }
        }, headers);
        
        const members = membersResponse?.data?.result?.userDetails || [];
        const diMember = members.find((m: any) => {
          const r = m.role?.toUpperCase();
          return r === 'ARM' || r === 'DI' || r === 'DISTRICT INCHARGE';
        });
        if (diMember && diMember.userId) {
          diUserId = diMember.userId;
          console.log(`[getDIForCFL] Found DI member from cohort: ${diMember.firstName} ${diMember.lastName} | userId: ${diUserId}`);
        }
      } catch (err) {
        console.warn(`[getDIForCFL] Failed to fetch members for DI cohort ${foundDiCohortId}:`, err);
      }
    }

    // Step 4: If we found a DI userId, fetch their user profile for name
    if (diUserId && diUserId.length >= 10) {
      try {
        const userUrl = `${BACKEND_URL}/user/read/${diUserId}?fieldvalue=false`;
        const userResponse = await get(userUrl);
        const userData = userResponse?.data || userResponse;
        const userInfo = userData?.result?.response || userData?.result || userData;
        const firstName = userInfo?.firstName || userInfo?.first_name || '';
        const lastName = userInfo?.lastName || userInfo?.last_name || '';
        const displayName = [firstName, lastName].filter(Boolean).join(' ').trim() || userInfo?.username || 'ARM';
        console.log('[getDIForCFL] ✅ DI user:', displayName, '| userId:', diUserId);
        return { id: diUserId, name: displayName };
      } catch (userErr) {
        console.warn('[getDIForCFL] user/read failed:', userErr);
        // Return just the userId with a generic name
        return { id: diUserId, name: diName };
      }
    }

    // Step 5: Fallback — look for any cohort whose name suggests DI role and whose parentId is not a cohortId (so it must be a userId)
    const allDICohorts = allCohorts.filter((c: any) => {
      const cName = c.name || c.cohortName || '';
      return (cName.toLowerCase() === 'arm' || cName.toLowerCase() === 'di' || cName.toLowerCase().includes('district')) &&
      !cohortMap[c.parentId];
    });
    console.log('[getDIForCFL] All DI-named cohorts found:', JSON.stringify(allDICohorts.map((c: any) => ({ name: c.name || c.cohortName, cohortId: c.cohortId, parentId: c.parentId }))));
    console.log('[getDIForCFL] All cohorts summary:', JSON.stringify(allCohorts.map((c: any) => ({ name: c.name || c.cohortName, cohortId: c.cohortId, parentId: c.parentId, type: c.type }))));
    // Prefer type=SCHOOL over COHORT: the real DI cohort is always SCHOOL type.
    // A COHORT-typed "di" is just a sub-group, not the actual District Incharge cohort.
    const diCohort = allDICohorts.find((c: any) => c.type?.toUpperCase() === 'SCHOOL')
                  || allDICohorts[0];
    if (diCohort) {
      let diUidFromCohort = diCohort.parentId;
      
      // If the parentId is empty, we must fetch the members of the cohort to find the DI
      if (!diUidFromCohort || diUidFromCohort.length < 10) {
        try {
          console.log(`[getDIForCFL] Fallback: Fetching members for DI cohort ${diCohort.cohortId}...`);
          const membersResponse = await post(`${BACKEND_URL}/cohortmember/list`, {
            limit: 0, offset: 0, filters: { cohortId: diCohort.cohortId }
          }, headers);
          
          const members = membersResponse?.data?.result?.userDetails || [];
          const diMember = members.find((m: any) => {
            const r = m.role?.toUpperCase();
            return r === 'ARM' || r === 'DI' || r === 'DISTRICT INCHARGE';
          });
          if (diMember && diMember.userId) {
            diUidFromCohort = diMember.userId;
            console.log(`[getDIForCFL] Fallback: Found DI member from cohort: ${diMember.firstName} | userId: ${diUidFromCohort}`);
          }
        } catch (err) {
          console.warn(`[getDIForCFL] Fallback: Failed to fetch members for DI cohort:`, err);
        }
      }

      console.log('[getDIForCFL] Fallback: found DI cohort by name:', diCohort.name || diCohort.cohortName, '| userId:', diUidFromCohort);
      
      if (!diUidFromCohort || diUidFromCohort.length < 10) {
         console.warn('[getDIForCFL] Fallback could not resolve DI userId.');
         return null;
      }
      
      // Try to get the real DI name via user/read
      try {
        const userUrl = `${BACKEND_URL}/user/read/${diUidFromCohort}?fieldvalue=false`;
        const userResponse = await get(userUrl);
        const rawResponse = userResponse?.data;
        // Log the FULL raw response so we can see the actual structure
        console.log('[getDIForCFL] user/read RAW response:', JSON.stringify(rawResponse));
        
        // The user/read API response is: { result: { userData: { firstName, lastName, ... } } }
        const userInfo = rawResponse?.result?.userData ||
                         rawResponse?.result?.response || 
                         rawResponse?.result?.userDetails?.[0] ||
                         rawResponse?.result ||
                         rawResponse?.data ||
                         rawResponse;
        
        console.log('[getDIForCFL] userInfo object:', JSON.stringify(userInfo));
        
        // Try every possible name field
        const firstName = userInfo?.firstName || userInfo?.first_name || userInfo?.given_name || '';
        const lastName  = userInfo?.lastName  || userInfo?.last_name  || userInfo?.family_name || '';
        const fullName  = [firstName, lastName].filter(Boolean).join(' ').trim();
        
        const displayName = fullName 
          || userInfo?.name 
          || userInfo?.fullName
          || userInfo?.displayName
          || userInfo?.username
          || userInfo?.preferred_username
          || '';
          
        console.log('[getDIForCFL] ✅ DI user (fallback):', displayName || '(empty — check raw log above)', '| userId:', diUidFromCohort);
        return { id: diUidFromCohort, name: displayName || 'ARM' };
      } catch (userErr) {
        console.warn('[getDIForCFL] user/read failed in fallback:', userErr);
        return { id: diUidFromCohort, name: 'ARM' };
      }
    }

    console.warn('[getDIForCFL] Could not find DI in cohort hierarchy.');
    return null;
  } catch (error) {
    console.error('Error in getDIForCFL:', error);
    return null;
  }
};

export const getTrainerProgress = async (trainerId: string, tenantId: string): Promise<CourseProgress[]> => {
  try {
    const API_URL = `${BASE_URL}/tracking/user_certificate/status/search`;
    
    // 1. Fetch courses the trainer is enrolled in
    const enrolledResponse = await post(API_URL, {
      filters: { tenantId, userId: trainerId },
      offset: 0,
    });
    
    const enrolledData = enrolledResponse?.data?.result?.data || [];
    const courseIds = enrolledData.map((c: any) => c.courseId);
    
    if (courseIds.length === 0) return [];

    // 2. Fetch tracking details for these courses
    const trackingUrl = `${BASE_URL}/tracking/content/course/status`;
    let trackingData: any = {};
    try {
      const trackHeaders: Record<string, string> = { tenantid: tenantId };
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        const academicYearId = localStorage.getItem('academicYearId');
        if (token) trackHeaders['authorization'] = `Bearer ${token}`;
        trackHeaders['academicyearid'] = academicYearId || '';
      }
      const trackResp = await axios.post(trackingUrl, {
        userId: [trainerId],
        courseId: courseIds
      }, { headers: trackHeaders });
      trackingData = trackResp.data?.result || {};
    } catch (e) {
      console.warn("Tracking data fetch failed", e);
    }

    // Helper to determine status from tracking data
    const getStatus = (contentId: string): 'completed' | 'in-progress' | 'locked' => {
      // Find tracking info for this user and contentId
      const userTrack = trackingData[trainerId] || [];
      const item = userTrack.find((t: any) => t.contentId === contentId || t.courseId === contentId);
      if (item && item.status === 2) return 'completed';
      if (item && item.status === 1) return 'in-progress';
      return 'locked';
    };

    // 3. Fetch hierarchy for each course
    const courseProgressPromises = courseIds.map(async (courseId: string) => {
      try {
        const hierarchyUrl = `${BASE_URL}/action/content/v3/hierarchy/${courseId}`;
        const hierarchyResp = await axios.get(hierarchyUrl, { headers: { tenantId } });
        const courseData = hierarchyResp.data?.result?.content;
        
        if (!courseData) return null;

        const levels = (courseData.children || []).map((level: any) => {
          const modules = (level.children || []).map((mod: any) => {
            const subtopics = (mod.children || []).map((sub: any) => {
              const lessons = (sub.children || []).map((lesson: any) => ({
                id: lesson.identifier,
                name: lesson.name,
                type: lesson.mimeType === 'application/vnd.sunbird.questionset' ? 'quiz' : 'lesson',
                status: getStatus(lesson.identifier)
              }));
              
              const completedLessons = lessons.filter((l: any) => l.status === 'completed').length;
              return {
                id: sub.identifier,
                name: sub.name,
                status: completedLessons === lessons.length && lessons.length > 0 ? 'completed' : (completedLessons > 0 ? 'in-progress' : 'locked'),
                completionCount: completedLessons,
                totalCount: lessons.length,
                lessons
              };
            });
            
            const completedSubs = subtopics.filter((s: any) => s.status === 'completed').length;
            return {
              id: mod.identifier,
              name: mod.name,
              status: completedSubs === subtopics.length && subtopics.length > 0 ? 'completed' : (completedSubs > 0 ? 'in-progress' : 'locked'),
              completionCount: completedSubs,
              totalCount: subtopics.length,
              subtopics
            };
          });
          
          const completedMods = modules.filter((m: any) => m.status === 'completed').length;
          return {
            name: level.name,
            status: completedMods === modules.length && modules.length > 0 ? 'completed' : (completedMods > 0 ? 'in-progress' : 'locked'),
            modules
          };
        });

        return {
          id: courseData.identifier,
          name: courseData.name,
          levels
        };
      } catch (err) {
        console.error(`Error fetching hierarchy for course ${courseId}`, err);
        return null;
      }
    });

    const progressData = (await Promise.all(courseProgressPromises)).filter(Boolean);
    return progressData as CourseProgress[];
  } catch (error) {
    console.error('Error in getTrainerProgress:', error);
    return [];
  }
};

export const sendAlert = async (feedback: AlertFeedback): Promise<boolean> => {
  const apiUrl = `https://notification.tekdinext.com/notification/inApp`;
  try {
    await post(apiUrl, feedback);
    return true;
  } catch (error) {
    console.error('Error sending alert:', error);
    return false;
  }
};

export interface AlertNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: any;
  actionData?: {
    actionData?: any;
    metadata?: any;
    [key: string]: any;
  };
}

export const getAlerts = async (userId: string, tenantId: string, token: string): Promise<AlertNotification[]> => {
  if (!userId || !tenantId || !token) return [];
  const apiUrl = `https://notification.tekdinext.com/notification/inApp?userId=${userId}&limit=50`;
  
  const headers: Record<string, string> = {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-GB,en;q=0.9',
    'tenantid': tenantId,
    'authorization': `Bearer ${token}`
  };

  try {
    const response = await axios.get(apiUrl, { headers });
    const data = response.data?.result?.data || [];
    return data as AlertNotification[];
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return [];
  }
};
