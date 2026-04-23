import { getLocalStoredUserId } from './LocalStorageService';
import { delApi, get, post } from './RestClient';
import { MIME_TYPE } from '../utils/app.config';
import { v4 as uuidv4 } from 'uuid';
import { PrimaryCategoryValue } from '../utils/app.constant';
// Remove module-level localStorage access to prevent SSR issues
// const userId = getLocalStoredUserId();
// console.log('userId ==>', userId);

export const getPrimaryCategory = async (channelId: string) => {
  console.log('getPrimaryCategory called with channelId:', channelId);

  if (!channelId) {
    console.error('getPrimaryCategory: channelId is empty or undefined');
    throw new Error('Channel ID is required');
  }

  const apiURL = `/action/channel/v1/read/${channelId}`;
  console.log('getPrimaryCategory API URL:', apiURL);

  try {
    const response = await get(apiURL);
    console.log('getPrimaryCategory response:', response?.data);
    return response?.data?.result;
  } catch (error) {
    console.error('getPrimaryCategory error:', error);
    throw error;
  }
};

// const PrimaryCategoryData = async () => {
//   const response = await getPrimaryCategory();
//   const collectionPrimaryCategories =
//     response?.channel?.collectionPrimaryCategories;
//   const contentPrimaryCategories = response?.channel?.contentPrimaryCategories;

//   const PrimaryCategory = [
//     ...collectionPrimaryCategories,
//     ...contentPrimaryCategories,
//   ];
//   return PrimaryCategory;
// };

const getDefaultReqBody = () => ({
  request: {
    filters: {
      createdBy: getLocalStoredUserId(),
    },
    sort_by: {
      lastUpdatedOn: 'desc',
    },
  },
});
const upForReviewReqBody = {
  request: {
    filters: {
      //  createdBy: { userId},
    },
    sort_by: {
      lastUpdatedOn: 'desc',
    },
  },
};
const getReqBodyWithStatus = (
  status: string[],
  query: string,
  limit: number,
  offset: number,
  primaryCategory: string[],
  sort_by: Record<string, string>,
  channel: string,
  contentType?: string,
  state?: string
) => {
  let PrimaryCategory = PrimaryCategoryValue;
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    PrimaryCategory =
      JSON.parse(localStorage.getItem('PrimaryCategory') as string) ||
      PrimaryCategoryValue;
  }
  primaryCategory =
    primaryCategory.length === 0 ? PrimaryCategory : primaryCategory;
  if (contentType === 'discover-contents') {
    if (state) {
      return {
        ...upForReviewReqBody,
        request: {
          ...upForReviewReqBody.request,
          filters: {
            ...upForReviewReqBody.request.filters,
            status,
            primaryCategory,
            createdBy: { '!=': getLocalStoredUserId() },
            state: state,
          },

          query,
          limit,
          offset,
          sort_by,
        },
      };
    }

    return {
      ...upForReviewReqBody,
      request: {
        ...upForReviewReqBody.request,
        filters: {
          ...upForReviewReqBody.request.filters,
          status,
          primaryCategory,
          createdBy: { '!=': getLocalStoredUserId() },
          channel: channel,
        },

        query,
        limit,
        offset,
        sort_by,
      },
    };
  } else if (contentType === 'upReview') {
    return {
      ...upForReviewReqBody,
      request: {
        ...upForReviewReqBody.request,
        filters: {
          ...upForReviewReqBody.request.filters,
          status,
          primaryCategory,
          channel: channel,
        },
        query,
        limit,
        offset,
        sort_by,
      },
    };
  }

  return {
    ...getDefaultReqBody(),
    request: {
      ...getDefaultReqBody().request,
      filters: {
        ...getDefaultReqBody().request.filters,
        status,
        primaryCategory,
        channel: channel,
      },
      query,
      limit,
      offset,
      sort_by,
    },
  };
};

