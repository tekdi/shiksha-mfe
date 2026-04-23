// pages/content-details/[identifier].tsx

import React from "react";
import dynamic from "next/dynamic";

const title = "Welcome to Shiksha myLearning!";
const description = `Shiksha addresses gaps in education systems with innovative, low-cost, replicable interventions that span the age spectrum. Working both directly and through government systems, these programs collectively reach millions of children and thousands of school dropouts each year. In “direct” work, a Pratham instructor works with children either in the school or in the community, whereas the “partnership” model involves Pratham teams working closely with government teams at the state, district or city level to design and implement programs. Pratham’s approach to improving learning outcomes continues to serve as a model, both within India and beyond.`;

export const metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    images: [
      {
        url: `/images/prathamQR.png`,
        width: 800,
        height: 600,
      },
    ],
    type: "website",
  },
};

const Home = dynamic(() => import("@learner/app/home/page"), {
  ssr: false,
});
const App = () => {
  return <Home />;
};

export default App;
