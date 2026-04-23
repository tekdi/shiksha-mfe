import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { v4 as uuidv4 } from "uuid";
import { CLOUD_STORAGE_URL } from "../utils/app.config";
import {
  getLocalStoredUserName,
  getLocalStoredUserId,
  getLocalStoredUserSpecificBoard
} from "../services/LocalStorageService";
import { fetchCCTAList } from "../services/userServices";
import { sendCredentialService } from "../services/NotificationService";
import { sendContentNotification } from "../services/sendContentNotification";
import { ContentStatus, Editor } from "../utils/app.constant";
import useTenantConfig from "../hooks/useTenantConfig";
const CollectionEditor: React.FC = () => {
  const router = useRouter();
  const { identifier, contentMode } = router.query;
  const [mode, setMode] = useState<any>();
  const [fullName, setFullName] = useState("Anonymous User");
  const [deviceId, setDeviceId] = useState("");

  const [firstName, lastName] = fullName.split(" ");
  const tenantConfig = useTenantConfig();
  useEffect(() => {
    if (contentMode?.length) {
      setMode(contentMode);
    }
  }, [router.query]);



  const sendReviewNotification = async (notificationData: any) => {
    console.log("notificationData", notificationData);
   
  
    const isQueue = false;
    const context = "CMS";
    const key = "onContentReview";
    const url = `${process.env.NEXT_PUBLIC_WORKSPACE_BASE_URL}/collection?identifier=${notificationData?.contentId}&contentMode=review`;
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
  
      // Wait for all API calls to complete
      await Promise.all(promises);
  
      console.log("All emails sent successfully.");
      
      window.history.back(); 
    } catch (error) {
      console.error("Error sending email notifications:", error);
    }
  };
  
  
  useEffect(() => {
    const storedFullName = getLocalStoredUserName();
    const storedMode = localStorage.getItem("contentMode");
    setMode(storedMode || "edit");
    setFullName(storedFullName ?? "Anonymous User");

    const generatedDeviceId = uuidv4();
    setDeviceId(generatedDeviceId);
  }, []);

  const editorConfig = {
    context: {
      user: {
        id: getLocalStoredUserId(),
        fullName: fullName,
        firstName: firstName || "Anonymous",
        lastName: lastName || "User",
        orgIds: [tenantConfig?.CHANNEL_ID],
      },
      identifier: identifier,
      channel: tenantConfig?.CHANNEL_ID,
      framework: tenantConfig?.COLLECTION_FRAMEWORK,
      sid: uuidv4(),
      did: deviceId,
      uid: getLocalStoredUserId(),
      additionalCategories: [],
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
      env: "collection_editor",
      cloudStorageUrls: [CLOUD_STORAGE_URL],
    },
    config: {
      mode: contentMode || mode || "edit", // edit / review / read / sourcingReview
      userSpecificFrameworkField: getLocalStoredUserSpecificBoard(),
      objectType: "Collection",
      primaryCategory: "Course", // Professional Development Course, Curriculum Course
      showAddCollaborator: false,
      enableBulkUpload: false,
      contentPolicyUrl: "/term-of-use.html",
    },
  };
  
  
  const sendContentPublishNotification = () => sendContentNotification(ContentStatus.PUBLISHED, Editor.COLLECTION,"", identifier, undefined, router);
  const sendContentRejectNotification = () => sendContentNotification(ContentStatus.REJECTED,Editor.COLLECTION,"", identifier, undefined , router);
 
  const editorRef = useRef<HTMLDivElement | null>(null);
  const isAppendedRef = useRef(false);
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  useEffect(() => {
    const loadJQuery = () => {
      if (!document.getElementById("jquery-script")) {
        const script = document.createElement("script");
        script.id = "jquery-script";
        script.src = "https://code.jquery.com/jquery-3.6.0.min.js";
        script.async = true;
        script.onload = () => console.log("jQuery loaded successfully.");
        document.body.appendChild(script);
      }
    };
    const loadAssets = () => {
      loadJQuery();
      if (!document.getElementById("collection-editor-js")) {
        const script = document.createElement("script");

        script.id = "collection-editor-js";
        script.src =
          "https://cdn.jsdelivr.net/npm/@tekdi/sunbird-collection-editor-web-component@6.1.0-beta.3/sunbird-collection-editor.js";
        script.async = true;
        script.onload = () => setAssetsLoaded(true);
        document.body.appendChild(script);
      } else {
        setAssetsLoaded(true);
      }

      // Load Collection Editor CSS if not already loaded
      if (!document.getElementById("collection-editor-css")) {
        const link = document.createElement("link");
        console.log("PDF Player loaded");
        link.id = "collection-editor-css";
        link.rel = "stylesheet";
        link.href =
          "https://cdn.jsdelivr.net/npm/@tekdi/sunbird-collection-editor-web-component@6.1.0-beta.4/styles.css";
        document.head.appendChild(link);
      }

      if (!document.getElementById("sunbird-pdf-player-js")) {
        const pdfScript = document.createElement("script");
        pdfScript.id = "sunbird-pdf-player-js";
        pdfScript.src =
          "https://cdn.jsdelivr.net/npm/@project-sunbird/sunbird-pdf-player-web-component@1.4.0/sunbird-pdf-player.js";
        pdfScript.async = true;
        document.body.appendChild(pdfScript);
      }

      if (!document.getElementById("sunbird-pdf-player-css")) {
        const pdfLink = document.createElement("link");
        pdfLink.id = "sunbird-pdf-player-css";
        pdfLink.rel = "stylesheet";
        pdfLink.href =
          "https://cdn.jsdelivr.net/npm/@project-sunbird/sunbird-pdf-player-web-component@1.4.0/styles.css";
        document.head.appendChild(pdfLink);
      }

      if (!document.getElementById("sunbird-epub-player-js")) {
        const epubScript = document.createElement("script");
        epubScript.id = "sunbird-epub-player-js";
        epubScript.src =
          "https://cdn.jsdelivr.net/npm/@project-sunbird/sunbird-epub-player-web-component@1.4.0/sunbird-epub-player.js";
        epubScript.async = true;
        document.body.appendChild(epubScript);
      }

      if (!document.getElementById("sunbird-epub-player-css")) {
        const epubLink = document.createElement("link");
        epubLink.id = "sunbird-epub-player-css";
        epubLink.rel = "stylesheet";
        epubLink.href =
          "https://cdn.jsdelivr.net/npm/@project-sunbird/sunbird-epub-player-web-component@1.4.0/styles.css";
        document.head.appendChild(epubLink);
      }

      const videoScript = document.createElement("script");
      console.log("Video Player loaded");
      videoScript.id = "sunbird-video-player.js";
      videoScript.src =
        "https://cdn.jsdelivr.net/npm/@project-sunbird/sunbird-video-player-web-component@1.2.5/sunbird-video-player.js";
      videoScript.async = true;
      document.body.appendChild(videoScript);

      const videoLink = document.createElement("link");
      videoLink.id = "sunbird-video-player-css";
      videoLink.rel = "stylesheet";
      videoLink.href =
        "https://cdn.jsdelivr.net/npm/@project-sunbird/sunbird-video-player-web-component@1.2.5/styles.css";
      document.head.appendChild(videoLink);
    };

    loadAssets();

    return () => {
      const reflectScript = document.getElementById("reflect-metadata");
      const editorScript = document.getElementById("collection-editor-js");
      const editorCSS = document.getElementById("collection-editor-css");

      if (reflectScript) document.head.removeChild(reflectScript);
      if (editorScript) document.body.removeChild(editorScript);
      if (editorCSS) document.head.removeChild(editorCSS);
    };
  }, []);

  useEffect(() => {
    if (assetsLoaded && editorRef.current && !isAppendedRef.current) {
      const collectionEditorElement = document.createElement("lib-editor");

      collectionEditorElement.setAttribute(
        "editor-config",
        JSON.stringify(editorConfig)
      );

      collectionEditorElement.addEventListener(
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
            else if( event.detail?.action === "publishContent")
            {
              sendContentPublishNotification();
            }
            else if( event.detail?.action === "rejectContent")
            {
              sendContentRejectNotification();
            }
            else {
              window.history.back();
            }
            localStorage.removeItem("contentMode");

            
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

      editorRef.current.appendChild(collectionEditorElement);
      isAppendedRef.current = true;
    }
  }, [assetsLoaded]);

  return (
    <div>
      {assetsLoaded ? <div ref={editorRef}></div> : <p>Loading editor...</p>}
    </div>
  );
};
export default CollectionEditor;
