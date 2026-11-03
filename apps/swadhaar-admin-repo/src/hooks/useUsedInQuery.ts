import { useEffect } from 'react';
import { useRouter } from 'next/router';

/** Reads the `usedIn` query parameter (the course a content item is created for) into the page state. */
const useUsedInQuery = (setUsedIn: (value: string) => void) => {
  const router = useRouter();
  const { usedIn } = router.query;
  useEffect(() => {
    if (usedIn && typeof usedIn === 'string') {
      setUsedIn(usedIn);
    }
  }, [usedIn, setUsedIn]);
};

export default useUsedInQuery;
