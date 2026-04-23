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

  // Validate inputs
  if (!credentialId || !templateId) {
    throw new Error(
      "Missing required parameters: credentialId and templateId are required"
    );
  }

  console.log("Download certificate request:", {
    apiUrl,
    credentialId,
    templateId,
    baseUrl: process.env.NEXT_PUBLIC_MIDDLEWARE_URL,
    fullUrl: `${process.env.NEXT_PUBLIC_MIDDLEWARE_URL}/tracking/certificate/render-PDF`,
  });

  try {
    // Log the request configuration
    console.log("Request configuration:", {
      url: apiUrl,
      method: "POST",
      data: { credentialId, templateId },
      responseType: "blob",
    });

    // Try different request body formats
    const requestBody = { credentialId, templateId };
    console.log("Request body:", requestBody);

    // Also try alternative request body format
    const alternativeRequestBody = {
      request: {
        credentialId,
        templateId,
      },
    };
    console.log("Alternative request body:", alternativeRequestBody);

    let response: AxiosResponse<Blob>;

    try {
      // Try with the standard request body format
      response = await axiosInstance.post(apiUrl, requestBody, {
        responseType: "blob", // Ensures we get a binary file
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (firstError) {
      console.log(
        "First attempt failed, trying alternative request body format"
      );

      // Try with alternative request body format
      response = await axiosInstance.post(apiUrl, alternativeRequestBody, {
        responseType: "blob", // Ensures we get a binary file
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    console.log("Download certificate response:", {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      dataSize: response.data?.size,
    });

    if (!response.data) {
      throw new Error("Empty response from API");
    }

    return response.data; // Return only the Blob data
  } catch (error: any) {
    console.error("Error in getting render certificate:", error);
    console.error("Error details:", {
      message: error?.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: error?.response?.data,
      config: error?.config,
      url: error?.config?.url,
      method: error?.config?.method,
      headers: error?.config?.headers,
    });

    // Log the full error response for debugging
    if (error?.response) {
      console.error("Full error response:", error.response);
    }
    throw error;
  }
};
