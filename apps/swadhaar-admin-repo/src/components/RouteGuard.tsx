import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { publicRoutes } from '../config/routesConfig';

const RouteGuard = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    authCheck(router.asPath);

    const hideContent = () => setAuthorized(false);
    router.events.on('routeChangeStart', hideContent);
    router.events.on('routeChangeComplete', authCheck);

    return () => {
      router.events.off('routeChangeStart', hideContent);
      router.events.off('routeChangeComplete', authCheck);
    };
  }, [router]);

  function authCheck(url: string) {
    const path = url.split('?')[0];
    const isPublic = publicRoutes.some((route) => path === route || path?.startsWith(`${route}/`));
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (!token && !isPublic) {
      setAuthorized(false);
      router.push({
        pathname: '/login',
        query: { returnUrl: router.asPath },
      });
    } else {
      setAuthorized(true);
    }
  }

  return authorized ? <>{children}</> : null;
};

export default RouteGuard;
