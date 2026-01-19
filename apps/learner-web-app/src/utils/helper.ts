import FingerprintJS from 'fingerprintjs2';
export const firstLetterInUpperCase = (label: string): string => {
  if (!label) {
    return '';
  }

  return label
    ?.split(' ')
    ?.map((word) => word?.charAt(0).toUpperCase() + word?.slice(1))
    ?.join(' ');
};
const getSelectedValueName = (fields: any, label: any) => {
  // Safety check: ensure fields is an array
  if (!fields || !Array.isArray(fields)) {
    return null;
  }
  const field = fields.find((f: any) => f.label === label);
  if (field && field.selectedValues && field.selectedValues.length > 0) {
    return field.selectedValues[0]; // Return the first selected value
  }
  return null;
};
export const mapUserData = (userData: any) => {
  console.log(userData, 'userData');
  
  // Safety check: if userData is undefined or null, return empty object
  if (!userData || typeof userData !== 'object') {
    console.warn('mapUserData: userData is undefined or invalid');
    return {};
  }
  
  try {
    const getSelectedValue = (label: any) =>
      userData.customFields
        ?.find((f: any) => f.label === label)
        ?.selectedValues?.map((v: any) => v?.id?.toString()) || '';

    const getSingleSelectedValue = (label: any) =>
      userData.customFields
        ?.find((f: any) => f.label === label)
        ?.selectedValues?.[0]?.id?.toString() || '';

    const getSingleTextValue = (label: any) =>
      userData.customFields?.find((f: any) => f.label === label)
        ?.selectedValues?.[0] || '';

    const result: any = {
      firstName: userData.firstName || '',
      //  middleName: userData.middleName || '',
      lastName: userData.lastName || '',
      email: userData.email || '',
      mobile: userData.mobile ? userData.mobile?.toString() : '',
      dob: userData.dob || '',
      gender: userData.gender || '',
       mother_name: getSingleTextValue('MOTHER_NAME'),
              father_name: getSingleTextValue('FATHER_NAME'),
                            spouse_name: getSingleTextValue('SPOUSE_NAME'),


      marital_status: getSelectedValue('MARITAL_STATUS'),
      phone_type_accessible
: getSingleSelectedValue('TYPE_OF_PHONE_ACCESSIBLE'),
    family_member_details
: getSingleSelectedValue('FAMILY_MEMBER_DETAILS'),
      own_phone_check: getSingleSelectedValue('DOES_THIS_PHONE_BELONG_TO_YOU'),
      state: getSelectedValue('STATE'),
      district: getSelectedValue('DISTRICT'),
      block: getSelectedValue('BLOCK'),
      village: getSelectedValue('VILLAGE'),
      // is_volunteer: getSingleTextValue('IS_VOLUNTEER'),
      drop_out_reason:
        getSelectedValue('REASON_FOR_DROP_OUT_FROM_SCHOOL') || [], // array
      work_domain:
        getSelectedValue(
          'WHAT_IS_YOUR_PRIMARY_WORK'
        ) || [],
      training_check:
        getSelectedValue('HAVE_YOU_RECEIVE_ANY_PRIOR_TRAINING') || [],
      what_do_you_want_to_become: getSingleTextValue(
        'WHAT_DO_YOU_WANT_TO_BECOME'
      ),
      class: getSelectedValue(
        'HIGHEST_EDCATIONAL_QUALIFICATION_OR_LAST_PASSED_GRADE'
      ), // string

      preferred_mode_of_learning:
        getSelectedValue('WHAT_IS_YOUR_PREFERRED_MODE_OF_LEARNING') || [],
    };
    if (userData.middleName) {
      result.middleName = userData.middleName;
    }
    if (getSingleTextValue('MOTHER_NAME')) {
      result.mother_name = getSingleTextValue('MOTHER_NAME');
    }
    if (getSingleTextValue('IS_VOLUNTEER')) {
      result.is_volunteer = getSingleTextValue('IS_VOLUNTEER');
    }
    if (getSelectedValueName(userData.customFields, 'NAME_OF_GUARDIAN')) {
      result.guardian_name =
        getSelectedValueName(userData.customFields, 'NAME_OF_GUARDIAN') || '';
    }
    if (getSelectedValueName(userData.customFields, 'RELATION_WITH_GUARDIAN')) {
      result.guardian_relation =
        getSelectedValueName(userData.customFields, 'RELATION_WITH_GUARDIAN') ||
        '';
    }
    if (
      getSelectedValueName(userData.customFields, 'PARENT_GUARDIAN_PHONE_NO')
    ) {
      result.parent_phone =
        getSelectedValueName(
          userData.customFields,
          'PARENT_GUARDIAN_PHONE_NO'
        ) || '';
    }

    return result;
  } catch (error) {
    console.error('mapUserData error:', error);
    return {};
  }
};

