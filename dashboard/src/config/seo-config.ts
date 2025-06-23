import { Metadata } from 'next';

// Base URL for your application
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://vmetrics.nabinkhair.com.np';

// Default SEO configuration
export const defaultSEO: Metadata = {
  title: {
    default: 'vMetrics - VSCode Productivity Tracker',
    template: '%s | vMetrics'
  },
  description: 'Track your coding productivity with vMetrics - A comprehensive full-stack productivity tracking system for developers using VS Code. Monitor your coding habits, analyze productivity trends, and optimize your development workflow.',
  keywords: [
    'VSCode productivity',
    'coding tracker',
    'developer productivity',
    'programming analytics',
    'code time tracking',
    'developer insights',
    'coding habits',
    'productivity metrics',
    'VS Code extension',
    'developer tools',
    'coding statistics',
    'programming productivity',
    'developer dashboard',
    'code analytics',
    'time tracking for developers'
  ],
  authors: [{ name: 'vMetrics Team' }],
  creator: 'vMetrics',
  publisher: 'vMetrics',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(BASE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'vMetrics',
    title: 'vMetrics - VSCode Productivity Tracker',
    description: 'Track your coding productivity with beautiful visualizations. Monitor coding habits, analyze productivity trends, and optimize your development workflow with vMetrics.',
    images: [
      {
        url: '/icons/og-image.png',
        width: 1200,
        height: 630,
        alt: 'vMetrics - VSCode Productivity Tracker',
        type: 'image/png',
      },
      {
        url: '/icons/og-image-square.png',
        width: 1200,
        height: 1200,
        alt: 'vMetrics Logo',
        type: 'image/png',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@vmetrics',
    creator: '@vmetrics',
    title: 'vMetrics - VSCode Productivity Tracker',
    description: 'Track your coding productivity with beautiful visualizations. Monitor coding habits, analyze productivity trends, and optimize your development workflow.',
    images: ['/icons/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    yahoo: process.env.YAHOO_VERIFICATION,
    other: {
      'msvalidate.01': process.env.BING_VERIFICATION || '',
    },
  },
  category: 'technology',
  classification: 'Developer Tools',
  referrer: 'origin-when-cross-origin',
  generator: 'Next.js',
  applicationName: 'vMetrics',
  appleWebApp: {
    capable: true,
    title: 'vMetrics',
    statusBarStyle: 'default',
    startupImage: [
      {
        url: '/icons/apple-touch-startup-image.png',
        media: '(device-width: 768px) and (device-height: 1024px)',
      },
    ],
  },
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/apple-touch-icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/apple-touch-icon-167x167.png', sizes: '167x167', type: 'image/png' },
    ],
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/icons/apple-touch-icon-precomposed.png',
      },
    ],
  },
  other: {
    'theme-color': '#000000',
    'color-scheme': 'dark light',
    'msapplication-TileColor': '#000000',
    'msapplication-config': '/browserconfig.xml',
  },
};

// Page-specific SEO configurations
export const pageSEO = {
  home: {
    title: 'vMetrics - VSCode Productivity Tracker',
    description: 'Track your coding productivity with vMetrics. Monitor coding habits, analyze trends, and optimize your development workflow with beautiful visualizations and real-time insights.',
    keywords: [
      'VSCode productivity tracker',
      'coding time tracker',
      'developer productivity analytics',
      'programming habits tracker',
      'code activity monitor'
    ],
    openGraph: {
      title: 'vMetrics - Track Your Coding Productivity',
      description: 'Monitor your coding habits, analyze productivity trends, and optimize your development workflow with beautiful visualizations.',
      images: [
        {
          url: '/icons/og-home.png',
          width: 1200,
          height: 630,
          alt: 'vMetrics Home - Productivity Tracking Dashboard',
        }
      ],
    },
  },
  dashboard: {
    title: 'Dashboard - Your Productivity Insights',
    description: 'View your coding productivity analytics, track your programming habits, and analyze your development patterns with interactive charts and heatmaps.',
    keywords: [
      'productivity dashboard',
      'coding analytics',
      'developer insights',
      'programming statistics',
      'code activity dashboard'
    ],
    openGraph: {
      title: 'vMetrics Dashboard - Your Productivity Insights',
      description: 'Interactive dashboard showing your coding productivity analytics with beautiful charts and insights.',
      images: [
        {
          url: '/icons/og-dashboard.png',
          width: 1200,
          height: 630,
          alt: 'vMetrics Dashboard - Productivity Analytics',
        }
      ],
    },
  },
  auth: {
    title: 'Sign In - Access Your Productivity Data',
    description: 'Sign in to vMetrics with your GitHub account to access your coding productivity analytics and insights.',
    keywords: [
      'vMetrics login',
      'GitHub authentication',
      'productivity tracker sign in',
      'developer dashboard login'
    ],
    robots: {
      index: false,
      follow: true,
    },
    openGraph: {
      title: 'Sign In to vMetrics',
      description: 'Access your coding productivity analytics and insights with GitHub authentication.',
    },
  },
};

// JSON-LD structured data
export const getStructuredData = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'vMetrics',
    description: 'A comprehensive full-stack productivity tracking system for developers using VS Code',
    url: BASE_URL,
    logo: `${BASE_URL}/icons/logo.png`,
    image: `${BASE_URL}/icons/og-image.png`,
    author: {
      '@type': 'Organization',
      name: 'vMetrics Team',
    },
    publisher: {
      '@type': 'Organization',  
      name: 'vMetrics',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/icons/logo.png`,
      },
    },
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Windows, macOS, Linux',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Real-time activity tracking',
      'Coding productivity analytics',
      'Multi-device synchronization',
      'Programming language insights',
      'Project time allocation',
      'Beautiful visualizations',
      'Privacy-first approach',
      'GitHub integration'
    ],
    screenshot: [
      `${BASE_URL}/activity-light.png`,
      `${BASE_URL}/language-light.png`,
      `${BASE_URL}/overview-light.png`,
      `${BASE_URL}/projects-light.png`
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5.0',
      ratingCount: '1',
      bestRating: '5',
      worstRating: '1'
    },
    review: {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '5',
        bestRating: '5'
      },
      author: {
        '@type': 'Person',
        name: 'Developer'
      },
      reviewBody: 'Excellent tool for tracking coding productivity with beautiful visualizations and privacy-first approach.'
    }
  };
};

// Breadcrumb structured data
export const getBreadcrumbStructuredData = (items: Array<{ name: string; url: string }>) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  };
};

// FAQ structured data for landing page
export const getFAQStructuredData = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is vMetrics?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'vMetrics is a comprehensive productivity tracking system for developers using VS Code. It tracks your coding activity, provides beautiful analytics, and helps optimize your development workflow while maintaining complete privacy.'
        }
      },
      {
        '@type': 'Question',
        name: 'Is my code content tracked?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No, vMetrics follows a privacy-first approach and only tracks metadata such as file names, timestamps, and programming languages. Your actual code content is never accessed or stored.'
        }
      },
      {
        '@type': 'Question',
        name: 'How does multi-device synchronization work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'vMetrics syncs your productivity data across all your development machines through a secure backend server. Each device has a unique identifier, and data is merged intelligently to provide unified insights.'
        }
      },
      {
        '@type': 'Question',
        name: 'What programming languages are supported?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'vMetrics automatically detects and tracks activity for all programming languages supported by VS Code, including JavaScript, TypeScript, Python, Java, C++, Go, Rust, and many more.'
        }
      }
    ]
  };
};

export default defaultSEO;
