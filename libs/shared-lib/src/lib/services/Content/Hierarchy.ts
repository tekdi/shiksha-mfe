import axios, { AxiosRequestConfig } from 'axios';
interface ContentSearchResponse {
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
const data = {
  request: {
    filters: {},
  },
};

export const hierarchyAPI = async (): Promise<ContentSearchResponse[]> => {
  try {
    // Ensure the environment variable is defined
    const searchApiUrl = import.meta.env.VITE_PUBLIC_SSUNBIRD_BASE_URL;
    if (!searchApiUrl) {
      throw new Error('Search API URL environment variable is not configured');
    }
    // Axios request configuration
    const config: AxiosRequestConfig = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${searchApiUrl}/api/content/v1/search`,
      data: data,
    };

    // Execute the request
    const response = await axios.request(config);
    const res = response?.data?.result?.content;

    return res;
  } catch (error) {
    console.error('Error in ContentSearch:', error);
    throw error;
  }
};
