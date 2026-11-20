import { useEffect, useState } from 'react';
import { COHORT_ROLE_LABELS, CohortRoleCode } from '@/services/CohortService';
import { getTenantRoles } from '@/services/UserService';

/**
 * Task 8b: display names of the group roles (Learner / Reviewer) from the role API
 * (roles with roleType 'cohort'). The codes stay learner / reviewer; a rename in the user service shows
 * here without a code change. Until the API answers, or if it fails, the built-in labels are used.
 */
export const useGroupRoleLabels = (): Record<CohortRoleCode, string> => {
  const [labels, setLabels] = useState<Record<CohortRoleCode, string>>(COHORT_ROLE_LABELS);

  useEffect(() => {
    let active = true;
    getTenantRoles(['cohort'])
      .then((roles) => {
        if (!active || roles.length === 0) return;
        const next = { ...COHORT_ROLE_LABELS };
        roles.forEach((r) => {
          if (r.code in next && r.label) next[r.code as CohortRoleCode] = r.label;
        });
        setLabels(next);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return labels;
};
