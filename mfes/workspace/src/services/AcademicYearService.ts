import API_ENDPOINTS from '../utils/API/APIEndpoints';
import { post } from './RestClient';

export const getAcademicYear = async (): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.academicYearsList
  try {
    const response = await post(apiUrl,{});
    return response?.data?.result;
  } catch (error) {
    console.error('error in getting academicYearId', error);
  }
};