export const getContent = async (
  status: string[],
  query: string,
  limit: number,
  offset: number,
  primaryCategory: string[],
  sort_by: Record<string, string>,
  channel: string,
  contentType?: string,
  state?: string
) => {
  const apiURL = '/action/composite/v3/search';
  const reqBody = getReqBodyWithStatus(
    status,
    query,
    limit,
    offset,
    primaryCategory,
    sort_by,
    channel,
    contentType,
    state
  );
  const response = await post(apiURL, reqBody);
  return response?.data?.result;
};
export const createResourceContent = async (
  userId: string,
  contentType: string,
  channelId: string,
  contentFW: string
) => {
  const apiURL = `/action/content/v3/create`;

  const reqBody = {
    request: {
      content: {
        code: '123456', // Generate a unique ID for 'code'
        name: 'Untitled Resource',
        createdBy: userId,
        createdFor: [channelId],
        mimeType: MIME_TYPE.ECML_MIME_TYPE,
        resourceType: 'Learn',
        contentType: contentType,
        framework: contentFW,
        ...(contentType !== 'SelfAssess' && {
          primaryCategory: 'Learning Resource',
        }),
      },
    },
  };

  try {
    const response = await post(apiURL, reqBody);
    return response?.data;
  } catch (error) {
    console.error('Error creating Resource:', error);
    throw error;
  }
};
export const createQuestionSet = async (frameworkId: string) => {
  const apiURL = `/action/questionset/v2/create`;
  const reqBody = {
    request: {
      questionset: {
        name: 'Untitled QuestionSet',
        mimeType: 'application/vnd.sunbird.questionset',
        primaryCategory: 'Practice Question Set',
        code: uuidv4(),
        createdBy: getLocalStoredUserId(),
        framework: frameworkId,
      },
    },
  };

  const response = await post(apiURL, reqBody);
  return response?.data;
};

export const deleteContent = async (identifier: string, mimeType: string) => {
  const questionsetRetireURL = `/action/questionset/v2/retire/${identifier}`;
  const contentRetireURL = `/action/content/v3/retire/${identifier}`;
  let apiURL = '';
  if (mimeType === MIME_TYPE.QUESTIONSET_MIME_TYPE) {
    apiURL = questionsetRetireURL;
  } else if (
    mimeType !== MIME_TYPE.QUESTIONSET_MIME_TYPE
    // mimeType !== MIME_TYPE.COLLECTION_MIME_TYPE
  ) {
    apiURL = contentRetireURL;
  }
  const response = await delApi(apiURL); // Assuming you have a 'del' method that handles DELETE
  return response?.data?.result;
};

export const createCourse = async (
  userId: string,
  channelId: string,
  contentFW: string,
  targetFW: string
) => {
  const apiURL = `/action/content/v3/create`;

  const reqBody = {
    request: {
      content: {
        code: uuidv4(), // Generate a unique ID for 'code'
        name: 'Untitled Course',
        createdBy: userId,
        createdFor: [channelId],
        mimeType: MIME_TYPE.COURSE_MIME_TYPE,
        resourceType: 'Course',
        primaryCategory: 'Course',
        contentType: 'Course',
        framework: contentFW,
        targetFWIds: [targetFW],
      },
    },
  };

  try {
    const response = await post(apiURL, reqBody);
    return response?.data;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

export const publishContent = async (
  identifier: string,
  publishChecklist?: Record<string, unknown>
) => {
  const requestBody = {
    request: {
      content: {
        lastPublishedBy: getLocalStoredUserId(),
        publishChecklist: publishChecklist,
      },
    },
  };

  try {
    const response = await post(
      `/action/content/v3/publish/${identifier}`,
      requestBody
    );
    return response.data;
  } catch (error) {
    console.error('Error during publishing:', error);
    throw error;
  }
};

export const submitComment = async (
  identifier: string,
  comment: string,
  rejectReasons?: Record<string, unknown>
) => {
  const requestBody = {
    request: {
      content: {
        rejectComment: comment,
        rejectReasons: rejectReasons,
      },
    },
  };

  try {
    const response = await post(
      `/action/content/v3/reject/${identifier}`,
      requestBody
    );
    return response.data;
  } catch (error) {
    console.error('Error submitting comment:', error);
    throw error;
  }
};

export const getContentHierarchy = async ({
  doId,
}: {
  doId: string;
}): Promise<Record<string, unknown>> => {
  const apiUrl = `/action/content/v3/hierarchy/${doId}`;

  try {
    console.log('Request data', apiUrl);
    const response = await get(apiUrl);
    // console.log('response', response);
    return response as unknown as Record<string, unknown>;
  } catch (error) {
    console.error('Error in getContentHierarchy Service', error);
    throw error;
  }
};
export const getFrameworkDetails = async (
  frameworkId: string
): Promise<Record<string, unknown>> => {
  const apiUrl = `/action/framework/v3/read/${frameworkId}`;

  try {
    const response = await get(apiUrl);
    return response?.data as Record<string, unknown>;
  } catch (error) {
    console.error('Error in getting Framework Details', error);
    return error as Record<string, unknown>;
  }
};
export const getFormFields = async (): Promise<Record<string, unknown>> => {
  const apiUrl = `/action/data/v1/form/read`;

  try {
    const response = await post(apiUrl, {
      request: {
        action: 'publish',
        type: 'content',
        subType: 'resource',
      },
    });
    return response?.data as Record<string, unknown>;
  } catch (error) {
    console.error('Error in getting Framework Details', error);
    return error as Record<string, unknown>;
  }
};
