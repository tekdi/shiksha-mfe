import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Loader from '@/components/Loader';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      router.replace('/users');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return <Loader message="Redirecting to Swadhaar Admin..." minHeight="100vh" />;
}
