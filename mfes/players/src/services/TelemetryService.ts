import { ContentCreate, ContentType } from "../utils/Interface";
import {
 createAssessmentTracking,
 createContentTracking,
 fetchBulkContents,
 updateCOurseAndIssueCertificate,
} from "./PlayerService";


const lastAccessOn = new Date().toISOString();


// Generate a proper UUID for anonymous users
const generateUUID = (): string => {
 const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
   /[xy]/g,
   function (c) {
     const r = (Math.random() * 16) | 0;
     const v = c === "x" ? r : (r & 0x3) | 0x8;
     return v.toString(16);
   }
 );
 console.log("🔧 Generated UUID:", uuid);
 console.log(
   "🔧 UUID format validation:",
   /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
     uuid
   )
 );
 return uuid;
};


// Helper function to get cookie value
const getCookie = (name: string): string | null => {
 const value = `; ${document.cookie}`;
 const parts = value.split(`; ${name}=`);
 if (parts.length === 2) {
   return parts.pop()?.split(";").shift() || null;
 }
 return null;
};


export const handleExitEvent = () => {
 const previousPage = sessionStorage.getItem("previousPage");
 if (previousPage) {
   window.location.href = previousPage;
 } else {
   window.history.go(-1);
 }
};


export const handlePlayerEvent = (event: any) => {
 console.log("Player Event", event.detail);
 if (event?.detail?.edata?.type === "EXIT") {
   handleExitEvent();
 }
};


export const handleTelemetryEventPDF = async (event: any) => {
 return await getTelemetryEvents(event.detail, "pdf");
};


export const handleTelemetryEventQuml = async (
 event: any,
 { courseId, unitId, userId, configFunctionality }: any = {}
) => {
 return await getTelemetryEvents(event.data, "quml", {
   courseId,
   unitId,
   userId,
   configFunctionality,
 });
};


export const getTelemetryEvents = async (
 eventData: any,
 contentType: string,
 { courseId, unitId, userId, configFunctionality }: any = {}
) => {
 console.log("🎯 getTelemetryEvents called with:", {
   eventData,
   contentType,
   courseId,
   unitId,
   userId,
   configFunctionality,
 });


 if (!eventData || (!eventData.object?.id && !eventData.gdata?.id)) {
   console.error("❌ Invalid event data - missing object.id or gdata.id");
   return;
 }


 const identifier = eventData.object?.id || eventData.gdata?.id;
 const { eid, edata } = eventData;
 const telemetryKey = `${contentType}_${identifier}_${eid}`;
 console.log("telemetryKey", telemetryKey);
 console.log("eventData", eventData);
 const telemetryData = {
   eid,
   edata,
   identifier,
   contentType,
 };


 console.log(`${eid}Telemetry`, telemetryData);


 localStorage.setItem(telemetryKey, JSON.stringify(telemetryData));


 if (eid === "START") {
   console.log(
     "🎯 START event detected, calling contentWithTelemetryData with:",
     {
       identifier,
       detailsObject: [telemetryData],
       courseId,
       unitId,
       userId,
       configFunctionality,
     }
   );


   await contentWithTelemetryData({
     identifier,
     detailsObject: [telemetryData],
     courseId,
     unitId,
     userId,
     configFunctionality,
   });
 }


 if (eid === "END" || (contentType === "quml" && eid === "SUMMARY")) {
   try {
     const detailsObject: any[] = [];


     if (typeof window !== "undefined" && window.localStorage) {
       const keys = Object.keys(localStorage);


       // Filter keys for relevant telemetry events based on identifier
       const relevantKeys = keys.filter((key) => key.includes(identifier));


       relevantKeys.forEach((key) => {
         const telemetryEvent = localStorage.getItem(key);
         if (telemetryEvent) {
           const parsedTelemetryEvent = JSON.parse(telemetryEvent);
           let progressFromSummary = null;
           let progressFromExtra = null;


           // Check `summary` for progress
           if (parsedTelemetryEvent?.edata?.summary?.length > 0) {
             progressFromSummary =
               parsedTelemetryEvent.edata.summary[0]?.progress;
           }


           // Check `extra` for progress
           if (parsedTelemetryEvent?.edata?.extra?.length > 0) {
             const progressEntry = parsedTelemetryEvent.edata.extra.find(
               (entry: any) => entry.id === "progress"
             );
             if (progressEntry) {
               progressFromExtra = parseInt(progressEntry.value, 10);
             }
           }


           // Skip event if `eid === 'END'` and progress is not 100 in either `summary` or `extra`
           // if (
           //   parsedTelemetryEvent?.eid === 'END' &&
           //   ((progressFromSummary !== 100 && progressFromSummary !== null) ||
           //     (progressFromExtra !== 100 && progressFromExtra !== null))
           // ) {
           //   return;
           // }


           // Push parsed telemetry event
           detailsObject.push(parsedTelemetryEvent);
         }
       });


       // After processing all keys, check if an END event exists in detailsObject for html or h5p
       let hasEndEvent = true;


       if (
         localStorage.getItem("mimeType") === ContentType.H5P ||
         localStorage.getItem("mimeType") === ContentType.HTML
       ) {
         detailsObject.forEach((event) => {
           if (event.eid === "END") {
             hasEndEvent = false;
           }
         });
         if (!hasEndEvent) {
           detailsObject.push({
             eid: "END",
             edata: {
               duration: 0,
               mode: "play",
               pageid: "sunbird-player-Endpage",
               summary: [
                 {
                   progress: 100,
                 },
                 {
                   totallength: "",
                 },
                 {
                   visitedlength: "",
                 },
                 {
                   visitedcontentend: "",
                 },
                 {
                   totalseekedlength: "",
                 },
                 {
                   endpageseen: false,
                 },
               ],
               type: "content",
             },
           });
         }
         // });
       }
     }


     try {
       // For QuML/Assessments, aggregate question data for the assessment tracking API
       if (contentType === "quml") {
         const assessEvents = detailsObject
           .filter((e: any) => e.eid === "ASSESS")
           .map((e: any) => ({
             ...e.edata,
             sectionName: e.edata?.item?.sectionName || "Section",
           }));


         if (assessEvents.length > 0) {
           const assessmentSummary = [
             {
               sectionId: identifier,
               sectionName: "Section",
               data: assessEvents,
             },
           ];


           const endEvent = detailsObject.find((e: any) => e.eid === "END");
           const timeSpent = endEvent?.edata?.duration || 0;


           console.log("🎯 Triggering Assessment Tracking from TelemetryService");
           await createAssessmentTracking({
             contentId: identifier,
             assessmentSummary,
             courseId,
             unitId,
             userId,
             timeSpent,
             mid: eventData?.mid
           });
         }
       }


       await contentWithTelemetryData({
         identifier,
         detailsObject,
         courseId,
         unitId,
         userId,
         configFunctionality,
       });
     } catch (error) {
       console.log(error);
     }
     console.log("Telemetry END event successfully logged:");
   } catch (error) {
     console.error("Error logging telemetry END event:", error);
   }
 }
};


