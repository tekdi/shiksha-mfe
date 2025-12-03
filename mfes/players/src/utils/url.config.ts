export const URL_CONFIG = {
  PARAMS: {
    CONTENT_GET:
      "transcripts,ageGroup,appIcon,artifactUrl,attributions,attributions,audience,author,badgeAssertions,body,channel,code,concepts,contentCredits,contentType,contributors,copyright,copyrightYear,createdBy,createdOn,creator,creators,description,displayScore,domain,editorState,flagReasons,flaggedBy,flags,framework,identifier,itemSetPreviewUrl,keywords,language,languageCode,lastUpdatedOn,license,mediaType,mimeType,name,originData,osId,owner,pkgVersion,publisher,questions,resourceType,scoreDisplayConfig,status,streamingUrl,template,templateId,totalQuestions,totalScore,versionKey,visibility,year,primaryCategory,additionalCategories,interceptionPoints,interceptionType",
    LICENSE_DETAILS: "name,description,url",
    HIERARCHY_FEILDS: "instructions,outcomeDeclaration",
  },
  API: {
    CONTENT_READ: `${process.env.NEXT_PUBLIC_MIDDLEWARE_URL}/api/content/v1/read/`,
    HIERARCHY_API: `${process.env.NEXT_PUBLIC_MIDDLEWARE_URL}/action/questionset/v2/hierarchy/`,
    QUESTIONSET_READ: `${process.env.NEXT_PUBLIC_MIDDLEWARE_URL}/action/questionset/v2/read/`,
    COMPOSITE_SEARCH: `${process.env.NEXT_PUBLIC_MIDDLEWARE_URL}/action/composite/v3/search`,
    CONTENT_HIERARCHY: `${process.env.NEXT_PUBLIC_MIDDLEWARE_URL}/action/content/v3/hierarchy`,
  },
};

export interface Pdata {
  id: string;
  pid?: string;
  ver?: string;
}

export interface ContextRollup {
  l1?: string;
  l2?: string;
  l3?: string;
  l4?: string;
}

export interface Cdata {
  type: string;
  id: string;
}

export interface ObjectRollup {
  l1?: string;
  l2?: string;
  l3?: string;
  l4?: string;
}

