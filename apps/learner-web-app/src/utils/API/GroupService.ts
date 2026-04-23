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
    const token = localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenantId');

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
        'academicyearid': 'edf1d200-21d8-417e-b844-1d04f92435f4',
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
    console.log('Group Content API Response:', data); // Debug log
    return data;
  } catch (error) {
    console.error('Error fetching group content:', error);
    throw error;
  }
};

export const getMyCohorts = async (): Promise<MyCohortsResponse> => {
  try {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenantId');
    const academicYearId = localStorage.getItem('academicYearId');

    if (!userId || !token) {
      throw new Error('User not authenticated');
    }

    const url = `${baseurl}/cohort/mycohorts/${userId}?customField=true&children=true`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8,ur;q=0.7',
        'Authorization': `Bearer ${token}`,
        'Connection': 'keep-alive',
        'Origin': 'https://dev-lmp.prathamdigital.org',
        'Referer': 'https://dev-lmp.prathamdigital.org/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Linux"',
        ...(tenantId && { 'tenantid': tenantId }),
        'academicyearid': 'edf1d200-21d8-417e-b844-1d04f92435f4',
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
  console.log('Cohort data for transformation:', cohort); // Debug log
  console.log('Available fields:', Object.keys(cohort)); // Debug log
  
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
    console.log('Fetching content count for group ID:', cohortId); // Debug log
    const response = await getGroupContent(cohortId);
    const count = response.result ? response.result.length : 0;
    console.log('Content count for group', cohortId, ':', count); // Debug log
    return count;
  } catch (error) {
    console.error('Error fetching content count for group:', cohortId, error);
    return 0;
  }
};

// Fetch detailed content information using composite search API
export const getGroupContentDetails = async (cohortId: string): Promise<any[]> => {
  try {
    console.log('Fetching content details for group ID:', cohortId); // Debug log
    
    // First get the content IDs from the group content API
    const response = await getGroupContent(cohortId);
    if (!response.result || response.result.length === 0) {
      return [];
    }

    // Extract content IDs
    const contentIds = response.result.map((item: any) => item.contentId).filter(Boolean);
    console.log('Content IDs to fetch:', contentIds);

    if (contentIds.length === 0) {
      return [];
    }

    // Use composite search API to get detailed content information
    const token = localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenantId');
    const channelId = localStorage.getItem('channelId');

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
        'academicyearid': 'edf1d200-21d8-417e-b844-1d04f92435f4',
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
    console.log('Composite search response:', searchData);
    
    return searchData.result?.content || [];
  } catch (error) {
    console.error('Error fetching group content details:', error);
    throw error;
  }
};
