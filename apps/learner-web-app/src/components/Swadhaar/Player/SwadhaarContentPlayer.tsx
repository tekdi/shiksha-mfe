"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Box, CircularProgress, Typography } from "@mui/material";
import { transformImageUrl } from "@learner/utils/imageUtils";

import { VideoBlob } from "./blobs/VideoBlob";
import { ImageBlob } from "./blobs/ImageBlob";
import { TextCardBlob } from "./blobs/TextCardBlob";
import { QuestionSetPlayer, Question } from "./blobs/QuestionSetPlayer";
import { getQuestions } from "@learner/utils/API/SwadhaarService";

/* Sunbird iframe player — loaded dynamically to avoid SSR issues */
const SunbirdPlayer = dynamic(
  () => import("@learner/components/Content/Player"),
  { ssr: false },
);

const DARK_NAV = "#1C2B4A";

function normalizeContentUrl(url?: string): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.includes("https://sunbirdsaaspublic.blob.core.windows.net")) {
      const parts = trimmed.split("https://sunbirdsaaspublic.blob.core.windows.net/");
      if (parts.length > 1) {
        let cleanPath = parts[1].replace(/^content\/content\//, "").replace(/^sunbird-content-prod\/schemas\/content\//, "");
        return `https://s3.ap-south-1.amazonaws.com/saas-prod/content/${cleanPath}`;
      }
  }
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || (typeof window !== "undefined" ? window.location.origin : "");
  if (!base) return trimmed;
  return `${base.replace(/\/$/, "")}/${trimmed.replace(/^\//, "")}`;
}

export interface SwadhaarContentPlayerProps {
  identifier: string;
  courseId: string;
  unitId?: string;
  mimeType?: string;
  contentType?: string;
  contentUrl?: string;
  posterImage?: string;
  name: string;
  description?: string;
  body?: string;
  subheading?: string;
  children?: Question[];
  attempts?: number;
  initialProgress?: number;
  isCompleted?: boolean;
  onProgress?: (percentage: number) => void;
  onComplete: (score?: number) => void;
  onQuizFail?: () => void;
}

type BlobType = "video" | "image" | "questionset" | "text" | "sunbird";

function resolveBlobType(mimeType?: string, contentType?: string): BlobType {
  const mt = (mimeType || "").toLowerCase();
  const ct = (contentType || "").toLowerCase();
  if (mt.startsWith("video/") || mt === "application/vnd.ekstep.video" || ct.includes("video")) return "video";
  if (mt.startsWith("image/") || ct.includes("image")) return "image";
  if (mt === "application/vnd.sunbird.questionset" || ct === "questionset") return "questionset";
  if (mt === "application/vnd.ekstep.html-archive" || mt.startsWith("text/") || ct === "html") return "text";
  return "sunbird";
}

async function fetchContentDetails(identifier: string): Promise<Record<string, any>> {
  try {
    const base = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || "";
    const tenantId = typeof window !== "undefined" ? localStorage.getItem("tenantId") || "" : "";
    const resp = await fetch(`${base}/api/content/v1/read/${identifier}?fields=artifactUrl,downloadUrl,streamingUrl,posterImage,appIcon,mimeType,contentType,body,description,children,childNodes,maxAttempts`, { headers: { tenantId } });
    const json = await resp.json();
    return json?.result?.content || json?.result?.questionset || {};
  } catch (err) {
    return {};
  }
}

