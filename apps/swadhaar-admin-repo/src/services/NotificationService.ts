import axios from 'axios';
import { API_ENDPOINTS } from '@/utils/API/APIEndpoints';

export interface SendInAppNotificationParams {
  userId: string;
  title: string;
  message: string;
  /** Admin's own details, shown to the learner as the sender. */
  sender?: { id?: string; name?: string };
}

/** Sends an in-app notification to one user (shown in the learner app's Alerts). Throws on failure. */
export const sendInAppNotification = async ({
  userId,
  title,
  message,
  sender,
}: SendInAppNotificationParams): Promise<void> => {
  const response = await axios.post(
    API_ENDPOINTS.notificationInApp,
    {
      userId,
      title,
      message,
      context: 'USER_NOTIFICATION',
      metadata: {
        senderName: sender?.name || 'Admin',
        senderDesignation: 'Admin',
        senderId: sender?.id || '',
      },
    },
    { headers: { 'Content-Type': 'application/json' } }
  );
  const data = response?.data;
  const ok = data?.responseCode === 'OK' || data?.params?.status === 'successful';
  if (!ok) {
    throw new Error(data?.params?.errmsg || 'Failed to send notification');
  }
};
