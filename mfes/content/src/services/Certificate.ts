/* eslint-disable no-debugger */
import { post } from '@shared-lib';
import axios from 'axios';

export const getUserCertificateStatus = async ({
  userId,
  courseId,
}: {
  userId: string;
  courseId: string;
}) => {
  const response = await post(
    `${process.env.NEXT_PUBLIC_MIDDLEWARE_URL}/tracking/user_certificate/status/get`,
    {
      userId,
      courseId,
    },
    {
      tenantId: localStorage.getItem('tenantId') || '',
      Authorization: `Bearer ${localStorage.getItem('accToken') || ''}`,
    }
  );
  return response?.data ?? {};
};

export const createUserCertificateStatus = async ({
  userId,
  courseId,
}: {
  userId: string;
  courseId: string;
}) => {
  const response = await post(
    `${process.env.NEXT_PUBLIC_MIDDLEWARE_URL}/tracking/user_certificate/status/create`,
    {
      userId,
      courseId,
    },
    {
      tenantId: localStorage.getItem('tenantId') || '',
      Authorization: `Bearer ${localStorage.getItem('accToken') || ''}`,
    }
  );
  return response?.data ?? {};
};

export const getUserCertificates = async ({
  userId,
  courseId,
  limit = 2,
  offset = 0,
}: {
  userId: string;
  courseId?: any[];
  limit?: number;
  offset?: number;
}): Promise<any> => {
  try {
    // Ensure the environment variable is defined
    const searchApiUrl = process.env.NEXT_PUBLIC_MIDDLEWARE_URL;
    if (!searchApiUrl) {
      throw new Error('Search API URL environment variable is not configured');
    }
    // Axios request configuration
    const data = {
      filters: {
        userId: [userId],
        courseId,
      },
      limit,
      offset,
    };

    // Execute the request
    const response = await post(
      `${searchApiUrl}/tracking/user_certificate/status/search`,
      data
    );
    const res = response?.data;

    return res;
  } catch (error) {
    console.error('Error in getUserCertificates:', error);
    throw error;
  }
};

export const issueCertificate = async (reqBody: any) => {
  const apiUrl = `${process.env.NEXT_PUBLIC_MIDDLEWARE_URL}/tracking/certificate/issue`;
  try {
    const response = await post(apiUrl, reqBody);
    return response?.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
