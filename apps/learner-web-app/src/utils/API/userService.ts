import { fetchForm } from "@shared-lib-v2/DynamicForm/components/DynamicFormCallback";
import { API_ENDPOINTS } from "./EndUrls";
import { post, patch } from "./RestClient";
import { FormContext } from "@shared-lib-v2/DynamicForm/components/DynamicFormConstant";
import { getMissingFields, isUnderEighteen } from "../helper";
import { get } from "@shared-lib";
export interface UserDetailParam {
  userData?: object;

  customFields?: any;
}
interface UserCheckParams {
  username?: string;
  mobile?: string;
  email?: string;
  firstName?: string;
}

export const userCheck = async ({
  mobile,
  email,
  firstName,
  username,
}: UserCheckParams): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.userCheck;

  try {
    let response;
    // if (username) {
    //   response = await post(apiUrl, { username });
    // }
    if (email) {
      response = await post(apiUrl, { email });
    } else if (mobile && firstName) {
      response = await post(apiUrl, { mobile, email, firstName });
    } else if (username) {
      response = await post(apiUrl, { username });
    }

    return response?.data;
  } catch (error) {
    console.error("error in login", error);
    throw error;
  }
};
export function extractCustomFieldValue(field: any): string | null {
  if (!field) return null;

  if (Array.isArray(field.selectedValues) && field.selectedValues.length > 0) {
    const item = field.selectedValues[0];
    if (typeof item === 'string') return item;
    if (typeof item === 'number') return String(item);
    if (typeof item === 'object' && item !== null) {
      return item.value || item.id || item.label || null;
    }
  }

  if (Array.isArray(field.value) && field.value.length > 0) {
    const item = field.value[0];
    if (typeof item === 'string') return item;
    if (typeof item === 'number') return String(item);
    if (typeof item === 'object' && item !== null) {
      return item.value || item.id || item.label || null;
    }
  } else if (typeof field.value === 'string' || typeof field.value === 'number') {
    return String(field.value);
  }

  return null;
}

export function getCustomFieldValueByLabel(fields: any[], labels: string[]): string | null {
  if (!fields || !Array.isArray(fields)) return null;
  const lowerLabels = labels.map((l) => l.toLowerCase());
  const field = fields.find(
    (f: any) =>
      labels.includes(f.label) ||
      labels.includes(f.fieldId) ||
      labels.includes(f.name) ||
      labels.includes(f.title) ||
      (f.label && lowerLabels.includes(f.label.toLowerCase())) ||
      (f.fieldId && lowerLabels.includes(f.fieldId.toLowerCase())) ||
      (f.name && lowerLabels.includes(f.name.toLowerCase())) ||
      (f.title && lowerLabels.includes(f.title.toLowerCase()))
  );
  return extractCustomFieldValue(field);
}

export function getCustomFieldIdByLabel(fields: any[], labels: string[]): string | null {
  if (!fields || !Array.isArray(fields)) return null;
  const lowerLabels = labels.map((l) => l.toLowerCase());
  const field = fields.find(
    (f: any) =>
      labels.includes(f.label) ||
      labels.includes(f.fieldId) ||
      labels.includes(f.name) ||
      labels.includes(f.title) ||
      (f.label && lowerLabels.includes(f.label.toLowerCase())) ||
      (f.fieldId && lowerLabels.includes(f.fieldId.toLowerCase())) ||
      (f.name && lowerLabels.includes(f.name.toLowerCase())) ||
      (f.title && lowerLabels.includes(f.title.toLowerCase()))
  );
  return field?.fieldId || null;
}

