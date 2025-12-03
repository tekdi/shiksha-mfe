import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { v4 as uuidv4 } from "uuid";
import { CLOUD_STORAGE_URL } from "../utils/app.config";
import {
  getLocalStoredUserId,
  getLocalStoredUserName,
  getLocalStoredUserSpecificBoard
} from "../services/LocalStorageService";
import { fetchCCTAList } from "../services/userServices";
import { sendCredentialService } from "../services/NotificationService";
import useTenantConfig from "../hooks/useTenantConfig";
import { sendContentNotification } from "../services/sendContentNotification";
import { ContentStatus, Editor } from "../utils/app.constant";
const QuestionSetEditor: React.FC = () => {
  const tenantConfig = useTenantConfig();
  const router = useRouter();
  const { identifier, contentMode } = router.query;
  const [mode, setMode] = useState<any>();
  const [fullName, setFullName] = useState("Anonymous User");
  const [deviceId, setDeviceId] = useState("7e85b4967aebd6704ba1f604f20056b6");

  const [firstName, lastName] = fullName.split(" ");

  useEffect(() => {
    if (contentMode?.length) {
      setMode(contentMode);
    }
  }, [router.query]);

  useEffect(() => {
    const storedFullName = getLocalStoredUserName();
    const storedUserId = getLocalStoredUserId();
    const storedMode = localStorage.getItem("contentMode");
    setMode(storedMode || "edit");
    setFullName(storedFullName ?? "Anonymous User");


    const generatedDeviceId = uuidv4();
    setDeviceId(generatedDeviceId);
  }, []);

  const questionSetEditorConfig = {
    context: {
      user: {
        id: getLocalStoredUserId(),
        fullName: fullName,
        firstName: firstName || "Anonymous",
        lastName: lastName || "Anonymous",
        orgIds: [tenantConfig?.CHANNEL_ID],
      },
      identifier: identifier,
      sid: uuidv4(),
      did: deviceId,
      uid: getLocalStoredUserId(),
      channel: tenantConfig?.CHANNEL_ID,
      pdata: {
        id: "shiksha.learner.portal",
        ver: "1.0.0",
        pid: "pratham-portal",
      },
      contextRollup: {
        l1: tenantConfig?.CHANNEL_ID,
      },
      tags: [tenantConfig?.CHANNEL_ID],
      cdata: [
        {
          id: tenantConfig?.CHANNEL_ID,
          type: "pratham-portal",
        },
      ],
      timeDiff: 5,
      objectRollup: {},
      host: "",
      defaultLicense: "CC BY 4.0",
      endpoint: "/data/v3/telemetry",
      env: "questionset_editor",
      framework: tenantConfig?.COLLECTION_FRAMEWORK,
      cloudStorageUrls: [CLOUD_STORAGE_URL],
      labels: {
        save_collection_btn_label: "Save as Draft",
      },
      correctionComments: false,
      sourcingResourceStatus: true,
      cloudStorage: {
        provider: "aws",
        presigned_headers: {},
      },
    },
    config: {
      mode: contentMode ||mode || "edit",
      userSpecificFrameworkField: getLocalStoredUserSpecificBoard(),
      enableQuestionCreation: true,
      enableAddFromLibrary: true,
      editableFields: {
        sourcingreview: [],
        orgreview: [],
        review: [],
      },
      objectType: "QuestionSet",
      primaryCategory: "Practice Question Set",
      contentPolicyUrl: "/term-of-use.html",
      assetProxyUrl: "/assets/public/",
      commonFrameworkLicenseUrl: "https://creativecommons.org/licenses/",
    },
  };

  console.log('questionSetEditorConfig ====>', questionSetEditorConfig)

  const editorRef = useRef<HTMLDivElement | null>(null);
  const isAppendedRef = useRef(false);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const sendReviewNotification = async (notificationData: any) => {
   
  
    const isQueue = false;
    const context = "CMS";
    const key = "onContentReview";
    const url = `${process.env.NEXT_PUBLIC_WORKSPACE_BASE_URL}/editor?identifier=${notificationData?.contentId}&contentMode=review`
    try {
      const response = await fetchCCTAList();
      const cctaList = response;
      const ContentDetail = await fetch(
        `/action/content/v3/read/${notificationData?.contentId}`
      );
      const data = await ContentDetail.json();

 
      const promises = cctaList.map(async (user: any) => {
        const replacements = {
          "{reviewerName}": user?.name,
          "{creatorName}": notificationData?.creator,
          "{contentId}": notificationData?.contentId,
          "{appUrl}": url,
          "{submissionDate}": new Date().toLocaleDateString(),
        "{contentType}":"Course",
        "{contentTitle}":data?.result?.content?.name
        };
  
        return sendCredentialService({
          isQueue,
          context,
          key,
          replacements,
          email: { receipients: [user?.email] },
        });
      });
  
      await Promise.all(promises);
  
      console.log("All emails sent successfully.");
      
      window.history.back(); 
    } catch (error) {
      console.error("Error sending email notifications:", error);
    }
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };
  
 
  const sendCreatorNotification = () => sendContentNotification(ContentStatus.PUBLISHED, Editor.QUESTION_SET ,"", identifier, undefined, router);
  const sendContentRejectNotification = () => sendContentNotification(ContentStatus.REJECTED, Editor.QUESTION_SET ,"", identifier, undefined, router);
 
  useEffect(() => {
    const loadAssets = () => {
      if (!document.getElementById("sunbird-editor-css")) {
        const link = document.createElement("link");
        link.id = "sunbird-editor-css";
        link.rel = "stylesheet";
        link.href =
          "https://cdn.jsdelivr.net/npm/@tekdi/sunbird-questionset-editor-web-component@5.0.0-beta.9/styles.css";
        document.head.appendChild(link);
      }

      if (!document.getElementById("sunbird-editor-js")) {
        const script = document.createElement("script");
        script.id = "sunbird-editor-js";
        script.src =
          "https://cdn.jsdelivr.net/npm/@tekdi/sunbird-questionset-editor-web-component@5.0.0-beta.9/sunbird-questionset-editor.js";
        script.async = true;
        script.onload = () => setAssetsLoaded(true);
        document.body.appendChild(script);
      } else {
        setAssetsLoaded(true);
      }
    };

    loadAssets();

    return () => {
      const editorCss = document.getElementById("sunbird-editor-css");
      const editorScript = document.getElementById("sunbird-editor-js");

      if (editorCss) document.head.removeChild(editorCss);
      if (editorScript) document.body.removeChild(editorScript);
    };
  }, []);

  useEffect(() => {
    if (assetsLoaded && editorRef.current && !isAppendedRef.current) {
      const questionsetEditorElement = document.createElement(
        "lib-questionset-editor"
      );

      questionsetEditorElement.setAttribute(
        "editor-config",
        JSON.stringify(questionSetEditorConfig)
      );

      questionsetEditorElement.addEventListener(
        "editorEmitter",
        (event: any) => {
          console.log("Editor event:", event);
          if (
            event.detail?.action === "backContent" ||
            event.detail?.action === "submitContent" ||
            event.detail?.action === "publishContent" ||
            event.detail?.action === "rejectContent"
          ) {
            if (event.detail?.action === "submitContent") {
              console.log("collection");
            
              sendReviewNotification({
                contentId: identifier,
                creator: getLocalStoredUserName(),
              })
                .then(() => {
                  window.history.back(); 
                })
                .catch((error) => {
                  console.error("Error in sendReviewNotification:", error);
                });
            } 
            else if (event.detail?.action === "publishContent")
            {
              sendCreatorNotification()
            }
            else if(event.detail?.action === "rejectContent")
            {
              sendContentRejectNotification()
            }
            
            else {
              window.history.back();
            }
            localStorage.removeItem("contentMode");
          //  window.history.back();
            window.addEventListener(
              "popstate",
              () => {
                window.location.reload();
              },
              { once: true }
            );
          }
        }
      );
      editorRef.current.appendChild(questionsetEditorElement);
      isAppendedRef.current = true;
    }
  }, [assetsLoaded]);

  return (
    <div>
      {assetsLoaded ? <div ref={editorRef}></div> : <p>Loading editor...</p>}
    </div>
  );
};

export default QuestionSetEditor;
