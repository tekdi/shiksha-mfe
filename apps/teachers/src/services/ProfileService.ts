import axios from 'axios';
import { get, patch } from '@shared-lib';
import API_ENDPOINTS from '@/utils/API/APIEndpoints';

export const getUserId = async (): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.userAuth;

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authorization token not found');
    }

    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response?.data?.result;
  } catch (error) {
    console.error('Error in fetching user details', error);
    throw error;
  }
};

export const editEditUser = async (
  userId: string | string[],
  userDetails?: object
): Promise<any> => {
  const apiUrl: string =  API_ENDPOINTS.userUpdate(userId);
  try {
    const response = await patch(apiUrl, userDetails);
    return response?.data;
  } catch (error) {
    console.error('error in fetching user details', error);
    throw error;
  }
};

export const getUserDetails = async (
  userId: string | string[],
  fieldValue?: boolean
): Promise<any> => {
  let apiUrl: string = API_ENDPOINTS.userRead(userId)
  apiUrl = fieldValue ? `${apiUrl}?fieldvalue=true` : apiUrl;

  try {
    const response = await get(apiUrl);
    return response?.data;
  } catch (error) {
    console.error('error in fetching user details', error);
    return error;
  }
};