export function setLocalStorageFromCustomFields(fields: any) {
  if (!fields || !Array.isArray(fields)) return;

  const getFieldId = (labelKey: any) => {
    const field = fields?.find?.((f: any) => f.label === labelKey || f.name === labelKey);
    return field?.selectedValues?.[0]?.id ?? null;
  };
  const getFieldLabel = (labelKey: any) => {
    const field = fields?.find?.((f: any) => f.label === labelKey || f.name === labelKey);
    return extractCustomFieldValue(field);
  };

  const stateId = getFieldId("STATE");
  const stateName = getFieldLabel("STATE");
  const districtId = getFieldId("DISTRICT");
  const blockId = getFieldId("BLOCK");

  if (stateId) {
    localStorage.setItem("mfe_state", String(stateId));
    localStorage.setItem("stateId", String(stateId));
  }
  if (districtId) localStorage.setItem("mfe_district", String(districtId));
  if (stateName) localStorage.setItem("stateName", stateName);
  if (blockId) localStorage.setItem("mfe_block", String(blockId));
  localStorage.setItem("roleName", "Learner");

  const langField = fields?.find?.(
    (f: any) =>
      f.label === "LANGUAGE" ||
      f.label === "language" ||
      f.label === "PREFERRED_LANGUAGE" ||
      f.label === "contentLanguage" ||
      f.label === "CONTENT_LANGUAGE" ||
      f.name === "language" ||
      f.name === "PREFERRED_LANGUAGE" ||
      // f.fieldId === "b8ece495-ac34-4b29-9f97-afe4b64a7512"
      f.fieldId === "b5beb279-cef5-4fe8-aaae-f655c39081d8"
  );

  const extractValues = (valContainer: any): string[] => {
    if (!valContainer) return [];
    if (Array.isArray(valContainer)) {
      return valContainer.map((item: any) => {
        if (typeof item === 'string') return item;
        if (typeof item === 'number') return String(item);
        if (typeof item === 'object' && item !== null) {
          return item.value || item.id || item.label || null;
        }
        return null;
      }).filter(Boolean);
    }
    if (typeof valContainer === 'string') return [valContainer];
    if (typeof valContainer === 'number') return [String(valContainer)];
    if (typeof valContainer === 'object' && valContainer !== null) {
      const v = valContainer.value || valContainer.id || valContainer.label;
      return v ? [String(v)] : [];
    }
    return [];
  };

  const selectedVals = extractValues(langField?.selectedValues);
  const rawValues = extractValues(langField?.value);
  const preferredLanguage = getCustomFieldValueByLabel(fields, ["language", "PREFERRED_LANGUAGE", "LANGUAGE"]);
  const contentLanguage = getCustomFieldValueByLabel(fields, ["contentLanguage", "CONTENT_LANGUAGE", "content_language"]);

  const allVals = Array.from(new Set([...selectedVals, ...rawValues, preferredLanguage, contentLanguage].filter(Boolean)));

  let siteLangCode: string | null = null;
  let courseLangName: string | null = null;

  for (const val of allVals) {
    const norm = String(val).trim().toLowerCase();
    if (['en', 'hi', 'mr'].includes(norm)) {
      siteLangCode = norm;
    } else if (norm === 'english' || norm === 'en-in') {
      courseLangName = 'English';
    } else if (norm === 'hindi' || norm === 'hi-in') {
      courseLangName = 'Hindi';
    } else if (norm === 'marathi' || norm === 'mr-in') {
      courseLangName = 'Marathi';
    } else if (val && typeof val === 'string' && val.length > 2) {
      courseLangName = val.charAt(0).toUpperCase() + val.slice(1);
    }
  }

  if (siteLangCode) {
    localStorage.setItem("lang", siteLangCode);
  }

  if (courseLangName) {
    localStorage.setItem("swadhaarLanguage", courseLangName);
    localStorage.setItem("contentLanguage", courseLangName);
  }
}

export const profileComplitionCheck = async (): Promise<any> => {
  const userId = localStorage.getItem("userId");
  try {
    if (userId) {
      const apiUrl = API_ENDPOINTS.userRead(userId, true);
      const response = await get(apiUrl, {
        tenantId: localStorage.getItem("tenantId"),
      });
      const userData = response?.data?.result?.userData;
      const isVolunteerField = userData?.customFields?.find(
        (field: any) => field.label === "IS_VOLUNTEER"
      );
      console.log(isVolunteerField);
      const isVolunteer = isVolunteerField?.selectedValues?.[0] === "yes";
      localStorage.setItem("isVolunteer", JSON.stringify(isVolunteer));

      setLocalStorageFromCustomFields(userData?.customFields);

      const responseForm: any = await fetchForm([
        {
          fetchUrl: `${process.env.NEXT_PUBLIC_MIDDLEWARE_URL}/form/read?context=${FormContext.learner.context}&contextType=${FormContext.learner.contextType}`,
          header: {},
        },
        {
          fetchUrl: `${process.env.NEXT_PUBLIC_MIDDLEWARE_URL}/form/read?context=${FormContext.volunteer.context}&contextType=${FormContext.volunteer.contextType}`,
          header: {},
        },
      ]);

      if (userData && responseForm) {
        if (userData?.dob) {
          userData.isUnderEighteen = isUnderEighteen(userData.dob);
        }
        const schema = isVolunteer
          ? responseForm[1]?.schema
          : responseForm[0]?.schema;

        if (isVolunteer) {
          delete schema?.properties?.dob;
        } else {
          delete schema?.properties?.mobile;
        }
        const result = getMissingFields(schema, userData);
        console.log("result", result);
        delete result?.properties?.is_volunteer;

        const isPropertiesEmpty =
          Object.keys(result?.properties || {}).length === 0;
        return isPropertiesEmpty;
      } else {
        console.warn("profileComplitionCheck: userData or schema is missing");
        return false;
      }
    }
    return false;
  } catch (error) {
    console.error("error in login", error);
    throw error;
  }
};