// Usage
export const getMissingFields = (schema: any, userData: any) => {
  try {
    // use mapped data instead of raw userData
    const mappedUserData = mapUserData(userData);
    console.log(mappedUserData, 'mappedUserData');
    console.log(schema, 'schema');

    // Safety check: if mappedUserData is undefined or null, return empty schema
    if (!mappedUserData || typeof mappedUserData !== 'object') {
      console.warn('getMissingFields: mappedUserData is undefined or invalid');
      return {
        type: schema?.type || 'object',
        properties: {},
        required: [],
      };
    }

    const isEmpty = (value: any) => {
      return (
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim() === '') ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'object' &&
          !Array.isArray(value) &&
          Object.keys(value).length === 0)
      );
    };

    const clonedSchema = JSON.parse(JSON.stringify(schema));

    const fieldsToRemove = [
      'password',
      'confirm_password',
      'username',
      'program',
      'batch',
      'center',
      'state',
      'district',
      'block',
      'village',
    ];

    fieldsToRemove.forEach((field) => {
      delete clonedSchema.properties[field];
    });

    if (Array.isArray(clonedSchema.required)) {
      clonedSchema.required = clonedSchema.required.filter(
        (field: any) => !fieldsToRemove.includes(field)
      );
    }

    const guardianFields = [
      'guardian_name',
      'guardian_relation',
      'parent_phone',
    ];

    const result: any = {
      type: clonedSchema.type,
      properties: {},
      required: [],
    };

    // Check keys using mappedUserData
    Object.keys(clonedSchema.properties).forEach((key) => {
      if (!(key in mappedUserData) || isEmpty(mappedUserData[key])) {
        result.properties[key] = clonedSchema.properties[key];
      }
    });

    if (Array.isArray(clonedSchema.required)) {
      result.required = clonedSchema.required.filter(
        (field: any) =>
          !(field in mappedUserData) || isEmpty(mappedUserData[field])
      );
    }

    // const hasDOB = !!mappedUserData.dob;
    // if (hasDOB) {
    //   guardianFields.forEach((field) => {
    //     if (!mappedUserData[field] || isEmpty(mappedUserData[field])) {
    //       // Use the field from schema if available, otherwise fallback
    //       result.properties[field] = clonedSchema.properties[field] || {
    //         type: 'string',
    //         title: field.replace(/_/g, ' ').toUpperCase(),
    //       };
    //     }
    //   });
    // } else {
    //   guardianFields.forEach((field) => {
    //     if (field in result.properties) {
    //       delete result.properties[field];
    //     }
    //   });
    // }

    // if (result.properties.dob) {
    //   guardianFields.forEach((field) => {
    //     if (!result.properties[field]) {
    //       result.properties[field] = {
    //         type: 'string',
    //         title: field.toUpperCase(),
    //       };
    //     }
    //   });
    // } else {
    //   guardianFields.forEach((field) => {
    //     if (result.properties[field]) {
    //       delete result.properties[field];
    //     }
    //   });
    // }
    if(mappedUserData.spouse_name) {
      delete result.properties.mother_name;
            delete result.properties.father_name;

    }
   else if(mappedUserData.father_name ) {
    delete result.properties.mother_name;
            delete result.properties.spouse_name;
    }
   else if(mappedUserData.mother_name) {
    delete result.properties.spouse_name;
            delete result.properties.father_name;
    }


    return result;
  } catch (error) {
    console.error('Error in getMissingFields:', error);
    return null;
  }
};
export const maskMobileNumber = (mobile: string) => {
  if (mobile && mobile.length < 2) return mobile;
  else if (mobile) {
    const first = mobile[0];
    const last = mobile[mobile.length - 1];
    const masked = '*'.repeat(mobile.length - 2);
    return first + masked + last;
  }
};
export const preserveLocalStorage = () => {
  const keysToKeep = [
    'preferredLanguage',
    'mui-mode',
    'mui-color-scheme-dark',
    'mui-color-scheme-light',
    'hasSeenTutorial',
    'lang',
  ];

  const valuesToKeep: { [key: string]: any } = {};

  keysToKeep.forEach((key: string) => {
    const value = localStorage.getItem(key);
    if (value !== null) {
      valuesToKeep[key] = value;
    }
  });

  localStorage.clear();

  keysToKeep.forEach((key: string) => {
    if (valuesToKeep[key] !== undefined) {
      localStorage.setItem(key, valuesToKeep[key]);
    }
  });
};
export const isUnderEighteen = (dobString: any): boolean => {
  if (!dobString) return false;

  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return false; // Invalid date check

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  const dayDiff = today.getDate() - dob.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  return age < 18;
};

export const SUPPORTED_MIME_TYPES = [
  'application/vnd.ekstep.ecml-archive',
  'application/vnd.ekstep.html-archive',
  'application/vnd.ekstep.h5p-archive',
  'application/pdf',
  'video/mp4',
  'video/webm',
  'application/epub',
  'video/x-youtube',
  'application/vnd.sunbird.questionset',
  // Support ekstep video content for direct player routing (align with content MFE)
  'application/vnd.ekstep.video',
];
export const toPascalCase = (name: string | any) => {
  if (typeof name !== 'string') {
    return name;
  }

  return name
    ?.toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};


export const getDeviceId = () => {
  return new Promise((resolve) => {
    FingerprintJS.get((components: any[]) => {
      const values = components?.map((component) => component.value);
      const deviceId = FingerprintJS.x64hash128(values.join(''), 31);
      resolve(deviceId);
    });
  });
};

export const generateUUID = () => {
  let d = new Date().getTime();
  let d2 =
    (typeof performance !== 'undefined' &&
      performance.now &&
      performance.now() * 1000) ||
    0;
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    let r = Math.random() * 16;
    if (d > 0) {
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
};