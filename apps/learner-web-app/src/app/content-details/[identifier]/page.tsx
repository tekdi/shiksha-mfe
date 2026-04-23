// pages/content-details/[identifier].tsx

import React from "react";
import { getMetadata } from "@learner/utils/API/metabaseService";
import ContentDetailsClient from "./ContentDetailsClient";

export async function generateMetadata({ params }: any) {
  return await getMetadata(params.identifier);
}

const App = () => {
  return <ContentDetailsClient />;
};

export default App;
