import { generateUUID, getDeviceId } from './helper';
const hostURL = process.env.NEXT_PUBLIC_TELEMETRY_URL;

let CsTelemetryModule;
let EkTelemetry;
let jQuery;

if (typeof window !== 'undefined') {
  CsTelemetryModule =
    require('@project-sunbird/client-services/telemetry').CsTelemetryModule;
  EkTelemetry = require('@project-sunbird/telemetry-sdk');
  jQuery = require('jquery');
  window.jQuery = jQuery;
}

// Load session ID (sid) and user ID from localStorage if available
const sessionId =
  (typeof window !== 'undefined' && localStorage.getItem('sid')) ||
  generateUUID();
if (typeof window !== 'undefined') localStorage.setItem('sid', sessionId);
const tenantName = (typeof window !== 'undefined' && localStorage.getItem('channelId')) || '';
const telemetryConfig = {
  apislug: '',
  pdata: {
    id: 'shiksha-learner',
    pid: 'learner',
    ver: '0.0.1',
  },
  env: 'prod',
  channel: tenantName,
  did: (typeof window !== 'undefined' && localStorage.getItem('did')) || 'pending-device-id',
  authtoken: '',
  userId:
    (typeof window !== 'undefined' && localStorage.getItem('userId')) ||
    'Anonymous',
  uid:
    (typeof window !== 'undefined' && localStorage.getItem('userId')) ||
    'Anonymous',
  sid: sessionId,
  batchsize: 1,
  mode: '',
  host: '',
  endpoint: '/v1/telemetry',
  tags: [],
};