export const updateUser = async (
  userId: string,
  { userData, customFields }: UserDetailParam
): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.userUpdate(userId);

  try {
    const response = await patch(apiUrl, { userData, customFields });
    return response;
  } catch (error) {
    console.error("error in fetching user details", error);
    return error;
  }
};

export const updateContentLanguageInProfile = async (languageInput: string) => {
  try {
    const userId = localStorage.getItem("userId");
    if (userId) {
      let contentLangName = languageInput;

      const inputNorm = (languageInput || "").trim().toLowerCase();
      if (["english", "en"].includes(inputNorm)) {
        contentLangName = "English";
      } else if (["hindi", "hi"].includes(inputNorm)) {
        contentLangName = "Hindi";
      } else if (["marathi", "mr"].includes(inputNorm)) {
        contentLangName = "Marathi";
      } else if (languageInput && languageInput.trim()) {
        const trimmed = languageInput.trim();
        contentLangName = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
      }

      localStorage.setItem("swadhaarLanguage", contentLangName);
      localStorage.setItem("contentLanguage", contentLangName);

      // let langFieldId = "b8ece495-ac34-4b29-9f97-afe4b64a7512";
      let langFieldId = "b5beb279-cef5-4fe8-aaae-f655c39081d8"
      try {
        const userRes = await getUserDetails(userId, true);
        const existingFields = userRes?.result?.userData?.customFields || [];
        let foundLangId = getCustomFieldIdByLabel(existingFields, ["language", "PREFERRED_LANGUAGE", "LANGUAGE"]);
        if (foundLangId) langFieldId = foundLangId;
      } catch (err) {
        console.warn("Could not fetch user customFields prior to update", err);
      }

      const currentSiteLang = localStorage.getItem("lang") || "en";

      const customFieldsUpdate: any[] = [
        {
          fieldId: langFieldId,
          value: [currentSiteLang, contentLangName],
          selectedValues: [currentSiteLang, contentLangName]
        }
      ];

      await updateUser(userId, {
        userData: {},
        customFields: customFieldsUpdate
      });
    }
  } catch (error) {
    console.error("Failed to update content language in profile", error);
  }
};

export const updateWebsiteLanguageInProfile = async (languageInput: string) => {
  try {
    const userId = localStorage.getItem("userId");
    if (userId) {
      let langCode = languageInput;

      const inputNorm = (languageInput || "").trim().toLowerCase();
      if (["english", "en"].includes(inputNorm)) {
        langCode = "en";
      } else if (["hindi", "hi"].includes(inputNorm)) {
        langCode = "hi";
      } else if (["marathi", "mr"].includes(inputNorm)) {
        langCode = "mr";
      }

      // Store ONLY website translation language in localStorage
      localStorage.setItem("lang", langCode);

      // Resolve fieldId for language custom field
      // let langFieldId = "b8ece495-ac34-4b29-9f97-afe4b64a7512";
      let langFieldId = "b5beb279-cef5-4fe8-aaae-f655c39081d8"
      try {
        const userRes = await getUserDetails(userId, true);
        const existingFields = userRes?.result?.userData?.customFields || [];
        let foundLangId = getCustomFieldIdByLabel(existingFields, ["language", "PREFERRED_LANGUAGE", "LANGUAGE"]);
        if (foundLangId) langFieldId = foundLangId;
      } catch (err) {
        console.warn("Could not fetch user customFields prior to update", err);
      }

      const currentCourseLang = localStorage.getItem("swadhaarLanguage") || localStorage.getItem("contentLanguage");

      const valuesToSave = [langCode];
      if (currentCourseLang) {
        valuesToSave.push(currentCourseLang);
      }

      const customFieldsUpdate: any[] = [
        {
          fieldId: langFieldId,
          value: valuesToSave
        }
      ];

      await updateUser(userId, {
        userData: {},
        customFields: customFieldsUpdate
      });
    }
  } catch (error) {
    console.error("Failed to update website language in profile", error);
  }
};

export const updateLanguageInProfile = updateWebsiteLanguageInProfile;
export const getUserDetails = async (
  userId: string | string[],
  fieldValue: boolean
): Promise<any> => {
  let apiUrl: string = API_ENDPOINTS.userRead(userId, fieldValue);
  // apiUrl = fieldValue ? `${apiUrl}?fieldvalue=true` : apiUrl;

  try {
    const response = await get(apiUrl);
    return response?.data;
  } catch (error) {
    console.error("error in fetching user details", error);
    return error;
  }
};
export const userNameExist = async (userData: any): Promise<any> => {
  const apiUrl: string = API_ENDPOINTS.suggestUsername;
  try {
    const response = await post(apiUrl, userData);
    return response?.data?.result;
  } catch (error) {
    console.error("error in getting in userNme exist", error);
    throw error;
  }
};

