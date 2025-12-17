import { post } from '@shared-lib';
import axios, { AxiosRequestConfig } from 'axios';
export interface ContentSearchResponse {
  ownershipType?: string[];
  publish_type?: string;
  copyright?: string;
  se_gradeLevelIds?: string[];
  keywords?: string[];
  subject?: string[];
  targetMediumIds?: string[];
  channel?: string;
  downloadUrl?: string;
  organisation?: string[];
  language?: string[];
  mimeType?: string;
  variants?: {
    spine?: {
      ecarUrl?: string;
      size?: string;
    };
    online?: {
      ecarUrl?: string;
      size?: string;
    };
  };
  leafNodes?: string[];
  targetGradeLevelIds?: string[];
  objectType?: string;
  se_mediums?: string[];
  appIcon?: string;
  primaryCategory?: string;
  contentEncoding?: string;
  lockKey?: string;
  generateDIALCodes?: string;
  totalCompressedSize?: number;
  mimeTypesCount?: Record<string, number>;
  contentType?: string;
  se_gradeLevels?: string[];
  trackable?: {
    enabled?: string;
    autoBatch?: string;
  };
  identifier?: string;
  audience?: string[];
  se_boardIds?: string[];
  subjectIds?: string[];
  toc_url?: string;
  visibility?: string;
  contentTypesCount?: Record<string, number>;
  author?: string;
  consumerId?: string;
  childNodes?: string[];
  children?: Array<{
    identifier: string;
    name: string;
    mimeType: string;
    contentType: string;
    description: string;
    appIcon?: string;
    posterImage?: string;
    children?: Array<{
      identifier: string;
      name: string;
      mimeType: string;
      contentType: string;
      description: string;
      appIcon?: string;
      posterImage?: string;
    }>;
  }>;
  discussionForum?: {
    enabled?: string;
  };
  mediaType?: string;
  osId?: string;
  graph_id?: string;
  nodeType?: string;
  lastPublishedBy?: string;
  version?: number;
  se_subjects?: string[];
  license?: string;
  size?: number;
  lastPublishedOn?: string;
  name?: string;
  attributions?: string[];
  targetBoardIds?: string[];
  status?: string;
  code?: string;
  publishError?: string | null;
  credentials?: {
    enabled?: string;
  };
  prevStatus?: string;
  description?: string;
  posterImage?: string;
  idealScreenSize?: string;
  createdOn?: string;
  se_boards?: string[];
  targetSubjectIds?: string[];
  se_mediumIds?: string[];
  copyrightYear?: number;
  contentDisposition?: string;
  additionalCategories?: string[];
  lastUpdatedOn?: string;
  dialcodeRequired?: string;
  createdFor?: string[];
  creator?: string;
  os?: string[];
  se_subjectIds?: string[];
  se_FWIds?: string[];
  targetFWIds?: string[];
  pkgVersion?: number;
  versionKey?: string;
  migrationVersion?: number;
  idealScreenDensity?: string;
  framework?: string;
  depth?: number;
  s3Key?: string;
  lastSubmittedOn?: string;
  createdBy?: string;
  compatibilityLevel?: number;
  leafNodesCount?: number;
  userConsent?: string;
  resourceType?: string;
  node_id?: number;
}
// Define the payload

export interface ResultProp {
  QuestionSet?: ContentSearchResponse[];
  content: ContentSearchResponse[];
  count: number;
}
export interface ContentResponse {
  result: ResultProp;
}

// Helper function to clean filters - remove empty arrays and invalid values
const cleanFilters = (filters: any): any => {
  if (!filters || typeof filters !== 'object') {
    return {};
  }
  
  // List of keys that should NEVER be sent to the search API
  const excludedKeys = [
    'objectCategoryDefinition', // This is metadata, not a filter
    'filterFramework', // Framework data, not a filter
    'staticFilter', // Static filter metadata, not a filter
    'objectMetadata', // Metadata object, not a filter
    'schema', // Schema definition, not a filter
    'forms', // Form definitions, not a filter
    'userId', // User-specific tracking filter, not for content search
    'courseId', // Course-specific tracking filter, not for content search
  ];
  
  const cleaned: any = {};
  
  Object.keys(filters).forEach((key) => {
    // Skip excluded keys
    if (excludedKeys.includes(key)) {
      return;
    }
    
    const value = filters[key];
    
    // Skip null, undefined, or empty strings
    if (value === null || value === undefined || value === '') {
      return;
    }
    
    // Skip if the value is an object with objectCategoryDefinition (nested case)
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      if ('objectCategoryDefinition' in value || 'objectMetadata' in value || 'schema' in value) {
        // This looks like metadata, skip it
        return;
      }
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      // Filter out null, undefined, empty strings, and invalid objects
      const filteredArray = value.filter((item: any) => {
        if (item === null || item === undefined || item === '') {
          return false;
        }
        // If it's an object, check if it has valid name or code (and is not metadata)
        if (typeof item === 'object') {
          // Skip if it looks like metadata
          if ('objectCategoryDefinition' in item || 'objectMetadata' in item || 'schema' in item) {
            return false;
          }
          const name = item?.name ?? item?.code ?? '';
          return name && name.trim() !== '';
        }
        // If it's a string, check if it's not empty
        if (typeof item === 'string') {
          return item.trim() !== '';
        }
        return true;
      });
      
      // Only include non-empty arrays
      if (filteredArray.length > 0) {
        // Convert objects to strings (names) if needed
        cleaned[key] = filteredArray.map((item: any) => {
          if (typeof item === 'object' && item !== null) {
            return item?.name ?? item?.code ?? item;
          }
          return item;
        });
      }
    } else if (typeof value === 'string' && value.trim() !== '') {
      // Include non-empty strings
      cleaned[key] = value;
    } else if (typeof value === 'object' && value !== null) {
      // Recursively clean nested objects (but skip metadata objects)
      const cleanedNested = cleanFilters(value);
      if (Object.keys(cleanedNested).length > 0) {
        cleaned[key] = cleanedNested;
      }
    } else if (typeof value !== 'object') {
      // Include other primitive types (numbers, booleans, etc.)
      cleaned[key] = value;
    }
  });
  
  return cleaned;
};

