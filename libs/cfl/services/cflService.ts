import { post } from '@shared-lib';
import { Trainer, CourseProgress, AlertFeedback } from '../types';
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'https://middleware-shikshav2.shikshagraha.org';

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

export const cfllearnerlist = async () => {
  const apiUrl = 'https://interface.tekdinext.com/interface/v1/cohortmember/list';
  
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

  const finalCohortId = storageCohortId || "19388f9f-5aca-4bcd-8576-b3254d0ae942";
    //
  const finalAcademicYearId = storageAcademicYearId || 'edf1d200-21d8-417e-b844-1d04f92435f4';
  const finalTenantId = storageTenantId || '8cf74da8-392d-4d02-8ac3-ae2204e34c0a';

  const payload: any = {
    limit: 0,
    offset: 0,
    filters: {
      cohortId: finalCohortId,
      status: ['active'],
      role: 'Learner',
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

  if (token) {
    headers['authorization'] = `Bearer ${token}`;
  } else {
    headers['authorization'] = `Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJxSEJLb1JaSkRVOHUweEROYk95dUF2S3Roelo0TXo2c0l6OHRiSXRWWVBnIn0.eyJleHAiOjE3ODAzNzkzOTcsImlhdCI6MTc4MDI5Mjk5NywianRpIjoiNzM1MjI3Y2MtMGVhMC00M2ZjLWI4Y2ItMDRjODFjNTlmYTdlIiwiaXNzIjoiaHR0cHM6Ly9hZG1pbi5zdW5iaXJkc2Fhcy5jb20vYXV0aC9yZWFsbXMvc2hpa3NoYSIsImF1ZCI6ImFjY291bnQiLCJzdWIiOiJiN2NjMWY3Ny05MGNhLTRmMzMtOTMzYS03NjQ3YjFiMzk1YWMiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzaGlrc2hhIiwic2Vzc2lvbl9zdGF0ZSI6IjdhYzUxMGU2LWU1MjItNDE2NS05NzNlLWQ0ZjA5ZTEyYzNkMCIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiaHR0cHM6Ly9kZXYuc25haWxuZXR3b3JrLm9yZyIsImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMyIsImh0dHBzOi8vd3d3LnNuYWlsbmV0d29yay5vcmciLCIqIiwiaHR0cHM6Ly9hZG1pbi5zdW5iaXJkc2Fhcy5jb20iLCJodHRwOi8vbG9jYWxob3N0OjQxMjAiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iLCJkZWZhdWx0LXJvbGVzLXByYXRoYW0iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6ImVtYWlsIHByb2ZpbGUgcHJhdGhhbS1yb2xlIiwic2lkIjoiN2FjNTEwZTYtZTUyMi00MTY1LTk3M2UtZDRmMDllMTJjM2QwIiwidGVuYW50X2lkIjoiMGQ3M2JjZjktYWI2Mi00NGVmLTk0NWUtODhiMWE3N2FiM2MzIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJvcmdfaWQiOiI4Y2Y3NGRhOC0zOTJkLTRkMDItOGFjMy1hZTIyMDRlMzRjMGEiLCJuYW1lIjoiYWRtaW5fb2JsZiBhZG1pbl9vYmxmIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiYWRtaW5fb2JsZiIsImdpdmVuX25hbWUiOiJhZG1pbl9vYmxmIiwiZmFtaWx5X25hbWUiOiJhZG1pbl9vYmxmIiwidXNlcl9yb2xlc190ZXN0IjpbeyJ0aXRsZSI6IkxlYXJuZXIifV19.U9qTOc2k0bHSjob9OS5XsZgIiu1JFswa-ddlHQKv1LGCHf38rMqHkXFyT0ehy-_TCVwfvk6cDIUa4VldAJittTXgrsnvIGudggNZp9VB62hIK6aOVgwUsvxdrGK_Ip73tFDWGXn0LZbmFQQF9pqZchcT4i9m3LHgbuhQAf5BZqAM2z21xgWcaez1LdN6HxtfiIZ-eBW2Vj5oZ8YksQBzK3BlzV5T7x8jPcROBQAT4xHUVlb1MSzJp_xXgcp8I7cnumefhraXEwzxaCRS1HN6-HHLxIwS9JlUtjYPHO_g-aUu6CzHVY7dNyOgr61t4w-QHG7K9gi8eHaEzKmRqu7lJQ`;
  }

  try {
    const response = await post(apiUrl, payload, headers);
    const data = response?.data?.data || response?.data;
    const userDetails = data?.result?.userDetails || [];

    const searchUrl = 'https://interface.tekdinext.com/interface/v1/action/composite/v3/search';
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
    } catch (e) {
      console.warn("Search API fetch failed", e);
    }

    const trackingUrl = `${BASE_URL}/tracking/content/course/status`;
    const trainerIds = userDetails.map((u: any) => u.userId);
    const courseIds = liveCourses.map((c: any) => c.identifier);
    let trackingData: Record<string, any[]> = {};

    if (trainerIds.length > 0 && courseIds.length > 0) {
      try {
        const trackHeaders: Record<string, string> = {
          'tenantid': finalTenantId,
          'academicyearid': finalAcademicYearId,
        };
        if (token) {
          trackHeaders['authorization'] = `Bearer ${token}`;
        }
        console.log('[CFL] Tracking request — trainerIds:', trainerIds, 'courseIds:', courseIds);
        const trackResp = await axios.post(trackingUrl, {
          userId: trainerIds,
          courseId: courseIds
        }, { headers: trackHeaders });
        console.log('[CFL] Tracking API raw response:', JSON.stringify(trackResp.data));
        const rawData = trackResp.data?.result?.data || trackResp.data?.data || [];
        trackingData = rawData.reduce((acc: any, item: any) => {
          if (item.userId) {
            acc[item.userId] = item.course || [];
          }
          return acc;
        }, {});
        console.log('[CFL] Parsed trackingData keys:', Object.keys(trackingData));
      } catch (e) {
        console.warn("Tracking data fetch failed", e);
      }
    }

    const trainers = userDetails.map((user: any) => {
      const stateField = user.customField?.find((field: any) => field.label === 'STATE' || field.fieldId === 'state')?.value || 'Jharkhand';
      const districtField = user.customField?.find((field: any) => field.label === 'DISTRICT' || field.fieldId === 'district')?.value || 'Torpa';
      
      const userTrack = trackingData[user.userId] || [];
      console.log(`[CFL] User ${user.userId} (${user.firstName}) tracking entries:`, userTrack.length, userTrack);

      const courses = liveCourses.map((course: any) => {
        const item = userTrack.find((t: any) => t.courseId === course.identifier || t.contentId === course.identifier);
        let status = 'locked';
        let completionPct = 0;
        
        if (item) {
          const rawStatus = String(item.status || '').toLowerCase();
          if (rawStatus === 'completed' || item.status === 2 || item.completed === true || (typeof item.completed === 'number' && item.completed > 0 && !item.children)) {
            status = 'completed';
            completionPct = 100;
          } else if (rawStatus === 'in-progress' || item.in_progress > 0 || item.status === 1 || item.completed > 0) {
            completionPct = item.completionPercentage ?? 0;
            if (completionPct >= 70) {
              status = 'completed';
              completionPct = 100;
            } else {
              status = 'in-progress';
              if (completionPct === 10) completionPct = 0; // Strip phantom 10% fallbacks
            }
          }
        }

        return {
          id: course.identifier,
          name: course.name,
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

      return {
        id: user.userId,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        avatarUrl: user.avatar || user.profileImage || null,
        currentLevel: user.currentLevel || 'Beginner Level',
        location: `CFL: ${stateField} - ${districtField}`,
        progress: progressPercent,
        courses: courses.length > 0 ? courses : [
          { id: '1', name: 'Beginner Level', status: 'completed', completionPercentage: 100, completionCount: 4, totalCount: 4 },
          { id: '2', name: 'Intermediate Level', status: 'in-progress', completionPercentage: 25, completionCount: 1, totalCount: 4 },
        ]
      };
    });

    return trainers;
  } catch (error) {
    console.error('Error fetching CFL learner list:', error);
    throw error;
  }
};

export const getDICohorts = async () => {
  const apiUrl = 'https://interface.tekdinext.com/interface/v1/cohort/search';

  let storageAcademicYearId = '';
  let storageTenantId = '';
  let token = '';
  let storageCohortId = '';

  let storageUserId = '';

  if (typeof window !== 'undefined' && window.localStorage) {
    storageAcademicYearId = localStorage.getItem('academicYearId') || '';
    storageTenantId = localStorage.getItem('tenantId') || '';
    token = localStorage.getItem('token') || '';
    storageCohortId = localStorage.getItem('cohortId') || '';
    storageUserId = localStorage.getItem('userId') || '';
  }

  const finalCohortId = storageCohortId || "19388f9f-5aca-4bcd-8576-b3254d0ae942";
  const finalAcademicYearId = storageAcademicYearId || 'edf1d200-21d8-417e-b844-1d04f92435f4';
  const finalTenantId = storageTenantId || '8cf74da8-392d-4d02-8ac3-ae2204e34c0a';

  // 1. First call: get all cohorts to find the parentId
  const initialPayload = {
    limit: 0,
    offset: 0,
    sort: ["createdAt", "desc"],
    filters: {
      type: "COHORT",
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
    const firstResponse = await axios.post(apiUrl, initialPayload, { headers });
    const allCohorts = firstResponse.data?.result?.results?.cohortDetails || [];
    
    // Find the cohort matching localstorage cohortId to extract its parentId
    const matchedCohort = allCohorts.find((c: any) => c.cohortId === finalCohortId);
    
    if (!matchedCohort || !matchedCohort.parentId) {
      console.warn("Could not find matching cohort or parentId in first call.");
      return [];
    }

    const targetParentId = matchedCohort.parentId;

    // 2. Second call: fetch the actual list using the found parentId
    const secondPayload = {
      limit: 10,
      offset: 0,
      sort: ["createdAt", "desc"],
      filters: {
        type: "COHORT",
        tenantId: finalTenantId,
        parentId: [targetParentId]
      }
    };

    const secondResponse = await axios.post(apiUrl, secondPayload, { headers });
    const cohortDetails = secondResponse.data?.result?.results?.cohortDetails || [];

    const trainers = cohortDetails.map((cohort: any) => {
      return {
        id: cohort.cohortId,
        name: cohort.name || 'CFL Incharge',
        avatarUrl: null,
        currentLevel: 'Beginner Level',
        location: 'District Level',
        progress: 0, 
        courses: [
          { id: '1', name: 'Beginner Level', status: 'locked', completionPercentage: 0, completionCount: 0, totalCount: 4 },
          { id: '2', name: 'Intermediate Level', status: 'locked', completionPercentage: 0, completionCount: 0, totalCount: 4 },
        ]
      };
    });
    return trainers;
  } catch (error) {
    console.error('Error fetching DI cohorts:', error);
    throw error;
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