export const contentWithTelemetryData = async ({
 identifier,
 detailsObject,
 courseId,
 unitId,
 userId: propUserId,
 configFunctionality,
}: any) => {
 console.log("🎯 contentWithTelemetryData called with:", {
   identifier,
   detailsObject,
   courseId,
   unitId,
   userId: propUserId,
   configFunctionality,
 });


 if (configFunctionality.trackable === false) {
   console.log("❌ Content not trackable, skipping tracking");
   return false;
 }
 try {
   const response = await fetchBulkContents([identifier, courseId]);
   const course = response?.find(
     (content: any) => content.identifier === identifier
   );
   console.log("course 258", response);
   const resolvedMimeType = response?.[0]?.mimeType || null;
   console.log("fetchBulkContents", response, resolvedMimeType);
   if (!resolvedMimeType) {
     console.error("Failed to fetch mimeType.");
     return;
   }


   let userId = "";


   // PRIORITY 1: URL parameters (works across ports)
   if (
     propUserId &&
     propUserId !== "" &&
     propUserId !== "null" &&
     propUserId !== "undefined"
   ) {
     userId = propUserId;
   } else {
     console.log("🔧 ❌ No userId in URL parameters, trying other methods...");
   }


   // PRIORITY 2: Cookies (fallback for same port)
   if (!userId) {
     const cookies = document.cookie.split(";");
     for (const cookie of cookies) {
       const [name, value] = cookie.trim().split("=");
       if (name === "userId" && value) {
         userId = value;
         break;
       }
     }
   }


   // PRIORITY 3: localStorage (fallback)
   if (!userId && typeof window !== "undefined" && window.localStorage) {
     const storedUserId = localStorage.getItem("userId");
     if (
       storedUserId &&
       storedUserId !== "null" &&
       storedUserId !== "undefined" &&
       storedUserId !== ""
     ) {
       userId = storedUserId;
     }
   }


   // PRIORITY 4: Generate UUID (final fallback)
   if (!userId) {
     userId = generateUUID();
   }


   const ContentTypeReverseMap = Object.fromEntries(
     Object.entries(ContentType).map(([key, value]) => [value, key])
   );


   // Determine content type with proper fallback
   let contentType = ContentTypeReverseMap[resolvedMimeType] || "";
   if (!contentType || contentType === "") {
     // Provide fallback based on mime type
     if (resolvedMimeType === "application/vnd.ekstep.ecml-archive") {
       contentType = "quml"; // For ECML question sets
     } else if (resolvedMimeType === "application/pdf") {
       contentType = "pdf";
     } else if (
       resolvedMimeType.includes("video") ||
       resolvedMimeType === "video/x-youtube"
     ) {
       contentType = "video"; // For all video types including YouTube
     } else if (resolvedMimeType === "application/epub") {
       contentType = "epub";
     } else {
       contentType = "interactive"; // Default fallback
     }
     console.warn(
       `No content type mapping found for ${resolvedMimeType}, using fallback: ${contentType}`
     );
   }


   console.log(
     "🎯 Determined content type:",
     contentType,
     "for mime type:",
     resolvedMimeType
   );


   const reqBody: ContentCreate = {
     userId: userId,
     contentId: identifier,
     courseId: courseId && unitId ? courseId : identifier,
     unitId: courseId && unitId ? unitId : identifier,
     contentType: contentType,
     contentMime: resolvedMimeType,
     lastAccessOn: lastAccessOn,
     detailsObject: detailsObject,
   };


   console.log("🎯 Calling createContentTracking with reqBody:", reqBody);


   const telemetryResponse = await createContentTracking(reqBody);


   console.log("🎯 createContentTracking response:", telemetryResponse);


   if (
     telemetryResponse &&
     configFunctionality.isGenerateCertificate !== false
   ) {
     await updateCOurseAndIssueCertificate({
       userId,
       course,
       unitId,
       isGenerateCertificate: configFunctionality.isGenerateCertificate,
     });
   }
 } catch (error) {
   console.error("Error in contentWithTelemetryData:", error);
 }
};