export const ContentSearch = async ({
  type,
  query,
  filters,
  limit = 5,
  offset = 0,
}: {
  type: string;
  query?: string;
  filters?: object;
  limit?: number;
  offset?: number;
}): Promise<ContentResponse> => {
  try {
    // Ensure the environment variable is defined
    const searchApiUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL;
    if (!searchApiUrl) {
      throw new Error('Search API URL environment variable is not configured');
    }
    
    // Clean filters to remove empty arrays and invalid values
    const cleanedFilters = cleanFilters(filters || {});
    
    // Explicitly remove filters that should not be sent to the search API
    // This prevents previous filter values from affecting the current tab's content
    delete cleanedFilters.primaryCategory;
    delete cleanedFilters.userId;
    delete cleanedFilters.courseId;
    
    // Transform filter keys for API compatibility
    // Map se_subtopics to subtopic (required for Swadhaar tenant and other tenants)
    if (cleanedFilters.se_subtopics) {
      cleanedFilters.subtopic = cleanedFilters.se_subtopics;
      delete cleanedFilters.se_subtopics;
    }
    
    // Determine primaryCategory based on type
    // Normalize type to handle variations like "Course", "Courses", etc.
    const normalizedType = type && typeof type === 'string' 
      ? type.toLowerCase().trim() 
      : '';
    
    // Check if this is a Course type (tab=0: Course tab)
    const isCourse = normalizedType === 'course' || normalizedType === 'courses';

    const CONTENT_CATEGORIES = [
      'Content Playlist',
      'Digital Textbook',
      'Question paper',
      'Course Assessment',
      'eTextbook',
      'Explanation Content',
      'Learning Resource',
      'Practice Question Set',
      'Teacher Resource',
      'Exam Question'
    ];
    const primaryCategory = isCourse
      ? ['Course']
      : CONTENT_CATEGORIES;
    
    // Axios request configuration
    const data = {
      request: {
        filters: {
          ...cleanedFilters,
          status: ['live'],
          primaryCategory,
          channel: localStorage.getItem('channelId'),
        },
        // fields: [
        //   'name',
        //   'appIcon',
        //   'description',
        //   'posterImage',
        //   'mimeType',
        //   'identifier',
        //   'resourceType',
        //   'primaryCategory',
        //   'contentType',
        //   'trackable',
        //   'children',
        //   'leafNodes',
        // ],
        query,
        limit,
        offset,
      },
    };

    // Execute the request
    const response = await post(
      `${searchApiUrl}/action/composite/v3/search`,
      data
    );
    const res = response?.data;

    return res;
  } catch (error: any) {
    console.error('❌ Error in ContentSearch:', error);
    // Log request details for debugging
    if (error?.config?.data) {
      try {
        const requestData = typeof error.config.data === 'string' 
          ? JSON.parse(error.config.data) 
          : error.config.data;
        console.error('❌ Request payload:', JSON.stringify(requestData, null, 2));
      } catch (e) {
        console.error('❌ Request payload (raw):', error.config.data);
      }
    }
    if (error?.response?.data) {
      console.error('❌ Error response:', error.response.data);
    }
    throw error;
  }
};

export const CommonContentSearch = async ({
  type,
  query,
  filters,
  limit = 5,
  offset = 0,
}: {
  type: string;
  query?: string;
  filters?: object;
  limit?: number;
  offset?: number;
}): Promise<ContentResponse> => {
  try {
    // Ensure the environment variable is defined
    const searchApiUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL;
    if (!searchApiUrl) {
      throw new Error('Search API URL environment variable is not configured');
    }
    // Clean filters to remove empty arrays and invalid values
    const cleanedFilters = cleanFilters(filters || {});
    
    // Remove program filter if it exists (as per original logic)
    if ('program' in cleanedFilters) {
      delete cleanedFilters.program;
    }
    
    // Axios request configuration
    const data = {
      request: {
        filters: {
          // identifier: 'do_114228944942358528173',
          // identifier: 'do_1141652605790289921389',
          //need below after login user channel for dynamic load content
          // channel: '0135656861912678406',
          primaryCategory:['Course'],
          ...cleanedFilters,
          status: ['live'],
        
          channel: localStorage.getItem('channelId'),
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
          'courseType'
        ],
        query,
        limit,
        offset,
      },
    };

    // Execute the request
    const response = await post(
      `${searchApiUrl}/action/composite/v3/search`,
      data
    );
    const res = response?.data;

    return res;
  } catch (error) {
    console.error('Error in ContentSearch:', error);
    throw error;
  }
};

