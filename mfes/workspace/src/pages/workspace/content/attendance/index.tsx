/* eslint-disable @nx/enforce-module-boundaries */
// mfes/workspace/src/pages/workspace/content/attendance/index.tsx
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import WorkspaceHeader from "@workspace/components/WorkspaceHeader";
import Layout from "@workspace/components/Layout";
import SimpleTeacherDashboard from "@workspace/components/SimpleTeacherDashboard";

const Attendance = () => {
  const router = useRouter();
  const [showHeader, setShowHeader] = useState<boolean | null>(null);
  const [selectedKey, setSelectedKey] = useState("attendance");

  useEffect(() => {
    const headerValue = localStorage.getItem("showHeader");
    setShowHeader(headerValue === "true");
  }, []);

  return (
    <>
      {showHeader && <WorkspaceHeader />}
      <Layout selectedKey={selectedKey} onSelect={setSelectedKey}>
        <SimpleTeacherDashboard />
      </Layout>
    </>
  );
};

export default Attendance;
