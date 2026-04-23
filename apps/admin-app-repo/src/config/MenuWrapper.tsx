import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { MENU_CONFIG } from '../config/menuConfig';
import { PUBLIC_ROUTES, ROLE_BASED_ROUTES } from '../config/routesConfig';

const MenuWrapper = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<{ role: string; program: string } | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedRole = localStorage.getItem('roleName');
    const storedProgram = localStorage.getItem('program');

    if (storedRole && storedProgram) {
      setUser({ role: storedRole, program: storedProgram });
    } else if (!PUBLIC_ROUTES.includes(router.pathname)) {
      // Redirect only if the route is NOT public
      router.replace('/home');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;

    // ✅ 1. Get all allowed menu routes (including submenu)
    const allowedMenuRoutes = Object.values(MENU_CONFIG[user.program] || {})
      .filter((item) => item.roles.includes(user.role))
      .flatMap((item) => [
        item.link,
        ...(item.subMenu?.map((sub) => sub.link) || []),
      ]);

    // ✅ 2. Get program-specific routes from ROLE_BASED_ROUTES
    const programSpecificRoutes =
      ROLE_BASED_ROUTES[user.program]?.[user.role] || [];

    // ✅ 3. Handle dynamic routes like /course-hierarchy/[identifier]
    const isDynamicAllowed = programSpecificRoutes.some((route) =>
      router.pathname.startsWith(route.replace('[identifier]', ''))
    );

    // ✅ 4. Check if it's a public route
    const isPublicRoute = PUBLIC_ROUTES.includes(router.pathname);

    // ✅ 5. Check if the route exists in menuConfig or role-based routes
    const isAllowedRoute =
      allowedMenuRoutes.includes(router.pathname) ||
      programSpecificRoutes.includes(router.pathname);

    // console.log('router.pathname', router.pathname);
    // console.log(
    //   'router.pathname allowedMenuRoutes',
    //   JSON.stringify(allowedMenuRoutes)
    // );
    // console.log('router.pathname user', user);
    // console.log('router.pathname isPublicRoute', isPublicRoute);
    // console.log('router.pathname isAllowedRoute', isAllowedRoute);
    // console.log('router.pathname isDynamicAllowed', isDynamicAllowed);

    // ✅ 6. Final route validation
    if (!isPublicRoute && !isAllowedRoute && !isDynamicAllowed) {
      router.replace('/unauthorized');
    }
  }, [user, router.pathname]);

  if (loading) return <div>Loading...</div>;

  return <>{children}</>;
};

export default MenuWrapper;
