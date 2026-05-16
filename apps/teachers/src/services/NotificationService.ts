import { SendCredentialsRequest } from '../utils/Interfaces';
import { post, get } from '@shared-lib';
import { toPascalCase } from '../utils/Helper';
import axios from 'axios';
import API_ENDPOINTS from '@/utils/API/APIEndpoints';

const handleRequest = async (call: () => Promise<any>, errorMessage: string): Promise<any> => {
  try {
    const response = await call();
    return response?.data?.result ?? response?.data;
  } catch (error) {
    console.error(errorMessage, error);
    return error;
  }
};

export const sendCredentialService = async (payload: SendCredentialsRequest): Promise<any> => {
  return handleRequest(
    () => post(API_ENDPOINTS.notificationSend, payload),
    'error in sending mail'
  );
};

export const sendEmailOnFacilitatorCreation = async (
  name: string,
  username: string,
  password: string,
  email: string
) => {
  const replacements = {
    '{FirstName}': toPascalCase(name),
    '{UserName}': username,
    '{Password}': password,
  };

  return sendCredentialService({
    isQueue: false,
    context: 'USER',
    key: 'onFacilitatorCreated',
    replacements,
    email: { receipients: [email] },
  });
};

export const sendEmailOnLearnerCreation = async (
  name: string,
  username: string,
  password: string,
  email: string,
  learnerName: string
) => {
  const replacements = {
    '{FirstName}': toPascalCase(name),
    '{UserName}': username,
    '{Password}': password,
    '{LearnerName}': learnerName,
  };

  return sendCredentialService({
    isQueue: false,
    context: 'USER',
    key: 'onLearnerCreated',
    replacements,
    email: { receipients: [email] },
  });
};

// Push App Notification

export const UpdateDeviceNotification = async (
  userData: { deviceId: string; action: string },
  userId: string,
  headers: { tenantId: any; Authorization: string }
): Promise<any> => {
  const apiUrl = API_ENDPOINTS.userUpdate(userId);
  try {
    const response = await axios.patch(apiUrl, { userData }, { headers });
    return response.data;
  } catch (error) {
    console.error('Error updating device notification:', error);
    throw error;
  }
};

export const readUserId = async (
  userId: string | string[],
  fieldValue?: boolean
): Promise<any> => {
  return handleRequest(
    () => get(API_ENDPOINTS.userRead(userId, false)),
    'error in fetching user details'
  );
};

export const sendNotification = async (payload: SendCredentialsRequest): Promise<any> => {
  return handleRequest(
    () => post(API_ENDPOINTS.notificationSend, payload),
    'Error in sending notification'
  );
};
