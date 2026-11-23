import axios from 'axios';
import { SWADHAAR_BASE_URL, SWADHAAR_TENANT_ID } from './API/SwadhaarAuthService';

/**
 * Task 77 (Swadhaar): a user who is Reviewer in at least one group gets the team dashboard
 * (the CFL screens under /cfl), whatever their organisation role. The group role comes from the
 * server (GET cohortmember/my-groups?role=reviewer, user taken from the token); localStorage only
 * remembers the last answer so pages can decide before the call returns.
 */
export const REVIEWER_FLAG_KEY = 'isReviewer';

/** Organisation roles that already had the team dashboard before group roles existed */
export const DASHBOARD_ROLE_CODES = ['cfl', 'arm'];
/** Organisation roles that have their own learning (the learner home) */
export const LEARNING_ROLE_CODES = ['trainer'];

export interface ReviewerGroup {
  cohortId: string;
  cohortName: string;
}

/** The caller's Reviewer groups; null when the server could not be asked (offline, expired token) */
export const getMyReviewerGroups = async (
  token?: string | null,
  tenantId?: string | null
): Promise<ReviewerGroup[] | null> => {
  const authToken = token ?? (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  if (!authToken) return null;
  const tenant = tenantId || SWADHAAR_TENANT_ID;
  try {
    const response = await axios.get(`${SWADHAAR_BASE_URL}/user/v1/cohortmember/my-groups`, {
      params: { role: 'reviewer' },
      headers: { tenantid: tenant, 'X-Tenant-Id': tenant, Authorization: `Bearer ${authToken}` },
    });
    const groups = response?.data?.result?.groups;
    return Array.isArray(groups)
      ? groups.map((g: any) => ({ cohortId: g.cohortId, cohortName: g.cohortName }))
      : [];
  } catch (error) {
    console.warn('Could not load reviewer groups:', error);
    return null;
  }
};

export const isReviewerSession = (): boolean =>
  typeof window !== 'undefined' && localStorage.getItem(REVIEWER_FLAG_KEY) === 'true';

/** Asks the server again and stores the answer; keeps the stored answer when the server can't be asked */
export const refreshReviewerFlag = async (): Promise<boolean> => {
  const groups = await getMyReviewerGroups();
  if (groups === null) return isReviewerSession();
  const isReviewer = groups.length > 0;
  localStorage.setItem(REVIEWER_FLAG_KEY, String(isReviewer));
  return isReviewer;
};

/** The stored organisation role: roleCode when present, else the legacy label (sessions from before roleCode) */
const storedRole = () => ({
  roleCode: (localStorage.getItem('roleCode') || '').trim().toLowerCase(),
  legacyRole: (localStorage.getItem('userRole') || '').trim().toUpperCase(),
});

/** True when the organisation role gives the user learning of their own (trainer) */
export const hasOwnLearning = (): boolean => {
  if (typeof window === 'undefined') return true;
  const { roleCode, legacyRole } = storedRole();
  return roleCode ? LEARNING_ROLE_CODES.includes(roleCode) : legacyRole === 'TRAINER';
};

/** True when the organisation role is one of the dashboard roles (cfl / arm) */
export const hasDashboardRole = (): boolean => {
  if (typeof window === 'undefined') return false;
  const { roleCode, legacyRole } = storedRole();
  return roleCode
    ? DASHBOARD_ROLE_CODES.includes(roleCode)
    : ['CFL', 'DI', 'DISTRICT INCHARGE', 'ARM'].includes(legacyRole);
};

/** May open the team dashboard: cfl / arm, or Reviewer in at least one group */
export const canOpenTeamDashboard = (isReviewer: boolean = isReviewerSession()): boolean =>
  hasDashboardRole() || isReviewer;

/**
 * Lands on the team dashboard instead of the learner home: cfl / arm always; a Reviewer only when
 * they have no learning of their own (a trainer who is also a Reviewer keeps the home + "My Team").
 */
export const startsOnTeamDashboard = (isReviewer: boolean = isReviewerSession()): boolean =>
  hasDashboardRole() || (isReviewer && !hasOwnLearning());
