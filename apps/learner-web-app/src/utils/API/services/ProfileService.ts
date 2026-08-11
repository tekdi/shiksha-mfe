"use client";

import axios from "axios";
import { get, patch, post } from "../RestClient";
import { API_ENDPOINTS } from "../EndUrls";

export const getUserId = async (): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.userAuth;

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authorization token not found");
    }

    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response?.data?.result;
  } catch (error) {
    console.error("Error in fetching user details", error);
    throw error;
  }
};

export const editEditUser = async (
  userId: string | string[],
  userDetails?: object
): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.userUpdate(userId as string);
  try {
    const response = await patch(apiUrl, { userData: userDetails });
    return response?.data;
  } catch (error) {
    console.error("error in fetching user details", error);
    throw error;
  }
};

export const getUserDetails = async (
  userId: string | string[],
  fieldValue?: boolean
): Promise<any> => {
  let apiUrl: string = API_ENDPOINTS.userRead(userId, fieldValue ?? false);

  try {
    const response = await get(apiUrl);
    return response?.data;
  } catch (error) {
    console.error("error in fetching user details", error);
    return error;
  }
};

/**
 * Get a presigned URL for uploading a file (e.g. profile photo).
 * API: GET /user/presigned-url?filename=...&foldername=...&fileType=...
 */
export const getPresignedUrl = async (
  filename: string,
  foldername: string,
  fileType: string
): Promise<{ url: string; filePath: string }> => {
  const params = new URLSearchParams({ filename, foldername, fileType });
  const apiUrl = `${API_ENDPOINTS.presignedUrl}?${params.toString()}`;

  try {
    const response = await get(apiUrl);
    const data = response?.data?.result || response?.data;
    return {
      url: data?.url || data?.signedUrl || data?.presignedUrl || '',
      filePath: data?.filePath || data?.fileUrl || data?.path || '',
    };
  } catch (error) {
    console.error('Error getting presigned URL:', error);
    throw error;
  }
};

/**
 * Uploads a profile photo using the Sunbird API flow:
 * 1. Create content identifier
 * 2. Get presigned upload URL
 * 3. Upload file to cloud storage
 * 4. Update user profile with image URL
 */
export const uploadProfilePhoto = async (
  userId: string,
  file: File
): Promise<string> => {
  try {
    const channelIdFromStorage = localStorage.getItem('channelId') || process.env.NEXT_PUBLIC_CHANNEL_ID || 'atree-channel';
    const frameworkId = process.env.NEXT_PUBLIC_FRAMEWORK_ID || 'shiksha-fw';
    const userName = localStorage.getItem('firstName') || localStorage.getItem('name') || 'User';
    const headers = {
      'X-Channel-Id': channelIdFromStorage
    };

    // Step 1: Create Content
    const createPayload = {
      request: {
        content: {
          name: file.name,
          code: `${Date.now()}-${file.name}`,
          mimeType: file.type || 'image/png',
          createdBy: userId,
          createdFor: [channelIdFromStorage],
          contentType: "Resource",
          resourceType: "Learn",
          creator: userName,
          framework: frameworkId,
          organisation: [channelIdFromStorage],
          primaryCategory: "Learning Resource"
        }
      }
    };

    const createResponse = await post(API_ENDPOINTS.contentCreateSunbird, createPayload, headers);
    const identifier = createResponse?.data?.result?.identifier;

    if (!identifier) {
      throw new Error('Failed to create content identifier');
    }

    // Step 2: Get Pre-signed URL
    const uploadUrlPayload = {
      request: {
        content: {
          fileName: file.name
        }
      }
    };

    const uploadUrlResponse = await post(API_ENDPOINTS.contentUploadUrlSunbird(identifier), uploadUrlPayload, headers);
    const preSignedUrl = uploadUrlResponse?.data?.result?.pre_signed_url;

    if (!preSignedUrl) {
      throw new Error('Failed to get pre-signed URL');
    }

    // Step 3: Upload File to Pre-signed URL
    // Use a fresh axios call without interceptors for S3 upload
    await axios.put(preSignedUrl, file, {
      headers: {
        'Content-Type': file.type || 'image/png'
      }
    });

    const imageUrl = preSignedUrl.split('?')[0];

    // Step 4: Update user profile
    await editEditUser(userId, { name: imageUrl });

    return imageUrl;
  } catch (error) {
    console.error('Error in uploadProfilePhoto:', error);
    throw error;
  }
};
