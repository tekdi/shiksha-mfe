/* eslint-disable @nx/enforce-module-boundaries */
import API_ENDPOINTS from '@/utils/API/APIEndpoints';
import { post } from './RestClient';

export interface ContentStatus {
  userId: string[];
  courseId: string[];
  unitId: string[];
  contentId: string[];
}

export interface ContentCreate {
  userId: string;
  contentId: string;
  courseId: string;
  unitId: string;
  contentType: string;
  contentMime: string;
  lastAccessOn: string;
  detailsObject: any[];
}

export const getContentTrackingStatus = async (reqBody: ContentStatus) => {
  const apiUrl: string = API_ENDPOINTS.contentSearchStatus
  try {
    const response = await post(apiUrl, reqBody);
    return response?.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const createContentTracking = async (reqBody: ContentCreate) => {
  const apiUrl: string = API_ENDPOINTS.contentCreate
  try {
    // Get tenantId from localStorage
    const tenantId = localStorage.getItem("tenantId");
    
    // Prepare headers with tenantId
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(tenantId && { "tenantId": tenantId }),
    };
    
    
    const response = await post(apiUrl, reqBody, headers);
    return response?.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
