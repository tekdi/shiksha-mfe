// pages/content/[courseId].tsx

import React from "react";
import { getMetadata } from "@learner/utils/API/metabaseService";
import ContentCourseClient from "./ContentCourseClient";

export async function generateMetadata({ params }: any) {
  return await getMetadata(params.courseId);
}

const App = () => {
  return <ContentCourseClient />;
};

export default App;