// New function to check user existence using interface API
// Uses domainTenantId from localStorage (set when tenant is loaded based on domain)
// Searches role: "Learner" first, then role: "CFL" if not found.
// Returns user data if found in either role; returns a not-found response if absent in both.
export const checkUserExistenceWithTenant = async (
  identifier: string,
  tenantId?: string
): Promise<any> => {
  const apiUrl: string = `${process.env.NEXT_PUBLIC_BASE_URL}/user/list`;

  // Helper to build request body — always searches by mobile, parameterised by role
  const buildRequestBody = (tenantIdToUse: string, role: "Learner" | "CFL" | "DI") => {
    const filters: any = {
      role,
      tenantId: tenantIdToUse,
      mobile: identifier,
    };

    const requestBody: any = {
      limit: 10,
      filters,
      sort: ["firstName", "asc"],
      offset: 0,
    };

    console.log(`[checkUserExistenceWithTenant] Request filters (role=${role}):`, filters);
    return requestBody;
  };

  // Helper to detect "user not found" style errors
  const isNotFoundError = (error: any) => {
    const status = error?.response?.status;
    const responseCode = error?.response?.data?.responseCode;
    const params = error?.response?.data?.params;
    return (
      status === 404 ||
      responseCode === 404 ||
      params?.status === "failed" ||
      params?.errmsg === "User does not exist"
    );
  };

  // Helper: true when the response contains at least one user record
  const hasUsers = (responseData: any): boolean => {
    const users = responseData?.result?.getUserDetails || [];
    return users.length > 0;
  };

  try {
    // Get domainTenantId from localStorage (set when tenant is loaded based on domain)
    let domainTenantId: string | null = null;
    if (typeof window !== "undefined") {
      domainTenantId = localStorage.getItem("domainTenantId");
    }

    // Priority: localStorage domainTenantId → parameter tenantId
    const tenantIdToUse = domainTenantId || tenantId;

    if (!tenantIdToUse) {
      console.error("No tenantId available for user check. Tenant must be loaded first.");
      throw new Error("Tenant configuration not found. Please refresh the page.");
    }

    const headers: Record<string, string> = {
      tenantid: tenantIdToUse,
      tenantId: tenantIdToUse,
    };

    console.log("[checkUserExistenceWithTenant] Using tenantId:", tenantIdToUse, "for identifier:", identifier);

    // ─────────────────────────────────────────────────────────────────────────
    // 1️⃣  Search with role: "CFL"
    // ─────────────────────────────────────────────────────────────────────────
    try {
      const requestBody = buildRequestBody(tenantIdToUse, "CFL");
      const response = await post(apiUrl, requestBody, headers);
      if (hasUsers(response?.data)) {
        console.log("[checkUserExistenceWithTenant] ✅ User found with role: CFL");
        return response?.data;
      }
      console.warn("[checkUserExistenceWithTenant] No user found with role: CFL — trying Learner…");
    } catch (error) {
      if (!isNotFoundError(error)) {
        // Unexpected error (network, 500, etc.) — surface it immediately
        throw error;
      }
      console.warn("[checkUserExistenceWithTenant] CFL search returned not-found — trying Learner…");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2️⃣  Fallback: search with role: "Learner"
    // ─────────────────────────────────────────────────────────────────────────
    try {
      const requestBody = buildRequestBody(tenantIdToUse, "Learner");
      const response = await post(apiUrl, requestBody, headers);
      if (hasUsers(response?.data)) {
        console.log("[checkUserExistenceWithTenant] ✅ User found with role: Learner");
        return response?.data;
      }
      console.warn("[checkUserExistenceWithTenant] No user found with role: Learner — trying DI…");
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }
      console.warn("[checkUserExistenceWithTenant] Learner search returned not-found — trying DI…");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3️⃣  Fallback: search with role: "DI"
    // ─────────────────────────────────────────────────────────────────────────
    try {
      const requestBody = buildRequestBody(tenantIdToUse, "DI");
      const response = await post(apiUrl, requestBody, headers);
      console.log("[checkUserExistenceWithTenant] DI role search result:", response?.data);
      return response?.data;
    } catch (error) {
      if (isNotFoundError(error)) {
        // None of the roles found — return a standard not-found shape so callers
        // can show "User does not exist" without an uncaught exception.
        return {
          responseCode: 404,
          params: { status: "failed", errmsg: "User does not exist" },
          result: { getUserDetails: [] },
        };
      }
      throw error;
    }

  } catch (error) {
    console.error("error in checking user existence with tenant", error);
    throw error;
  }
};
