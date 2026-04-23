import { post } from './RestClient';
import { API_ENDPOINTS } from './EndUrls';

export const getAcademicYear = async (tenantId?: string): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.academicYearsList;
  try {
    const headers: Record<string, string> = {};
    
    if (tenantId) {
      headers['tenantid'] = tenantId;
    }

    const response = await post(apiUrl, {}, headers);
    return response?.data?.result;
  } catch (error) {
    console.error('error in getting academicYearId', error);
    throw error;
  }
};
