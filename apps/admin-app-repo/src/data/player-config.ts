import { getDeviceId } from "@/utils/Helper";
import { PlayerConfig } from "@/utils/Interfaces";

let name = "";
if (typeof window !== "undefined" && window.localStorage) {
  name = localStorage.getItem("userName") || "";
}

const DeviceId = getDeviceId().then((deviceId) => {
  return deviceId;
});

export const V2PlayerConfig: PlayerConfig = {
  context: {
    mode: "play",
    partner: [],
    pdata: {
      id: "shiksha.learner.portal",
      ver: "1.0.0",
      pid: "admin-portal",
    },
    contentId: "",
    sid: "",
    uid: "",
    timeDiff: -0.089,
    channel: "",
    tags: [],
    did: DeviceId,
    contextRollup: { l1: "" },
    objectRollup: {},
    userData: { firstName: name, lastName: "" },
    host: "",
    endpoint: "/v1/telemetry",
  },
  config: {
    showEndPage: false,
    endPage: [{ template: "assessment", contentType: ["SelfAssess"] }],
    showStartPage: true,
    host: "",
    overlay: { showUser: false },
    splash: {
      text: "Powered by Pratham",
      icon: "",
      bgImage: "assets/icons/splacebackground_1.png",
      webLink: "",
    },
    apislug: "",
    repos: ["/sunbird-plugins/renderer"],
    plugins: [
      { id: "org.sunbird.iframeEvent", ver: 1, type: "plugin" },
      { id: "org.sunbird.player.endpage", ver: 1.1, type: "plugin" },
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
    repos: ["/sunbird-plugins/renderer"],
    plugins: [
      {
        id: "org.sunbird.iframeEvent",
        ver: 1,
        type: "plugin",
      },
      {
        id: "org.sunbird.player.endpage",
        ver: 1.1,
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
  context: {
    mode: "play",
    // partner: [],
    pdata: {
      id: "shiksha.learner.portal",
      ver: "1.0.0",
      pid: "admin-portal",
    },
    contentId: "",
    sid: "",
    uid: "",
    timeDiff: -1.129,
    contextRollup: {},
    channel: "",
    did: DeviceId,
    dims: [],
    tags: [],
    app: [],
    cdata: [],
    userData: {
      firstName: name,
      lastName: "",
    },
  },
  data: {},
};
