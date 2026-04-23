//@ts-nocheck
import { sendCredentialService } from '../services/NotificationService';
import { TelemetryEventType } from '../utils/app.constant';
import { firstLetterInUpperCase, getUserFullName } from '../utils/Helper';
import { telemetryFactory } from '../utils/telemetry';
import axios from 'axios';
import { debounce } from 'lodash';
import { showToastMessage } from '../components/Toastify';

export const debouncedGetList = debounce(
  async (data, setResponse, getListApiCall) => {
    const resp = await getListApiCall(data);
    console.log('Debounced API Call:', resp);
    // console.log('totalCount', result?.totalCount);
    // console.log('userDetails', result?.getUserDetails);
    setResponse({ result: resp });
  },
  300
);

export const fetchForm = async (readForm: any) => {
  let data = JSON.stringify({
    readForm: readForm,
  });

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: '/api/dynamic-form/get-rjsf-form',
    headers: {
      'Content-Type': 'application/json',
    },
    data: data,
  };

  let responseForm = null;
  await axios
    .request(config)
    .then((response) => {
      // console.log(JSON.stringify(response.data));
      if (response.data?.schema && response.data?.uiSchema) {
        // console.log(`schema`, response.data?.schema);
        responseForm = response.data;
      }
    })
    .catch((error) => {
      console.log(error);
    });
  return responseForm;
};

export const searchListData = async (
  formData: any,
  newPage: any,
  staticFilter: any,
  pageLimit: any,
  setPageOffset: any,
  setCurrentPage: any,
  setResponse: any,
  getListApiCall: any,
  staticSort: any
) => {
  const { sortBy, ...restFormData } = formData;

  const filters = {
    ...staticFilter,
    // status: [Status.ACTIVE],
    ...Object.entries(restFormData).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== '') {
        if (key === 'status') {
          acc[key] = [value];
        } else {
          acc[key] = value;
        }
      }

      return acc;
    }, {} as Record<string, any>),
  };

  const sort = staticSort;
  let limit = pageLimit;
  let offset = newPage * limit;
  let pageNumber = newPage;

  setPageOffset(offset);
  setCurrentPage(pageNumber);
  setResponse(null);

  const data = {
    limit,
    offset,
    sort,
    filters,
  };

  if (filters.firstName) {
    debouncedGetList(data, setResponse, getListApiCall);
  } else {
    const resp = await getListApiCall(data);
    // console.log('totalCount', result?.totalCount);
    // console.log('userDetails', result?.getUserDetails);
    setResponse({ result: resp });
    console.log('Immediate API Call:', resp);
  }
};
export const extractMatchingKeys = (row: any, schema: any) => {
  let result: Record<string, any> = {};

  const getValue = (type: string, selectedValues: any) => {
    if (
      type === 'array' &&
      Array.isArray(selectedValues) &&
      selectedValues.length > 0
    ) {
      if (typeof selectedValues[0] === 'object') {
        return selectedValues.map((item) => item.id.toString() ?? item); // handles missing `id`
      } else {
        return selectedValues;
      }
    } else if (
      type === 'string' &&
      Array.isArray(selectedValues) &&
      selectedValues.length > 0
    ) {
      if (typeof selectedValues[0] === 'object') {
        return selectedValues[0].id.toString() ?? selectedValues[0];
      } else {
        return selectedValues[0];
      }
    } else if (type === 'array' && typeof selectedValues === 'string') {
      return [selectedValues];
    } else if (type === 'string' && typeof selectedValues === 'string') {
      return selectedValues;
    }
    return null;
  };

  for (const [key, schemaField] of Object.entries(schema.properties)) {
    if (schemaField.coreField === 1) {
      // Core fields (like name) directly from row
      //core field bug fix for null value must be string in middlename
      if (row[key]) {
        result[key] = row[key];
      }
    } else if (schemaField.fieldId) {
      const matchedField = row.customFields?.find(
        (field) => field.fieldId === schemaField.fieldId
      );

      if (matchedField) {
        const value = getValue(schemaField.type, matchedField.selectedValues);
        if (value !== null) {
          result[key] = value;
        }
      }
    }
  }

  return result;
};

// Add Edit Functions

export const splitUserData = (payload: any) => {
  const { customFields, ...userData } = payload;
  return { userData, customFields };
};

export const telemetryCallbacks = (id: any) => {
  const windowUrl = window.location.pathname;
  const cleanedUrl = windowUrl.replace(/^\//, '');
  const env = cleanedUrl.split('/')[0];

  const telemetryInteract = {
    context: {
      env: env,
      cdata: [],
    },
    edata: {
      id: id,
      type: TelemetryEventType.CLICK,
      subtype: '',
      pageid: cleanedUrl,
    },
  };

  telemetryFactory.interact(telemetryInteract);
};

export const notificationCallback = async (
  messageKey: any,
  context: any,
  key: any,
  payload: any,
  t: any,
  successMessageKey: any,
  type: any
) => {
  const isQueue = false;

  let creatorName;

  if (typeof window !== 'undefined' && window.localStorage) {
    creatorName = getUserFullName();
  }
  let replacements: { [key: string]: string };
  replacements = {};
  let cleanedUrl = '';
  if (process.env.NEXT_PUBLIC_TEACHER_SBPLAYER) {
    cleanedUrl = process.env.NEXT_PUBLIC_TEACHER_SBPLAYER.replace(
      /\/sbplayer$/,
      ''
    );
  }
  if (creatorName) {
    if (type == 'learner') {
      let sentName = JSON.parse(localStorage.getItem('userData'))?.firstName;
      replacements = {
        '{FirstName}': sentName,
        '{UserName}': payload?.username,
        '{Password}': payload?.password,
        '{LearnerName}': `${firstLetterInUpperCase(
          payload?.firstName
        )} ${firstLetterInUpperCase(payload?.lastName)}`,
      };
    } else {
      replacements = {
        '{FirstName}': firstLetterInUpperCase(payload?.firstName),
        '{UserName}': payload?.username,
        '{Password}': payload?.password,
        '{appUrl}': cleanedUrl || '', //TODO: check url
      };
    }
  }

  let sentEmail = payload?.email;
  //learner tst
  if (type == 'learner') {
    try {
      sentEmail = JSON.parse(localStorage.getItem('userData'))?.email;
    } catch (e) {}
  }

  const sendTo = {
    receipients: [sentEmail],
  };
  if (Object.keys(replacements).length !== 0 && sendTo) {
    const response = await sendCredentialService({
      isQueue,
      context,
      key,
      replacements,
      email: sendTo,
    });

    if (response?.result[0]?.data[0]?.status === 'success') {
      showToastMessage(t(messageKey), 'success');
    } else {
      showToastMessage(t(successMessageKey), 'success');
    }
  } else {
    showToastMessage(t('COMMON.SOMETHING_WENT_WRONG'), 'error');
  }
};
