/**
 * NotificationService — In-App notification API helpers.
 * Uses the same middleware base URL as all other API calls.
 */

import { API_ENDPOINTS } from './EndUrls';

export interface ApiNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  context: string;
  link?: string;
  status: 'read' | 'unread';
  isRead?: boolean; // Added to match provided API response
  createdAt: string;
  metadata?: Record<string, any>;
}

/** Fetch in-app notifications for a user */
export async function fetchInAppNotifications(
  userId: string,
  status?: 'read' | 'unread',
  limit = 50
): Promise<ApiNotification[]> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') || '' : '';

    const params = new URLSearchParams({ userId, limit: String(limit) });
    if (status) params.set('status', status);

    const res = await fetch(`${API_ENDPOINTS.inAppNotifications}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        tenantid: tenantId,
      },
    });

    // Silently return empty if endpoint not deployed (404/405)
    if (res.status === 404 || res.status === 405) return [];
    if (!res.ok) return [];

    const json = await res.json();
    // Handle both { data: [...] } and plain array responses
    return Array.isArray(json) ? json : (json?.data ?? json?.result?.data ?? json?.result ?? []);
  } catch {
    // Network error or endpoint unavailable — fall back to local cache
    return [];
  }
}

export async function sendInAppNotification(params: {
  userId: string;
  title: string;
  message: string;
  context: string;
  link?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  const { userId, title, message, context, link = '', metadata } = params;
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') || '' : '';

    const res = await fetch(API_ENDPOINTS.inAppNotifications, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        tenantid: tenantId,
      },
      body: JSON.stringify({
        userId,
        title,
        message,
        context,
        link,
        metadata,
      }),
    });

    // Silently ignore if endpoint not deployed
    if (res.status === 404 || res.status === 405) return;
  } catch {
    // Endpoint unavailable — alerts still work via local storage
  }
}

/** Mark notifications as read */
export async function markNotificationsRead(
  userId: string,
  ids?: string[],
  markAll = false
): Promise<void> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') || '' : '';

    const payload: any = { userId };
    if (markAll) {
      payload.markAll = true;
    } else if (ids && ids.length > 0) {
      // Backend expects notificationId for single ID
      payload.notificationId = ids[0];
    }

    const res = await fetch(API_ENDPOINTS.inAppMarkRead, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        tenantid: tenantId,
      },
      body: JSON.stringify(payload),
    });

    // Silently ignore if endpoint not deployed
    if (res.status === 404 || res.status === 405) return;
  } catch {
    // Endpoint unavailable — mark-read still works via local storage
  }
}

/** Send a course-completion in-app notification to the user */
export async function sendCourseCompleteNotification(
  userId: string,
  courseName: string,
  userName: string
): Promise<void> {
  try {
    // Keep function signature for existing call sites, but use your required payload.
    await sendInAppNotification({
      userId,
      title: `${courseName} Completed`,
      message: 'Download Certificate for level completion',
      context: 'USER_NOTIFICATION',
      link: '/profile',
    });
  } catch (err) {
    console.warn('sendCourseCompleteNotification failed:', err);
  }
}
