/* eslint-disable @nx/enforce-module-boundaries */
import V1Player from '@workspace/components/V1-Player/V1Player';
import { getLocalStoredUserName } from '@workspace/services/LocalStorageService';
import { fetchContent } from '@workspace/services/PlayerService';
import { MIME_TYPE } from '@workspace/utils/app.config';
import $ from 'jquery';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { V1PlayerConfig } from '../../components/players/PlayerConfig';
import useTenantConfig from '@workspace/hooks/useTenantConfig';

const userFullName = getLocalStoredUserName() || 'Anonymous User';
const [firstName, lastName] = userFullName.split(' ');

const ReviewContentSubmissions = () => {
  const { tenantConfig, isLoading, error } = useTenantConfig();
  const router = useRouter();
  const { identifier } = router.query;

  useEffect(() => {
    if (!tenantConfig?.CHANNEL_ID) return;
    if (typeof window !== 'undefined') {
      window.$ = window.jQuery = $;
    }

    const loadContent = async () => {
      try {
        if (identifier) {
          const data = await fetchContent(identifier);
          if (
            MIME_TYPE.INTERACTIVE_MIME_TYPE.includes(data?.mimeType) ||
            data?.mimeType == MIME_TYPE.ECML_MIME_TYPE
          ) {
            V1PlayerConfig.metadata = data;
            V1PlayerConfig.context.contentId = data.identifier;
            V1PlayerConfig.context.channel = tenantConfig?.CHANNEL_ID;
            V1PlayerConfig.context.tags = [tenantConfig?.CHANNEL_ID];
            V1PlayerConfig.context.app = [tenantConfig?.CHANNEL_ID];
            V1PlayerConfig.context.userData.firstName = firstName;
            V1PlayerConfig.context.userData.lastName = lastName || '';
          }
        }
      } catch (error) {
        console.error('Failed to fetch content:', error);
      }
    };

    if (identifier) {
      loadContent();
    }
  }, [tenantConfig?.CHANNEL_ID, identifier]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '1rem',
        backgroundColor: '#f9f9f9',
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1000px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        }}
      >
        <V1Player playerConfig={V1PlayerConfig} />{' '}
      </div>
    </div>
  );
};

export default ReviewContentSubmissions;
