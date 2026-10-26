import { Role, TenantName } from '@/utils/app.constant';

export interface MenuItem {
  title: string;
  icon?: string;
  link: string;
  roles?: Role[];
}

export const MENU_CONFIG: Record<string, Record<string, MenuItem>> = {
  [TenantName.SWADHAAR]: {
    dashboard: {
      title: 'SIDEBAR.DASHBOARD',
      icon: 'dashboard',
      link: '/dashboard',
      roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CONTENT_CREATOR, Role.REVIEWER, Role.REPORT_VIEWER],
    },
    users: {
      title: 'SIDEBAR.USERS',
      icon: 'group',
      link: '/users',
      roles: [Role.SUPER_ADMIN, Role.ADMIN],
    },
    cohorts: {
      title: 'SIDEBAR.COHORTS',
      icon: 'diversity_3',
      link: '/cohorts',
      roles: [Role.SUPER_ADMIN, Role.ADMIN],
    },
    content: {
      title: 'SIDEBAR.CONTENT',
      icon: 'menu_book',
      link: '/content',
      roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.CONTENT_CREATOR, Role.REVIEWER],
    },
    learningPaths: {
      title: 'SIDEBAR.LEARNING_PATHS',
      icon: 'route',
      link: '/learning-paths',
      roles: [Role.SUPER_ADMIN, Role.ADMIN],
    },
    reports: {
      title: 'SIDEBAR.REPORTS',
      icon: 'assessment',
      link: '/reports',
      roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.REPORT_VIEWER],
    },
  },
};