// Exportable telemetry factory
export const telemetryFactory = {
  init: () => {
    if (typeof window !== 'undefined' && !CsTelemetryModule.instance.isInitialised) {
      // Check if device ID already exists in localStorage
      const deviceId = localStorage.getItem('did');

      if (deviceId && deviceId !== 'pending-device-id') {
        // Use existing device ID
        telemetryConfig.did = deviceId;
        console.log('Telemetry Device ID (did):', deviceId);

        // Initialize telemetry with existing device ID
        CsTelemetryModule.instance.init({});
        CsTelemetryModule.instance.telemetryService.initTelemetry({
          config: telemetryConfig,
          userOrgDetails: {},
        });
      } else {
        // Get device ID asynchronously and initialize
        getDeviceId().then((deviceId) => {
          telemetryConfig.did = deviceId;
          localStorage.setItem('did', deviceId);
          console.log('Telemetry Device ID (did):', deviceId);

          // Initialize telemetry with proper device ID
          CsTelemetryModule.instance.init({});
          CsTelemetryModule.instance.telemetryService.initTelemetry({
            config: telemetryConfig,
            userOrgDetails: {},
          });
        }).catch((error) => {
          console.error('Failed to get device ID:', error);
          // Fallback initialization without device ID
          CsTelemetryModule.instance.init({});
          CsTelemetryModule.instance.telemetryService.initTelemetry({
            config: telemetryConfig,
            userOrgDetails: {},
          });
        });
      }
    }
  },

  updateUserId: (userId) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userId', userId);
      telemetryConfig.uid = userId;
      telemetryConfig.userId = userId;
      console.log('Telemetry UID updated after login:', userId);
    }
  },

  updateDeviceId: async () => {
    if (typeof window !== 'undefined') {
      try {
        const deviceId = await getDeviceId();
        telemetryConfig.did = deviceId;
        localStorage.setItem('did', deviceId);
        console.log('Telemetry Device ID updated:', deviceId);
        return deviceId;
      } catch (error) {
        console.error('Failed to update device ID:', error);
        return null;
      }
    }
  },

  getCurrentDeviceId: () => {
    return telemetryConfig.did;
  },

  interact: (interactEventInput) => {
    if (
      typeof window !== 'undefined' &&
      CsTelemetryModule.instance.isInitialised
    ) {
      const eventData = getEventData(interactEventInput);
      console.log('Sending interact telemetry with device ID:', telemetryConfig.did);
      CsTelemetryModule.instance.telemetryService.raiseInteractTelemetry({
        options: eventData.options,
        edata: eventData.edata,
      });
    }
  },

  impression: (impressionEventInput) => {
    if (
      typeof window !== 'undefined' &&
      CsTelemetryModule.instance.isInitialised
    ) {
      const eventData = getEventData(impressionEventInput);
      console.log('Sending impression telemetry with device ID:', telemetryConfig.did);
      CsTelemetryModule.instance.telemetryService.raiseImpressionTelemetry({
        options: eventData.options,
        edata: eventData.edata,
      });
    }
  },

  assess: (assessEventInput) => {
    if (
      typeof window !== 'undefined' &&
      CsTelemetryModule.instance.isInitialised
    ) {
      const eventData = getEventData(assessEventInput);
      CsTelemetryModule.instance.telemetryService.raiseAssesTelemetry({
        options: eventData.options,
        edata: eventData.edata,
      });
    }
  },

  response: (responseEventInput) => {
    if (
      typeof window !== 'undefined' &&
      CsTelemetryModule.instance.isInitialised
    ) {
      const eventData = getEventData(responseEventInput);
      CsTelemetryModule.instance.telemetryService.raiseResponseTelemetry({
        options: eventData.options,
        edata: eventData.edata,
      });
    }
  },

  interrupt: (interruptEventInput) => {
    if (
      typeof window !== 'undefined' &&
      CsTelemetryModule.instance.isInitialised
    ) {
      const eventData = getEventData(interruptEventInput);
      CsTelemetryModule.instance.telemetryService.raiseInterruptTelemetry({
        options: eventData.options,
        edata: eventData.edata,
      });
    }
  },

  start: ({ appName, ...edata }) => {
    if (typeof window !== 'undefined') {
      return {
        type: edata?.type,
        eid: generateUUID(),
        $set: { id: localStorage.getItem('userId') || 'Anonymous' },
        actor: {
          id: localStorage.getItem('userId') || 'Anonymous',
          type: 'User',
        },
        context: {
          type: appName || 'Standalone',
        },
        edata,
      };
    }
  },

  end: ({ appName, ...edata }) => {
    if (typeof window !== 'undefined') {
      return {
        type: edata?.type,
        eid: generateUUID(),
        $set: { id: localStorage.getItem('userId') || 'Anonymous' },
        actor: {
          id: localStorage.getItem('userId') || 'Anonymous',
          type: 'User',
        },
        context: {
          type: appName || 'Standalone',
        },
        edata,
      };
    }
  },

  // Optional login audit event for analysis
  loginAudit: () => {
    telemetryFactory.interact({
      edata: {
        id: 'login',
        type: 'system',
        subtype: 'user-login',
        pageid: 'login-page',
        channel: telemetryConfig.channel,
      },
      context: {
        pdata: telemetryConfig.pdata,
        env: telemetryConfig.env,
        cdata: [],
      },
    });
  },
};

function getEventData(eventInput) {
  const timestamp = Date.now();
  return {
    edata: eventInput.edata,
    options: {
      context: getEventContext(eventInput),
      object: getEventObject(eventInput),
      tags: [],
    },
    ets: timestamp,
  };
}

function getEventObject(eventInput) {
  if (eventInput.object) {
    return {
      id: eventInput.object.id || '',
      type: eventInput.object.type || '',
      ver: eventInput.object.ver || '',
      rollup: eventInput.object.rollup || {},
    };
  }
  return {};
}

function getEventContext(eventInput) {
  const eventContextData = {
    channel: eventInput.edata.channel || telemetryConfig.channel,
    pdata: eventInput.context?.pdata || telemetryConfig.pdata,
    env: eventInput.context?.env || telemetryConfig.env,
    sid: telemetryConfig.sid,
    uid: (typeof window !== 'undefined' && localStorage.getItem('userId')) || telemetryConfig.uid,
    cdata: eventInput.context?.cdata || [],
  };

  if (telemetryConfig.sid) {
    eventContextData.cdata.push({
      id: telemetryConfig.sid,
      type: 'UserSession',
    });
  }

  eventContextData.cdata.push({
    id: telemetryConfig.did,
    type: 'Device',
  });

  return eventContextData;
}

function getRollUpData(data = []) {
  const rollUp = {};
  data.forEach((element, index) => {
    rollUp['l' + (index + 1)] = element;
  });
  return rollUp;
}