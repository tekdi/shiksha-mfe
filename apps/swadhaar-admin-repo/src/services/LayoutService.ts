export interface NavItemConfig {
  label: string;
  path: string;
  iconName: string;
  roles?: string[]; // Allowed roles. If empty, visible to all authenticated roles
  section?: 'PEOPLE' | 'LEARNING' | 'OPERATIONS' | 'GENERAL';
  badge?: string;
}

export interface UserProfileSummary {
  userId: string;
  name: string;
  username: string;
  roles: string[];
  tenantId: string;
}

const readUserProfile = (): UserProfileSummary => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('adminInfo');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          userId: parsed.userId || parsed.id || 'admin-01',
          name: parsed.name || parsed.username || 'Administrator',
          username: parsed.username || 'admin',
          roles: Array.isArray(parsed.roles) ? parsed.roles : [parsed.role || 'Admin'],
          tenantId: parsed.tenantId || 'swadhaar-tenant',
        };
      } catch {
        // fallback
      }
    }
  }

  return {
    userId: 'admin-01',
    name: 'Administrator',
    username: 'admin',
    roles: ['Super Admin', 'Admin'],
    tenantId: 'swadhaar-tenant',
  };
};

export const LayoutService = {
  /**
   * Fetch authenticated user profile and roles
   */
  getUserProfile: (): Promise<UserProfileSummary> => Promise.resolve(readUserProfile()),

  /**
   * Return dynamic navigation menu filtered by active roles
   */
  getNavigationItems: (userRoles: string[] = ['Admin']): NavItemConfig[] => {
    const allItems: NavItemConfig[] = [
      // {
      //   label: 'Dashboard',
      //   path: '/dashboard',
      //   iconName: 'DashboardIcon',
      //   section: 'GENERAL',
      // },
      // PEOPLE
      {
        label: 'Users',
        path: '/users',
        iconName: 'GroupIcon',
        roles: ['Super Admin', 'Admin', 'State Lead'],
        section: 'PEOPLE',
      },
      {
        label: 'Cohorts & Groups',
        path: '/cohorts',
        iconName: 'HubIcon',
        roles: ['Super Admin', 'Admin', 'Trainer', 'ARM'],
        section: 'PEOPLE',
      },
      // LEARNING
      {
        label: 'Courses',
        path: '/content/courses',
        iconName: 'MenuBookIcon',
        roles: ['Super Admin', 'Admin', 'Content Creator', 'Reviewer'],
        section: 'LEARNING',
      },
      {
        label: 'Content Library',
        path: '/content/library',
        iconName: 'FolderSpecialIcon',
        roles: ['Super Admin', 'Admin', 'Content Creator', 'Reviewer'],
        section: 'LEARNING',
      },
      {
        label: 'Review Queue',
        path: '/content/review-queue',
        iconName: 'FactCheckIcon',
        roles: ['Super Admin', 'Admin', 'Reviewer', 'DI'],
        section: 'LEARNING',
        badge: 'Pending',
      },
      {
        label: 'Learning Paths',
        path: '/learning-paths',
        iconName: 'AltRouteIcon',
        roles: ['Super Admin', 'Admin', 'Trainer', 'State Lead'],
        section: 'LEARNING',
      },
      // OPERATIONS & ANALYTICS
      {
        label: 'Reports & Analytics',
        path: '/reports',
        iconName: 'AssessmentIcon',
        roles: ['Super Admin', 'Admin', 'Report Viewer', 'State Lead'],
        section: 'OPERATIONS',
      },
      {
        label: 'Notifications',
        path: '/notifications',
        iconName: 'NotificationsIcon',
        roles: ['Super Admin', 'Admin'],
        section: 'OPERATIONS',
      },
      {
        label: 'Access Control (RBAC)',
        path: '/access/permissions',
        iconName: 'SecurityIcon',
        roles: ['Super Admin', 'Admin'],
        section: 'OPERATIONS',
      },
    ];

    // If user has Super Admin or Admin, they see everything
    const isAdmin = userRoles.some(
      (r) => r.toLowerCase().includes('admin') || r.toLowerCase().includes('super')
    );
    if (isAdmin) {
      return allItems;
    }

    // Otherwise filter based on assigned roles
    return allItems.filter((item) => {
      if (!item.roles || item.roles.length === 0) return true;
      return item.roles.some((reqRole) =>
        userRoles.some((userRole) => userRole.toLowerCase() === reqRole.toLowerCase())
      );
    });
  },
};

export default LayoutService;
