import axios from 'axios';
import { get, patch } from '@shared-lib';
import API_ENDPOINTS from '@/utils/API/APIEndpoints';

const handleApiCall = async (call: () => Promise<any>, errorMessage: string): Promise<any> => {
  try {
    const response = await call();
    return response?.data?.result ?? response?.data;
  } catch (error) {
    console.error(errorMessage, error);
    throw error;
  }
};

export const getUserId = async (): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.userAuth;
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Authorization token not found');

  return handleApiCall(
    () => axios.get(apiUrl, { headers: { Authorization: `Bearer ${token}` } }),
    'Error in fetching user details'
  );
};

export const editEditUser = async (
  userId: string | string[],
  userDetails?: object
): Promise<any> => {
  return handleApiCall(
    () => patch(API_ENDPOINTS.userUpdate(userId), userDetails),
    'error in fetching user details'
  );
};

export const getUserDetails = async (
  userId: string | string[],
  fieldValue?: boolean
): Promise<any> => {
  let apiUrl: string = API_ENDPOINTS.userRead(userId);
  if (fieldValue) apiUrl = `${apiUrl}?fieldvalue=true`;

  return handleApiCall(
    () => get(apiUrl),
    'error in fetching user details'
  );
};