export interface Context {
  mode?: string;
  authToken?: string;
  sid?: string;
  did?: any;
  uid?: string;
  channel: string;
  pdata: Pdata;
  contextRollup?: ContextRollup;
  tags?: string[];
  cdata?: Cdata[];
  timeDiff?: number;
  objectRollup?: ObjectRollup;
  host?: string;
  endpoint?: string;
  dispatcher?: object;
  partner?: any[];
  contentId?: any;
  dims?: any[];
  app?: string[];
  userData?: {
    firstName: string;
    lastName: string;
  };
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Config {
  toolBar?: {
    showZoomButtons?: boolean;
    showPagesButton?: boolean;
    showPagingButtons?: boolean;
    showSearchButton?: boolean;
    showRotateButton?: boolean;
  };
  sideMenu?: {
    showShare?: boolean;
    showDownload?: boolean;
    showReplay?: boolean;
    showExit?: boolean;
    showPrint?: boolean;
  };
  [propName: string]: any;
}

export interface Metadata {
  identifier: string;
  name: string;
  artifactUrl: string;
  streamingUrl?: string;
  compatibilityLevel?: number;
  pkgVersion?: number;
  isAvailableLocally?: boolean;
  basePath?: string;
  baseDir?: string;
}
export interface PlayerConfig {
  context?: Context;
  config?: Config;
  metadata?: Metadata;
  data?: any;
}

export const MIME_TYPE = {
  QUESTION_SET_MIME_TYPE: "application/vnd.sunbird.questionset",
  INTERACTIVE_MIME_TYPE: [
    "application/vnd.ekstep.h5p-archive",
    "application/vnd.ekstep.html-archive",
    "application/vnd.ekstep.ecml-archive",
  ],
};

export const getTelemetryConfig = (): Context => {
  let localStorageData = {
    userName: "",
    accToken: "",
    tenantId: "",
    tenantCode: "",
    did: "",
    sid: "",
    uid: "",
  };
  if (typeof window !== "undefined" && window.localStorage) {
    const ls = window.localStorage;
    localStorageData = {
      userName: ls.getItem("userIdName") ?? "",
      accToken: ls.getItem("token") ?? "",
      sid: ls.getItem("token") ?? "",
      uid: ls.getItem("userId") ?? "",
      tenantId: ls.getItem("tenantId") ?? "",
      tenantCode: ls.getItem("channelId") ?? "",
      did: ls.getItem("did") ?? "",
    };
  }
  return {
    mode: "play",
    partner: [],
    pdata: {
      id: "shiksha.learner.portal",
      ver: "1.0.0",
      pid: "admin-portal",
    },
    contentId: "",
    timeDiff: -0.089,
    channel: localStorageData.tenantCode,
    tags: [localStorageData.tenantCode],
    contextRollup: { l1: localStorageData.tenantCode },
    objectRollup: {},
    userData: { firstName: localStorageData.userName || "Guest", lastName: "" },
    host: "",
    endpoint: "/v1/telemetry",
    ...localStorageData,
  };
};

export const V2PlayerConfig: PlayerConfig = {
  context: getTelemetryConfig(),
  config: {
    showEndPage: false,
    endPage: [{ template: "assessment", contentType: ["SelfAssess"] }],
    showStartPage: true,
    host: "",
    overlay: { showUser: false },
    splash: {
      text: "",
      icon: "",
      bgImage: "assets/icons/splacebackground_1.png",
      webLink: "",
    },
    apislug: "",
    repos: ["/sunbird-plugins/renderer"],
    plugins: [
      { id: "org.sunbird.iframeEvent", ver: 1, type: "plugin" },
      { id: "org.sunbird.player.endpage", ver: 1.1, type: "plugin" },
      {
        id: "org.ekstep.questionset",
        ver: 1, // Or 1.0, verify exact version from your ECML manifest if available
        type: "plugin",
      },
      {
        id: "org.ekstep.questionunit",
        ver: 1.2, // Or 1.0, verify exact version from your ECML manifest if available
        type: "plugin",
      },
      {
        id: "org.ekstep.questionunit.mcq",
        ver: 1.3, // Or 1.0, verify exact version from your ECML manifest if available
        type: "plugin",
      },
      {
        id: "org.ekstep.navigation", // Appears in your media manifest
        ver: 1,
        type: "plugin",
      },
      {
        id: "org.ekstep.questionset.quiz", // Appears in your media manifest
        ver: 1,
        type: "plugin",
      },
      {
        id: "org.ekstep.iterator", // Appears in your media manifest
        ver: 1,
        type: "plugin",
      },
    ],
    sideMenu: {
      showShare: false,
      showDownload: true,
      showExit: true,
      showPrint: false,
      showReplay: true,
    },
  },
  data: {},
};

export const V1PlayerConfig: PlayerConfig = {
  config: {
    whiteListUrl: [],
    showEndPage: true,
    endPage: [
      {
        template: "assessment",
        contentType: ["SelfAssess"],
      },
    ],
    showStartPage: true,
    host: "",
    endpoint: "/v1/telemetry",
    overlay: {
      enableUserSwitcher: true,
      showOverlay: true,
      showNext: true,
      showPrevious: true,
      showSubmit: false,
      showReload: false,
      showUser: false,
      showExit: true,
      menu: {
        showTeachersInstruction: false,
      },
    },
    splash: {
      text: "",
      icon: "",
      bgImage: "assets/icons/splacebackground_1.png",
      webLink: "",
    },
    apislug: "",
    repos: ["/sunbird-plugins/renderer", "/sunbird-plugins/content-plugins"],
    plugins: [
      {
        id: "org.sunbird.iframeEvent",
        ver: 1.0,
        type: "plugin",
      },
      {
        id: "org.sunbird.player.endpage",
        ver: 1.1,
        type: "plugin",
      },
      {
        id: "org.ekstep.questionset",
        ver: 1, // Or 1.0, verify exact version from your ECML manifest if available
        type: "plugin",
      },
      {
        id: "org.ekstep.questionunit",
        ver: 1.2, // Or 1.0, verify exact version from your ECML manifest if available
        type: "plugin",
      },
      {
        id: "org.ekstep.questionunit.mcq",
        ver: 1.3, // Or 1.0, verify exact version from your ECML manifest if available
        type: "plugin",
      },
      {
        id: "org.ekstep.navigation", // Appears in your media manifest
        ver: 1,
        type: "plugin",
      },
      {
        id: "org.ekstep.questionset.quiz", // Appears in your media manifest
        ver: 1,
        type: "plugin",
      },
      {
        id: "org.ekstep.iterator", // Appears in your media manifest
        ver: 1,
        type: "plugin",
      },
    ],
    sideMenu: {
      showShare: true,
      showDownload: true,
      showExit: true,
    },
    enableTelemetryValidation: false,
  },
  context: getTelemetryConfig(),
  data: {},
};
