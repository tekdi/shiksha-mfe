/**
 * Swadhaar Alerts Store — localStorage CRUD helpers + API sync.
 * Key: 'swadhaar_alerts'
 */

import { ApiNotification } from './API/NotificationService';

export interface AlertCard {
  id: string;
  title: string;
  message: string;
  timestamp: string;       // ISO date string
  type: 'quiz' | 'content' | 'lesson' | 'feedback' | 'badge' | 'system' | 'completion';
  isRead: boolean;
  actionUrl?: string;
  locked?: boolean;
  lockedMessage?: string;
  metadata?: {
    courseId?: string;
    moduleId?: string;
    subtopicId?: string;
    feedbackId?: string;
    senderName?: string;
    senderRole?: string;
    senderDesignation?: string;
    senderLocation?: string;
    senderAvatar?: string | null;
    senderId?: string;
    messageBody?: string;
    link?: string;
  };
}

const STORAGE_KEY = 'swadhaar_alerts';
const COURSE_IDS_KEY = 'swadhaar_course_content_ids';

export function getAlerts(): AlertCard[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AlertCard[];
  } catch {
    return [];
  }
}

export function saveAlerts(alerts: AlertCard[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

export function markAsRead(id: string): void {
  const alerts = getAlerts();
  const updated = alerts.map((a) => (a.id === id ? { ...a, isRead: true } : a));
  saveAlerts(updated);
}

export function markAllAsReadLocal(): void {
  const alerts = getAlerts();
  const updated = alerts.map((a) => ({ ...a, isRead: true }));
  saveAlerts(updated);
}

export function getUnreadCount(): number {
  return getAlerts().filter((a) => !a.isRead).length;
}

export function addAlert(alert: AlertCard): void {
  const alerts = getAlerts();
  if (!alerts.find((a) => a.id === alert.id)) {
    saveAlerts([alert, ...alerts]);
  }
}

/** Map an API notification response to our local AlertCard shape */
export function mapApiNotificationToAlertCard(n: ApiNotification): AlertCard {
  const ctx = (n.context || '').toLowerCase();
  const titleText = (n.title || '').toLowerCase();

  let type: AlertCard['type'] = 'system';
  if (ctx.includes('completion') || ctx.includes('complete') || ctx.includes('badge')) type = 'completion';
  else if (ctx.includes('feedback') || ctx.includes('trainer') || titleText.includes('feedback')) type = 'feedback';
  else if (ctx.includes('quiz')) type = 'quiz';
  else if (ctx.includes('content')) type = 'content';
  else if (ctx.includes('lesson')) type = 'lesson';

  return {
    id: n.id,
    title: n.title,
    message: n.message,
    timestamp: n.createdAt,
    type,
    isRead: n.status === 'read' || n.isRead === true,
    actionUrl: type === 'feedback' ? `/alerts/feedback/${n.id}` : (n.link || undefined),
    metadata: {
      link: n.link,
      senderName: n.metadata?.senderName,
      senderRole: n.metadata?.senderRole,
      senderDesignation: n.metadata?.senderDesignation,
      senderLocation: n.metadata?.senderLocation,
      senderId: n.metadata?.senderId || (n as any).createdBy,
      messageBody: n.metadata?.messageBody || n.message,
      feedbackId: type === 'feedback' ? n.id : undefined,
    },
  };
}

/**
 * Fetches notifications from the API and merges with local cache.
 * API results take precedence; local-only entries (e.g. seeded) are kept.
 */
export async function fetchAndSyncAlerts(userId: string): Promise<AlertCard[]> {
  try {
    const { fetchInAppNotifications } = await import('./API/NotificationService');
    const apiNotifs = await fetchInAppNotifications(userId);

    if (apiNotifs.length === 0) {
      // No API data — return local cache
      return getAlerts();
    }

    const localMap = new Map(getAlerts().map((a) => [a.id, a]));

    const apiCards = apiNotifs.map((n) => {
      const card = mapApiNotificationToAlertCard(n);
      const local = localMap.get(card.id);
      if (local && local.isRead) {
        card.isRead = true; // Preserve local read state to prevent unread count from popping back up
      }
      return card;
    });

    const apiIds = new Set(apiCards.map((c) => c.id));

    // Keep local-only alerts (seeded) that aren't in the API result
    const localOnly = getAlerts().filter((a) => !apiIds.has(a.id));

    const merged = [...apiCards, ...localOnly].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    saveAlerts(merged);
    return merged;
  } catch {
    return getAlerts();
  }
}

/**
 * Seeds alerts from course/progress data on home page load.
 */
export function seedAlertsFromCourseData(params: {
  incompleteLessons?: Array<{ levelId: string; moduleId: string; subtopicId: string; name: string }>;
  newContentItems?: Array<{ contentId: string; name: string }>;
  completedLevels?: Array<{ levelName: string; levelId: string }>;
}): void {
  const existing = getAlerts();
  const existingIds = new Set(existing.map((a) => a.id));
  const newAlerts: AlertCard[] = [];

  params.incompleteLessons?.forEach((item) => {
    const id = `lesson-${item.subtopicId}`;
    if (!existingIds.has(id)) {
      newAlerts.push({
        id,
        type: 'lesson',
        title: 'Lesson Reminder',
        message: `You have an incomplete lesson in ${item.name}`,
        timestamp: new Date().toISOString(),
        isRead: false,
        actionUrl: `/learn/${item.levelId}/${item.moduleId}/${item.subtopicId}`,
        metadata: { courseId: item.levelId, moduleId: item.moduleId, subtopicId: item.subtopicId },
      });
    }
  });

  params.newContentItems?.forEach((item) => {
    const id = `content-${item.contentId}`;
    if (!existingIds.has(id)) {
      newAlerts.push({
        id,
        type: 'content',
        title: 'New Content Reminder',
        message: `Please complete new content: ${item.name}`,
        timestamp: new Date().toISOString(),
        isRead: false,
        metadata: { courseId: item.contentId },
      });
    }
  });

  params.completedLevels?.forEach((level) => {
    const id = `badge-${level.levelId}`;
    if (!existingIds.has(id)) {
      newAlerts.push({
        id,
        type: 'completion',
        title: `${level.levelName} Completed`,
        message: `Download Certificate for level completion`,
        timestamp: new Date().toISOString(),
        isRead: false,
        metadata: { courseId: level.levelId },
      });
    }
  });

  if (newAlerts.length > 0) {
    saveAlerts([...newAlerts, ...existing]);
  }
}

/**
 * Marks alerts as locked/unlocked based on the course unlock status.
 */
export function updateAlertLockStates(
  levels: Array<{ id: string; isUnlocked: boolean }>
): AlertCard[] {
  const alerts = getAlerts();
  const levelMap = new Map(levels.map((l) => [l.id, l.isUnlocked]));

  const updated = alerts.map((alert) => {
    const courseId = alert.metadata?.courseId;
    if (!courseId) return { ...alert, locked: false, lockedMessage: undefined };
    const isUnlocked = levelMap.get(courseId);
    if (isUnlocked === undefined) return { ...alert, locked: false, lockedMessage: undefined };
    return {
      ...alert,
      locked: !isUnlocked,
      lockedMessage: !isUnlocked ? 'Complete previous course to unlock.' : undefined,
    };
  });

  saveAlerts(updated);
  return updated;
}

interface CourseContentSnapshot {
  courseId: string;
  lessonIds: string[];
  quizIds: string[];
  moduleIds: string[];
}

function collectContentIds(node: any): { lessonIds: string[]; quizIds: string[]; moduleIds: string[] } {
  const result = { lessonIds: [] as string[], quizIds: [] as string[], moduleIds: [] as string[] };
  if (!node.children || node.children.length === 0) {
    if (node.mimeType?.includes('questionset') || node.primaryCategory === 'Practice Question Set') {
      if (node.identifier) result.quizIds.push(node.identifier);
    } else {
      if (node.identifier) result.lessonIds.push(node.identifier);
    }
    return result;
  }
  if (node.contentType === 'CourseUnit' || node.contentType === 'TextBookUnit') {
    if (node.identifier) result.moduleIds.push(node.identifier);
  }
  for (const child of node.children) {
    const childResult = collectContentIds(child);
    result.lessonIds.push(...childResult.lessonIds);
    result.quizIds.push(...childResult.quizIds);
    result.moduleIds.push(...childResult.moduleIds);
  }
  return result;
}

export function detectNewContent(
  courses: Array<{ id: string; name: string; children: any[] }>
): Array<{ contentId: string; name: string; type: 'lesson' | 'quiz' | 'content'; courseId: string }> {
  if (typeof window === 'undefined') return [];
  const stored: CourseContentSnapshot[] = JSON.parse(localStorage.getItem(COURSE_IDS_KEY) || '[]');
  const storedMap = new Map(stored.map((s) => [s.courseId, s]));
  const newItems: any[] = [];
  const updatedSnapshots: CourseContentSnapshot[] = courses.map((course) => {
    const current = collectContentIds({ children: course.children, identifier: course.id });
    const prev = storedMap.get(course.id);
    if (prev) {
      const prevLessonSet = new Set(prev.lessonIds);
      const prevQuizSet = new Set(prev.quizIds);
      const prevModuleSet = new Set(prev.moduleIds);
      current.lessonIds.filter((id) => !prevLessonSet.has(id)).forEach((id) => newItems.push({ contentId: id, name: course.name, type: 'lesson', courseId: course.id }));
      current.quizIds.filter((id) => !prevQuizSet.has(id)).forEach((id) => newItems.push({ contentId: id, name: course.name, type: 'quiz', courseId: course.id }));
      current.moduleIds.filter((id) => !prevModuleSet.has(id)).forEach((id) => newItems.push({ contentId: id, name: course.name, type: 'content', courseId: course.id }));
    }
    return { courseId: course.id, ...current };
  });
  localStorage.setItem(COURSE_IDS_KEY, JSON.stringify(updatedSnapshots));
  return newItems;
}
