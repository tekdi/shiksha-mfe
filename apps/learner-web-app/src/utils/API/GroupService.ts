import { baseurl } from './EndUrls';

export interface GroupResponse {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  contentCount: number;
  imageUrl?: string;
  category?: string;
  createdDate?: string;
  creatorName?: string;
  creatorAvatar?: string;
  // Add other fields based on actual API response
  [key: string]: any;
}

export interface MyCohortsResponse {
  result: GroupResponse[];
  responseCode: number;
  params: {
    status: string;
  };
}

export interface GroupContentResponse {
  id: string;
  ver: string;
  ts: string;
  params: {
    resmsgid: string;
    status: string;
    err: any;
    errmsg: any;
    successmessage: string;
  };
  responseCode: number;
  result: any[]; // The result is directly an array of content items
}

export const getGroupContent = async (cohortId: string): Promise<GroupContentResponse> => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;
    const academicYearId = typeof window !== 'undefined' ? localStorage.getItem('academicYearId') : null;

    if (!token) {
      throw new Error('User not authenticated');
    }

    const url = `${baseurl}/user/cohortcontent/search`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(academicYearId && { 'academicyearid': academicYearId }),
        ...(tenantId && { 'tenantid': tenantId }),
      },
      body: JSON.stringify({
        filter: {
          cohortId: cohortId
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching group content:', error);
    throw error;
  }
};

export const getMyCohorts = async (): Promise<MyCohortsResponse> => {
  try {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;
    const academicYearId = typeof window !== 'undefined' ? localStorage.getItem('academicYearId') : null;

    if (!userId || !token) {
      throw new Error('User not authenticated');
    }

    const url = `${baseurl}/cohort/mycohorts/${userId}?customField=true&children=true`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(tenantId && { 'tenantid': tenantId }),
        ...(academicYearId && { 'academicyearid': academicYearId }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching my cohorts:', error);
    throw error;
  }
};

// Transform API response to match our GroupItem interface
export const transformCohortToGroup = (cohort: any): GroupResponse => {
  return {
    id: cohort.cohortId || cohort.id || '',
    name: cohort.cohortName || cohort.name || 'Untitled Group',
    description: cohort.description || cohort.summary || '',
    memberCount: Number(cohort.memberCount || cohort.participantCount || 0),
    contentCount: 0, // Will be updated after fetching content count
    imageUrl: cohort.imageUrl || cohort.posterImage,
    category: cohort.type || cohort.category || cohort.subject,
    createdDate: cohort.createdDate || cohort.createdOn,
    creatorName: cohort.creatorName || cohort.createdBy,
    creatorAvatar: cohort.creatorAvatar || cohort.creatorImage,
  };
};

// Fetch content count for a specific group
export const getGroupContentCount = async (cohortId: string): Promise<number> => {
  try {
    const response = await getGroupContent(cohortId);
    const count = response.result ? response.result.length : 0;
    return count;
  } catch (error) {
    console.error('Error fetching content count for group:', cohortId, error);
    return 0;
  }
};

// Fetch detailed content information using composite search API
export const getGroupContentDetails = async (cohortId: string): Promise<any[]> => {
  try {
    // First get the content IDs from the group content API
    const response = await getGroupContent(cohortId);
    if (!response.result || response.result.length === 0) {
      return [];
    }

    // Extract content IDs
    const contentIds = response.result.map((item: any) => item.contentId).filter(Boolean);

    if (contentIds.length === 0) {
      return [];
    }

    // Use composite search API to get detailed content information
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;
    const channelId = typeof window !== 'undefined' ? localStorage.getItem('channelId') : null;
    const academicYearId = typeof window !== 'undefined' ? localStorage.getItem('academicYearId') : null;

    if (!token) {
      throw new Error('User not authenticated');
    }

    const searchUrl = `${baseurl}/action/composite/v3/search`;
    
    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(academicYearId && { 'academicyearid': academicYearId }),
        ...(tenantId && { 'tenantid': tenantId }),
        ...(channelId && { 'channelid': channelId }),
      },
      body: JSON.stringify({
        request: {
          filters: {
            identifier: contentIds,
            status: ['live'],
          },
          fields: [
            'name',
            'appIcon',
            'description',
            'posterImage',
            'mimeType',
            'identifier',
            'resourceType',
            'primaryCategory',
            'contentType',
            'trackable',
            'children',
            'leafNodes',
          ],
          limit: contentIds.length,
          offset: 0,
        },
      }),
    });

    if (!searchResponse.ok) {
      throw new Error(`HTTP error! status: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    return searchData.result?.content || [];
  } catch (error) {
    console.error('Error fetching group content details:', error);
    throw error;
  }
};
