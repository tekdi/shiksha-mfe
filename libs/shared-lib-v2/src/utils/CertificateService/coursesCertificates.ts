import axios, { AxiosResponse } from "axios";
import { post } from "../API/RestClient";
import { API_ENDPOINTS } from "../API/EndUrls";
import axiosInstance from "../API/Interceptor";

export interface courseWiseLernerListParam {
  limit?: number;
  offset?: number;
  filters: {
    status?: string[];
  };
}
export interface issueCertificateParam {
  issuanceDate?: string;
  expirationDate?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  userId?: string;
  courseId?: string;
  courseName?: string;
  credentialId?: string;
}
export interface renderCertificateParam {
  credentialId?: string;
  templateId?: string;
}
export const courseWiseLernerList = async ({
  limit,
  offset,
  filters,
}: courseWiseLernerListParam): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.courseWiseLernerList;
  try {
    const response = await post(apiUrl, {
      limit,
      filters,
      offset,
    });
    return response?.data?.result;
  } catch (error) {
    console.error("error in getting user list", error);
    throw error;
  }
};

export const getCourseName = async (courseIds: string[]): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.getCourseName;
  try {
    const headers = {
      "Content-Type": "application/json",
    };
    const data = {
      request: {
        filters: {
          identifier: [...courseIds],
        },
        fields: ["name"],
      },
    };
    const response = await post(apiUrl, data, headers);
    return response?.data?.result;
  } catch (error) {
    console.error("error in getting in course name", error);
    throw error;
  }
};

export const issueCertificate = async (
  payload: issueCertificateParam
): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.issueCertificate;
  try {
    const response = await post(apiUrl, payload);
    return response?.data?.result;
  } catch (error) {
    console.error("error in getting user list", error);
    throw error;
  }
};

export const renderCertificate = async ({
  credentialId,
  templateId,
}: renderCertificateParam): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.renderCertificate;
  try {
    console.log("Render certificate request:", {
      apiUrl,
      credentialId,
      templateId,
      data: { credentialId, templateId },
    });

    const response = await post(apiUrl, { credentialId, templateId });

    console.log("Render certificate response:", {
      status: response?.status,
      hasData: !!response?.data,
      hasResult: !!response?.data?.result,
    });

    return response?.data?.result;
  } catch (error) {
    console.error("error in getting render certificate", error);
    throw error;
  }
};

export const downloadCertificate = async ({
  credentialId,
  templateId,
}: renderCertificateParam): Promise<Blob> => {
  const apiUrl: string = API_ENDPOINTS.downloadCertificate;
  try {
    const response: AxiosResponse<Blob> = await axios.post(
      apiUrl,
      { credentialId, templateId },
      {
        responseType: "blob", // Ensures we get a binary file
        headers: {
          "Accept": "application/pdf",
        },
      }
    );

    if (!response.data) {
      throw new Error("Empty response from API");
    }

    return response.data; // Return only the Blob data
  } catch (error) {
    console.error("Error in getting render certificate:", error);
    throw error;
  }
};
