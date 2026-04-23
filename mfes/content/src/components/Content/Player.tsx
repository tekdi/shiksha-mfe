'use client';
import { useParams } from 'next/navigation';
import React from 'react';
interface PlayerPageProps {
  id?: string; // Define the type for the 'id' prop
}
const getSbPlayerBaseUrl = () => {
  if (typeof window !== "undefined") {
    const origin = window.location.origin.replace(/\/$/, "");
    return `${origin}/sbplayer`;
  }
  const fallback = process.env.NEXT_PUBLIC_LEARNER_SBPLAYER || "";
  if (!fallback) return "/sbplayer";
  return fallback.endsWith("/sbplayer")
    ? fallback
    : `${fallback.replace(/\/$/, "")}/sbplayer`;
};

const PlayerPage: React.FC<PlayerPageProps> = ({ id }) => {
  const params = useParams();
  const { identifier, courseId, unitId } = params; // string | string[] | undefined
  if (!identifier) {
    return <div>Loading...</div>;
  }

  return (
    <iframe
      src={`${getSbPlayerBaseUrl()
        }?identifier=${identifier}${courseId && unitId ? `&courseId=${courseId}&unitId=${unitId}` : ''
        }`}
      style={{
        // display: 'block',
        // padding: 0,
        border: 'none',
        height: 'calc(100vh - 60px)',
      }}
      width="100%"
      height="100%"
      title="Embedded Localhost"
    />
  );
};

export default PlayerPage;
