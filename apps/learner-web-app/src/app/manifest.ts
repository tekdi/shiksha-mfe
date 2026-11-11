import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export default function manifest(): MetadataRoute.Manifest {
  const host = headers().get('host') || '';
  const isSwadhaar = host.includes('swadhaar') || host.includes('localhost');

  return {
    name: isSwadhaar ? 'Swadhaar Learner' : 'Shiksha',
    short_name: isSwadhaar ? 'Swadhaar' : 'Shiksha',
    description: isSwadhaar ? 'Swadhaar Learner Application' : 'Shiksha Learner Application',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: isSwadhaar ? '#E6873C' : '#1976d2',
    icons: [
      {
        src: isSwadhaar ? '/images/swadhar_logo.png' : '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: isSwadhaar ? '/images/swadhar_logo.png' : '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: isSwadhaar ? '/images/swadhar_logo.png' : '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      }
    ],
  };
}
