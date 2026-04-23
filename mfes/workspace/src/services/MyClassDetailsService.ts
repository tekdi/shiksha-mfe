import { Role, Status } from "../utils/app.constant";
import {
  CohortMemberList,
  UpdateCohortMemberStatusParams,
  UserList,
} from "../utils/interfaces";
import { post, put } from "./RestClient";
import API_ENDPOINTS from "../utils/API/APIEndpoints";

const fetchCohortMemberList = async ({
  limit,
  page,
  filters,
}: CohortMemberList): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.cohortMemberList;
  try {
    const requestBody = {
      limit,
      offset: page,
      filters,
      sort: ["name", "asc"],
    };
    console.log("fetchCohortMemberList - API URL:", apiUrl);
    console.log("fetchCohortMemberList - Request body:", requestBody);
    const response = await post(apiUrl, requestBody);
    console.log("fetchCohortMemberList - Response:", response);
    console.log("fetchCohortMemberList - Response status:", response?.status);
    console.log("fetchCohortMemberList - Response data:", response?.data);

    // Check if response is successful
    if (response?.status === 200 && response?.data) {
      // Handle nested response structure: response.data.data.result.userDetails
      // Return the inner data object so components can access response.result.userDetails
      if (response.data.data) {
        return response.data.data;
      }
      return response.data;
    }

    // If response is not successful, throw an error
    throw new Error(`API request failed with status ${response?.status}`);
  } catch (error: any) {
    console.error("error in cohort member list API ", error);
    console.error("API URL was:", apiUrl);
    console.error("Request body was:", {
      limit,
      offset: page,
      filters,
      sort: ["name", "asc"],
    });
    if (error?.response) {
      console.error("Error response:", error.response);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);

      // Handle 404 and 400 errors gracefully - return empty result instead of throwing
      if (error.response?.status === 404) {
        console.warn(
          "Cohort member list not found (404). Returning empty result."
        );
        return {
          result: {
            userDetails: [],
            totalCount: 0,
          },
        };
      }

      // Handle 400 errors (e.g., invalid UUID format)
      if (error.response?.status === 400) {
        const errorMsg =
          error.response?.data?.params?.errmsg ||
          error.response?.data?.params?.err ||
          "Bad Request";
        console.warn(
          `Cohort member list bad request (400): ${errorMsg}. Returning empty result.`
        );
        return {
          result: {
            userDetails: [],
            totalCount: 0,
          },
        };
      }
    }
    throw error;
  }
};

export const getMyUserList = async ({
  limit,
  page,
  filters,
  fields,
}: UserList): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.userList;
  try {
    const response = await post(apiUrl, {
      limit,
      offset: page,
      filters,
      fields,
    });
    return response?.data;
  } catch (error) {
    console.error("error in cohort member list API ", error);
    // throw error;
  }
};

export const getMyCohortMemberList = async ({
  limit,
  page,
  filters,
  includeArchived = false,
}: CohortMemberList & { includeArchived?: boolean }): Promise<any> => {
  const statusFilters = [Status.DROPOUT, Status.ACTIVE];
  if (includeArchived) {
    statusFilters.push(Status.ARCHIVED);
  }

  const studentFilters = {
    // role: Role.STUDENT,
    status: statusFilters,
    ...filters,
  };
  return fetchCohortMemberList({ limit, page, filters: studentFilters });
};

export const getMyCohortFacilitatorList = async ({
  limit,
  page,
  filters,
}: CohortMemberList): Promise<any> => {
  const studentFilters = {
    ...filters,
    role: Role.TEACHER,
    status: [Status.DROPOUT, Status.ACTIVE],
  };
  return fetchCohortMemberList({ limit, page, filters: studentFilters });
};

export const getFacilitatorList = async ({
  limit,
  page,
  filters,
}: CohortMemberList): Promise<any> => {
  return fetchCohortMemberList({ limit, page, filters });
};

export const updateCohortMemberStatus = async ({
  memberStatus,
  statusReason,
  membershipId,
  dynamicBody = {},
}: UpdateCohortMemberStatusParams): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.cohortMemberUpdate(membershipId);

  // Utility to stringify only the values of the customFields
  const prepareCustomFields = (customFields: any[]): any[] => {
    return customFields.map((field) => {
      if (field && field.value !== undefined) {
        return {
          ...field,
          value:
            typeof field.value === "object"
              ? JSON.stringify(field.value)
              : field.value,
        };
      }
      return field;
    });
  };

  // Build the request body dynamically
  const requestBody = {
    ...(memberStatus && { status: memberStatus }),
    ...(statusReason && { statusReason }),
    ...Object.entries(dynamicBody).reduce((acc, [key, value]) => {
      acc[key] =
        typeof value === "object" && value !== null
          ? JSON.stringify(value)
          : value;
      return acc;
    }, {} as Record<string, any>),
    // Only stringify the `value` field of customFields if needed
    ...(dynamicBody?.customFields && {
      customFields: prepareCustomFields(dynamicBody.customFields),
    }),
  };

  try {
    const response = await put(apiUrl, requestBody);
    return response?.data;
  } catch (error) {
    console.error("error in attendance report api ", error);
    // throw error;
  }
};