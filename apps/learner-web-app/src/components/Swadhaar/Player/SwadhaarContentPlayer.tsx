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
  name, description, body: propBody, subheading, children, attempts, initialProgress, isCompleted, onProgress, onComplete,
}) => {
  const blobType = resolveBlobType(mimeType, contentType);
  const needsUrl = blobType === "video" || blobType === "image";
  const [contentUrl, setContentUrl] = useState<string>(normalizeContentUrl(propContentUrl));
  const [posterImage, setPosterImage] = useState<string>(transformImageUrl(propPosterImage || ""));
  const [body, setBody] = useState<string>(propBody || "");
  const [questionItems, setQuestionItems] = useState<Question[]>(children || []);
  const [maxAttempts, setMaxAttempts] = useState<number>(5);
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
        const questionIds: string[] = data.childNodes || [];
        const fullQuestions: Question[] = [];
        
        const collect = (nodes: any[]) => {
          nodes.forEach(n => {
            if (n.children && n.children.length > 0) {
              collect(n.children);
            } else if (n.objectType === "Question" || n.qType || n.body) {
              if (n.editorState || n.options) {
                 fullQuestions.push(n);
              } else {
                 questionIds.push(n.identifier);
              }
            }
          });
        };

        const hierarchyChildren = data.children || [];
        if (Array.isArray(hierarchyChildren) && hierarchyChildren.length > 0) {
          collect(hierarchyChildren);
        }

        if (questionIds.length > 0) {
          const detailed = await getQuestions(questionIds);
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

  if (loading) {
    return (
      <Box sx={{ borderRadius: "12px", border: "1px solid #E5E7EB", bgcolor: "#fff", mb: 2, overflow: "hidden" }}>
        <Box sx={{ bgcolor: DARK_NAV, px: 2, py: 1 }}><Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Loading…</Typography></Box>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 160 }}><CircularProgress size={32} sx={{ color: "#E6873C" }} /></Box>
      </Box>
    );
  }

  switch (blobType) {
    case "video":
      if (!contentUrl) return <SunbirdPlayer identifier={identifier} courseId={courseId} unitId={unitId} isEmbedded={true} userIdLocalstorageName="userId" />;
      return <VideoBlob name={name} contentUrl={contentUrl} mimeType={mimeType} posterImage={posterImage || undefined} initialProgress={initialProgress} isCompleted={isCompleted} onProgress={onProgress} onComplete={onComplete} />;
    case "image":
      if (!contentUrl) return <SunbirdPlayer identifier={identifier} courseId={courseId} unitId={unitId} isEmbedded={true} userIdLocalstorageName="userId" />;
      return <ImageBlob name={name} contentUrl={contentUrl} description={description} onComplete={onComplete} />;
    case "questionset":
      return (
        <QuestionSetPlayer 
          name={name} 
          questions={questionItems || []} 
          maxAttempts={maxAttempts} 
          currentAttempts={attempts} 
          onStart={() => {
            console.log('[QUIZ_PLAYER] Starting quiz. Incrementing attempts via trackCourseClick');
            import('@learner/utils/API/SwadhaarService').then(m => m.trackCourseClick(identifier));
          }}
          onComplete={(score) => onComplete(score)} 
        />
      );
    case "text":
      return <TextCardBlob name={name} body={body || description || ""} subheading={subheading} description={description} onComplete={onComplete} />;
    default:
      if (identifier) return <SunbirdPlayer identifier={identifier} courseId={courseId} unitId={unitId} isEmbedded={true} userIdLocalstorageName="userId" />;
      return null;
  }
};

export default SwadhaarContentPlayer;
