import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'vMetrics - VSCode Productivity Tracker',
    short_name: 'vMetrics',
    description: 'Track your coding productivity with beautiful visualizations and real-time insights',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    orientation: 'portrait',
    scope: '/',
    icons: [
      {
        src: '/icons/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icons/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png'
      },
      {
        src: '/icons/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png'
      },
      {
        src: '/icons/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png'
      }
    ],
    categories: ['productivity', 'developer tools', 'utilities'],
    shortcuts: [
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        description: 'View your productivity dashboard',
        url: '/dashboard',
        icons: [{ src: '/icons/favicon-96x96.png', sizes: '96x96' }]
      }
    ],
    screenshots: [
      {
        src: '/screenshot-wide.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'vMetrics Dashboard Overview'
      },
      {
        src: '/screenshot-narrow.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'vMetrics Mobile Dashboard'
      }
    ]
  };
}
