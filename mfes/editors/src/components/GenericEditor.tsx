//@ts-nocheck
import React, { useEffect, useState } from "react";

// Extend the Window interface to include ecEditor
declare global {
  interface Window {
    ecEditor?: any;
  }
}
import { useRouter } from "next/router";
import $ from "jquery";
import _ from "lodash";
import "izimodal/css/iziModal.css";
import "izimodal/js/iziModal.js";
import editorConfig from "./editor.config.json";
import {
  getLocalStoredUserId,
  getLocalStoredUserName,
} from "../services/LocalStorageService";
import { fetchCCTAList } from "../services/userServices";
import { sendCredentialService } from "../services/notificationService";
import useTenantConfig from "../hooks/useTenantConfig";
const GenericEditor: React.FC = () => {
  const tenantConfig = useTenantConfig();
  const router = useRouter();
  const { identifier, editorforlargecontent } = router.query;
  const [showLoader, setShowLoader] = useState(true);
  const buildNumber = "";
  const extContWhitelistedDomains = "youtube.com,youtu.be";
  const videoMaxSize = "150";
  const defaultContentFileSize = "150";
  let isLargeFileUpload = false;

  if (editorforlargecontent) {
    isLargeFileUpload = true;
  }

  const handlePopState = (event: any) => {
    console.log("popstate event fired", event.state);
    window.location.hash = "no";
    if (event.state) {
      // Push the current state back to prevent navigation
      // window.history.pushState(null, '', window.location.href);
      alert('Please use the "x" button to exit this page.');
      window.location.hash = "no";
    }
    window.location.hash = "no";
  };
  const sendReviewNotification = async (notificationData: any) => {
    try{
    const response = await fetchCCTAList();
    const cctaList = response;
    console.log("response", response);
    const isQueue = false;
    const context = "CMS";
    const key = "onContentReview";
    const url = `${process.env.NEXT_PUBLIC_WORKSPACE_BASE_URL}/workspace/content/review?identifier=${notificationData?.contentId}`;
 const ContentDetail = await fetch(
        `/action/content/v3/read/${notificationData?.contentId}`
      );
      const data = await ContentDetail.json();

    cctaList?.map(async (user: any) => {
      const replacements = {
        "{reviewerName}": user?.name,
        "{creatorName}": notificationData?.creator,
        "{contentId}": notificationData?.contentId,
        "{appUrl}": url,
        "{submissionDate}": new Date(),
        "{contentType}":"Learning Resource",
        "{contentTitle}":data?.result?.content?.name
      };
      const response = await sendCredentialService({
        isQueue,
        context,
        key,
        replacements,
        email:  
        {receipients: [user?.email]},
      });
    });}
    catch(error){
      console.error("Error sending email notifications:", error);

    }
  };

  useEffect(() => {
    // Listen for the popstate event
    window.location.hash = "no";
    window.addEventListener("popstate", handlePopState);

    return () => {
      // Clean up event listener
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!tenantConfig?.CHANNEL_ID || !tenantConfig?.CONTENT_FRAMEWORK) return;
    if (typeof window !== "undefined") {
      // Attach jQuery to window and window.parent
      window.$ = window.jQuery = $;
      if (window.parent) {
        window.parent.$ = window.$;
        window.parent.jQuery = window.jQuery;
      }

      console.log("editorConfig ==>", editorConfig);
      getContentDetails(identifier)
        .then((data: any) => {
          initEditor();
          setWindowContext(data);
          setWindowConfig();
          console.log("window.config ==>", window.config);
          console.log("window.context ==>", window.context);
          $("#genericEditor").iziModal("open");
          setShowLoader(false);
        })
        .catch((error) => {
          console.error("Error:", error);
          closeModal();
        });
    }
  }, [tenantConfig?.CHANNEL_ID, tenantConfig?.CONTENT_FRAMEWORK, identifier]);

  const getContentDetails = async (contentId: any) => {
    if (!contentId) {
      return {}; // Return empty object if contentId is undefined
    }

    try {
      const response = await fetch(
        `/action/content/v3/read/${contentId}?mode=edit&fields=body,collaborators,editorState,stageIcons,templateId,languageCode,template,gradeLevel,status,concepts,versionKey,name,appIcon,contentType,owner,domain,code,visibility,createdBy,description,language,mediaType,mimeType,osId,languageCode,createdOn,lastUpdatedOn,audience,ageGroup,attributions,artifactUrl,board,subject,keywords,config,resourceType,medium,publisher,year,pkgVersion,framework,rejectReasons,rejectComment,topic,ownedBy,ownershipType,creators,contributors,reservedDialcodes,qrCodeProcessId,channel,purpose,assets,assetsMap,copyright,author,copyrightYear,origin,license,displayScore,courseType,licenseterms,primaryCategory,additionalCategories,maxAttempts,verticals,programs,domain,subDomain,targetAgeGroup,primaryUser,contentLanguage,program,subject`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch content");
      }

      const data = await response.json();
      return data.result.content;
    } catch (err: any) {
      console.error(err);
      return null;
    }
  };

  // Initialize the modal and open iframe
  const initEditor = () => {
    if (typeof window !== "undefined") {
      $("#genericEditor").iziModal({
        title: "",
        iframe: true,
        //online from tekdinext
        iframeURL: `generic-editor/index.html?${buildNumber}`,
        navigateArrows: false,
        fullscreen: true,
        openFullscreen: true,
        closeOnEscape: true,
        overlayClose: false,
        overlay: false,
        history: false,
        closeButton: true,
        onClosing: () => {
          closeModal();
        },
        onOpened: () => {
          // Wait for iframe to be injected
          console.log("Opened=========>");
          const iframe = document.querySelector(
            "#genericEditor iframe"
          ) as HTMLIFrameElement;
          console.log("iframe", iframe);
          if (iframe) {
            // Attach event listener when iframe loads
            // iframe.onload = () => {
            console.log("Iframe loaded successfully!");

            try {
              const iframeWindow = iframe.contentWindow;

              if (iframeWindow && iframeWindow.ecEditor) {
                iframeWindow.ecEditor.addEventListener(
                  "org.ekstep.contenteditor:review",
                  (event: any) => {
                    console.log("Review Event triggered inside iframe!", event);
                    console.log("window", window);
                    console.log("window parent", window?.parent);
                    sendReviewNotification({
                      contentId: window?.parent?.context?.contentId,
                      creator: getLocalStoredUserName(),
                    });
                  }
                );
              }
            } catch (error) {
              console.error("Error accessing iframe content:", error);
            }
            // };
          }
        },
      });
    }
  };

  // Set window context for the iframe
  const setWindowContext = (data: any) => {
    const contentChannel = data?.channel || tenantConfig?.CHANNEL_ID;
    const contentFramework = data?.framework || tenantConfig?.CONTENT_FRAMEWORK;
    if (typeof window !== "undefined") {
      window["context"] = _.cloneDeep(
        editorConfig.GENERIC_EDITOR.WINDOW_CONTEXT
      );
      if (identifier) {
        window["context"].contentId = identifier;
      }
      window["context"].user = {
        id: getLocalStoredUserId(),
        name: getLocalStoredUserName() || "Anonymous User",
        orgIds: [contentChannel],
        organisations: {
          [contentChannel]: contentChannel,
        },
      };
      window["context"].uid = getLocalStoredUserId();
      window["context"].contextRollUp.l1 = contentChannel;
      window["context"].tags = [contentChannel];
      window["context"].channel = contentChannel;
      window["context"].framework = contentFramework;
      if (
        isLargeFileUpload ||
        _.get(data, "contentDisposition") === "online-only"
      ) {
        window.context["uploadInfo"] = {
          isLargeFileUpload: true,
          maxAllowedContentSize: "1" //1GB
        };
      }
    }
  };

  // Set window config for the iframe
  const setWindowConfig = () => {
    if (typeof window !== "undefined") {
      window["config"] = _.cloneDeep(editorConfig.GENERIC_EDITOR.WINDOW_CONFIG);
      window["config"].build_number = buildNumber;
      window["config"].headerLogo = "/logo.png";
      window["config"].lock = {};
      window["config"].extContWhitelistedDomains = extContWhitelistedDomains;
      window["config"].enableTelemetryValidation = false;
      window["config"].videoMaxSize = videoMaxSize;
      window["config"].defaultContentFileSize = defaultContentFileSize;
      window["config"].cloudStorage = {
        provider: "aws",
        presigned_headers: {
          "x-amz-acl": "private", // This header sets access control; it's specific to AWS S3.
        },
      };
    }
  };

  // Function to close the modal and navigate away
  const closeModal = () => {
    setShowLoader(false);

    const previousPage = sessionStorage.getItem("previousPage");
    const editorElement = document.getElementById("genericEditor");
    if (editorElement) {
      editorElement.remove();
    }
    console.log("history", window.history.length);
    // window.history.back();

    if (previousPage) {
      // window.location.href = previousPage; // Navigate to the previous URL
      router.replace(previousPage);
    } else {
      // window.location.href = '/workspace/content/create';
      router.replace("/workspace/content/create");
    }
  };

  return (
    <div>
      <div id="genericEditor"></div>
      {showLoader && <div>Loading Editor.....</div>}
    </div>
  );
};

export default GenericEditor;
