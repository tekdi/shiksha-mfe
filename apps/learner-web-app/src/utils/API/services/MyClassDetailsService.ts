"use client";

import {
  CohortMemberList,
  UpdateCohortMemberStatusParams,
  UserList,
} from "@learner/utils/attendance/interfaces";
import { Status } from "@learner/utils/attendance/constants";
import { post, put } from "../RestClient";
import { API_ENDPOINTS } from "../EndUrls";


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

    const response = await post(apiUrl, requestBody);

    if (response?.status === 200 && response?.data) {
      const data = response.data.data || response.data;

      // ⭐ FILTER ROLES (Teacher, Student, Learner) IN BOTH POSSIBLE API FORMATS

      // Case 1: API returns -> data.result.userDetails
      if (Array.isArray(data?.result?.userDetails)) {
        data.result.userDetails = data.result.userDetails.filter((user: any) => {
          const role = user.role?.toLowerCase();
          return !["teacher", "learner"].includes(role);
        });
      }

      // Case 2: API returns -> data.userDetails directly
      if (Array.isArray(data?.userDetails)) {
        data.userDetails = data.userDetails.filter((user: any) => {
          const role = user.role?.toLowerCase();
          return !["teacher", "learner"].includes(role);
        });
      }

      return data;
    }

    throw new Error(`API request failed with status ${response?.status}`);
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.response?.status === 400) {
      return {
        result: {
          userDetails: [],
          totalCount: 0,
        },
      };
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
  const facilitatorFilters = {
    ...filters,
    status: [Status.DROPOUT, Status.ACTIVE],
  };
  return fetchCohortMemberList({ limit, page, filters: facilitatorFilters });
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
    ...(dynamicBody?.customFields && {
      customFields: prepareCustomFields(dynamicBody.customFields),
    }),
  };

  try {
    const response = await put(apiUrl, requestBody);
    return response?.data;
  } catch (error) {
    console.error("error in attendance report api ", error);
  }
};