export const SwadhaarContentPlayer: React.FC<SwadhaarContentPlayerProps> = ({
  identifier, courseId, unitId, mimeType, contentType, contentUrl: propContentUrl, posterImage: propPosterImage,
  name, description, body: propBody, subheading, children, attempts, initialProgress, isCompleted, onProgress, onComplete, onQuizFail,
}) => {
  const blobType = resolveBlobType(mimeType, contentType);
  const needsUrl = blobType === "video" || blobType === "image";
  const [contentUrl, setContentUrl] = useState<string>(normalizeContentUrl(propContentUrl));
  const [posterImage, setPosterImage] = useState<string>(transformImageUrl(propPosterImage || ""));
  const [body, setBody] = useState<string>(propBody || "");
  const [questionItems, setQuestionItems] = useState<Question[]>(children || []);
  const [maxAttempts, setMaxAttempts] = useState<number>(5);
  const [questionsetInstructions, setQuestionsetInstructions] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (propContentUrl) setContentUrl(normalizeContentUrl(propContentUrl));
    if (propPosterImage) setPosterImage(transformImageUrl(propPosterImage));
    if (propBody) setBody(propBody);
    if (children) setQuestionItems(children);
  }, [propContentUrl, propPosterImage, propBody, children]);

  useEffect(() => {
    if (!identifier) return;
    
    const loadFullDetails = async () => {
      setLoading(true);
      const data = await fetchContentDetails(identifier);
      
      if (data.maxAttempts) setMaxAttempts(data.maxAttempts);
      // Extract instructions field from questionset (used in "Before you begin" section)
      if (blobType === 'questionset' && data.instructions) {
        const instrHtml = typeof data.instructions === 'string'
          ? data.instructions
          : data.instructions?.default || '';
        setQuestionsetInstructions(instrHtml);
      }
      if (blobType === 'questionset' && data.description) {
        setQuestionsetDescription(data.description);
      }
      
      if (blobType === 'questionset' && data.children && data.children.length > 0) {
        const firstSection = data.children[0];
        if (firstSection.name) setSectionName(firstSection.name);
        if (firstSection.description) setSectionDescription(firstSection.description);
      }

      if (needsUrl && !propContentUrl) {
        const url = normalizeContentUrl(data.streamingUrl || data.artifactUrl || data.downloadUrl || "");
        if (url) setContentUrl(url);
        const poster = transformImageUrl(data.posterImage || data.appIcon || "");
        if (poster) setPosterImage(poster);
      }
      
      if (blobType === "text" && !propBody && !description) {
        if (data.body) setBody(data.body);
      }

      if (blobType === "questionset" && (!children || children.length === 0)) {
        const fullQuestions: Question[] = [];
        // Only IDs confirmed to be actual question leaf nodes (not section container IDs)
        const leafQuestionIds: string[] = [];
        
        const collect = (nodes: any[], depth = 0) => {
          nodes.forEach(n => {
            const hasChildren = n.children && n.children.length > 0;
            if (hasChildren) {
              // Container node (section) — recurse into it
              collect(n.children, depth + 1);
            } else {
              // Leaf node inside a questionset hierarchy is always a question
              // (section containers always have children; leaves are questions)
              if (n.editorState || n.options || n.body) {
                // Already has full question data
                fullQuestions.push(n);
              } else if (n.identifier) {
                // Stub — needs to be fetched by ID
                leafQuestionIds.push(n.identifier);
              }
            }
          });
        };

        const hierarchyChildren = data.children || [];
        if (Array.isArray(hierarchyChildren) && hierarchyChildren.length > 0) {
          // Walk the hierarchy to find actual question leaf nodes.
          // Never use childNodes here — it mixes section IDs and question IDs.
          collect(hierarchyChildren);
        } else if (data.childNodes && data.childNodes.length > 0) {
          // No hierarchy children — this is a truly flat questionset (no sections).
          // In this case childNodes are direct question IDs, not section IDs.
          leafQuestionIds.push(...data.childNodes);
        }

        if (leafQuestionIds.length > 0) {
          const detailed = await getQuestions(leafQuestionIds);
          setQuestionItems([...fullQuestions, ...detailed]);
        } else {
          setQuestionItems(fullQuestions);
        }
      }
      setLoading(false);
    };

    if (identifier && (blobType === "questionset" || (needsUrl && !propContentUrl) || (blobType === "text" && !propBody && !description))) {
      loadFullDetails();
    }
  }, [identifier, blobType, needsUrl, propContentUrl, propBody, description, children]);

  // ── Iframe Message Listener for Sunbird Content (PDF/EPUB/ECML) ──
  useEffect(() => {
    if (blobType !== "sunbird") return;

    const handlePlayerMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        console.log('[CONTENT-PLAYER] Received message:', data?.eid || data?.event || 'unknown');
        
        // Sunbird player sends 'END' or 'SUMMARY' when content finishes
        if (data?.eid === 'END' || data?.eid === 'SUMMARY') {
          console.log('[CONTENT-PLAYER] Completion event detected from iframe');
          onComplete?.();
        }
      } catch (e) {
        // ignore non-JSON messages
      }
    };

    window.addEventListener('message', handlePlayerMessage);
    return () => window.removeEventListener('message', handlePlayerMessage);
  }, [blobType, onComplete]);

  const [hasStartedAttempt, setHasStartedAttempt] = useState(false);
  const [prevAttempts, setPrevAttempts] = useState(attempts);
  const [refreshedAttempts, setRefreshedAttempts] = useState<number | null>(null);
  const [questionsetDescription, setQuestionsetDescription] = useState<string | undefined>(undefined);
  const [sectionName, setSectionName] = useState<string | undefined>(undefined);
  const [sectionDescription, setSectionDescription] = useState<string | undefined>(undefined);

  // Local storage tracking keyed by userId+identifier so it is user-specific.
  // This means the same device shared by multiple users won't leak attempt counts.
  // The key also persists across sessions for the SAME user, so re-logging doesn't reset
  // the locally-tracked attempts when the backend hasn't caught up.
  const getAttemptKey = () => {
    const uid = typeof window !== 'undefined' ? (localStorage.getItem('userId') || 'anon') : 'anon';
    return `quiz_attempts_${uid}_${identifier}`;
  };

  const [localAttempts, setLocalAttempts] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const uid = localStorage.getItem('userId') || 'anon';
      const stored = localStorage.getItem(`quiz_attempts_${uid}_${identifier}`);
      if (stored) {
        const parsed = parseInt(stored, 10);
        // Always take the max of local and backend — never go backwards
        if (!isNaN(parsed)) return Math.max(parsed, attempts || 0);
      }
    }
    return attempts || 0;
  });

  // Sync: if backend returns a HIGHER count than local (e.g. completed on another device),
  // update local. Guard against inflating past maxAttempts from an optimistic update.
  useEffect(() => {
    if (attempts && attempts > localAttempts && attempts <= maxAttempts) {
      setLocalAttempts(attempts);
      if (typeof window !== 'undefined') {
        localStorage.setItem(getAttemptKey(), attempts.toString());
      }
    }
  }, [attempts, identifier, localAttempts, maxAttempts]);

  useEffect(() => {
    const cur = attempts ?? 0;
    const prev = prevAttempts ?? 0;
    if (cur > prev) {
      setHasStartedAttempt(false);
      setPrevAttempts(cur);
    }
  }, [attempts, prevAttempts]);

  const handleQuizComplete = React.useCallback(async (score?: number) => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : '';
    const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : '';

    // Determine pass/fail (70% threshold)
    const totalQs = questionItems.length;
    const scorePct = (totalQs > 0 && score !== undefined) ? (score / totalQs) * 100 : 0;
    const quizPassed = scorePct >= 70;

    const newCount = (localAttempts || 0) + 1;
    setLocalAttempts(newCount);
    setHasStartedAttempt(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(getAttemptKey(), newCount.toString());
    }

    if (userId && tenantId && courseId) {
      try {
        const { updateContentStatus, getContentCourseStatus } = await import('@learner/utils/API/SwadhaarService');

        // 1. Send update to backend — completed only if passed, else in-progress
        await updateContentStatus({
          userId,
          courseId,
          contentId: identifier,
          status: quizPassed ? 2 : 1,
          completionPercentage: Math.round(scorePct),
          score,
          attempts: newCount,
        });

        // 2. Refresh status to see if backend accepted our number
        const afterStatus = await getContentCourseStatus([userId], [courseId, identifier], tenantId);
        const contentStatus = afterStatus.find(s => s.contentId === identifier);

        if (contentStatus?.attempts && contentStatus.attempts > newCount) {
          setLocalAttempts(contentStatus.attempts);
          localStorage.setItem(getAttemptKey(), contentStatus.attempts.toString());
        }
      } catch (e) {
        console.warn('[QUIZ_PLAYER] Failed to sync status:', e);
      }
    }

    if (quizPassed) {
      onComplete?.(score);
    } else {
      // Score < 70% — show fail modal instead of completion flow
      onQuizFail?.();
    }
  }, [courseId, identifier, localAttempts, onComplete, onQuizFail, questionItems.length]);

  if (loading) {
    return (
      <Box sx={{ borderRadius: "12px", border: "1px solid #E5E7EB", bgcolor: "#fff", mb: 2, overflow: "hidden" }}>
        <Box sx={{ bgcolor: DARK_NAV, px: 2, py: 1 }}><Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Loading…</Typography></Box>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 160 }}><CircularProgress size={32} sx={{ color: "#E6873C" }} /></Box>
      </Box>
    );
  }

  const currentAttemptsValue = refreshedAttempts !== null ? refreshedAttempts : (localAttempts || 0);
  const effectiveAttempts = hasStartedAttempt ? (currentAttemptsValue || 0) + 1 : (currentAttemptsValue || 0);
  const isReviewMode = currentAttemptsValue >= maxAttempts;

  switch (blobType) {
    case "video":
      if (!contentUrl) {
        return <SunbirdPlayer identifier={identifier} courseId={courseId} unitId={unitId} isEmbedded={true} userIdLocalstorageName="userId" mode={isReviewMode ? "review" : "play"} />;
      }
      return <VideoBlob name={name} contentUrl={contentUrl} mimeType={mimeType} posterImage={posterImage || undefined} initialProgress={initialProgress} isCompleted={isCompleted} onProgress={onProgress} onComplete={onComplete} />;
    case "image":
      if (!contentUrl) return <SunbirdPlayer identifier={identifier} courseId={courseId} unitId={unitId} isEmbedded={true} userIdLocalstorageName="userId" mode={isReviewMode ? "review" : "play"} />;
      return <ImageBlob name={name} contentUrl={contentUrl} description={description} onComplete={onComplete} />;
    case "questionset": {
      // Derive already-passed status from backend initialProgress (persists across remounts)
      const alreadyPassed = (initialProgress !== undefined && initialProgress >= 70) || isCompleted === true;
      return (
        <QuestionSetPlayer
          name={name}
          description={description}
          questions={questionItems || []}
          maxAttempts={maxAttempts}
          currentAttempts={effectiveAttempts}
          mode={isReviewMode ? 'review' : 'play'}
          instructions={questionsetInstructions}
          questionsetDescription={questionsetDescription}
          sectionName={sectionName}
          sectionDescription={sectionDescription}
          initiallyPassed={alreadyPassed}
          onStart={() => {
            setHasStartedAttempt(true);
            import('@learner/utils/API/SwadhaarService').then(m => m.trackCourseClick(courseId, identifier));
          }}
          onComplete={handleQuizComplete}
        />
      );
    }
    case "text":
      return <TextCardBlob name={name} body={body || description || ""} subheading={subheading} description={description} onComplete={onComplete} />;
    default:
      if (identifier) return <SunbirdPlayer identifier={identifier} courseId={courseId} unitId={unitId} isEmbedded={true} userIdLocalstorageName="userId" mode={isReviewMode ? "review" : "play"} />;
      return null;
  }
};

export default SwadhaarContentPlayer;
