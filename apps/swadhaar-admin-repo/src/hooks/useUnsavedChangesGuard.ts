import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * Hook to guard against accidental navigation or tab closure when a form has unsaved changes.
 * @param isDirty boolean indicating if the form or builder has unsaved changes.
 * @param message prompt text shown to the user on attempted navigation.
 */
export const useUnsavedChangesGuard = (
  isDirty: boolean,
  message: string = 'You have unsaved changes. Are you sure you want to leave this page?'
) => {
  const router = useRouter();

  useEffect(() => {
    if (!isDirty) return;

    // 1. Handle browser tab closure, reload, or external navigation
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      return message;
    };

    // 2. Handle internal Next.js client-side route transitions
    const handleRouteChangeStart = (url: string) => {
      if (router.asPath === url) return;

      const confirmed = window.confirm(message);
      if (!confirmed) {
        router.events.emit('routeChangeError');
        // Next.js recognizes this error throw to cancel route transitions
        throw new Error('routeChange aborted by user due to unsaved changes.');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    router.events.on('routeChangeStart', handleRouteChangeStart);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      router.events.off('routeChangeStart', handleRouteChangeStart);
    };
  }, [isDirty, message, router]);
};

export default useUnsavedChangesGuard;
