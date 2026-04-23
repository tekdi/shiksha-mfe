// 'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { getMetadata } from '@learner/utils/API/metabaseService';
import Layout from '@learner/components/themantic/layout/Layout';

export async function generateMetadata({ params }: any) {
  return await getMetadata(params.identifier);
}

const Player = dynamic(
  () => import('@learner/components/themantic/content/Player'),
  {
    ssr: false,
  }
);

const HomePage: React.FC = () => {
  return (
    <Layout sx={{ backgroundImage: 'url(/images/energy-background.png)' }}>
      <Player
        userIdLocalstorageName="userId"
        contentBaseUrl="/themantic"
        _config={{
          player: {
            trackable: false,
          },
        }}
      />
    </Layout>
  );
};

export default HomePage;
