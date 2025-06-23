import { BASE_URL } from '@/config/seo-config';

// Generate canonical URL
export const getCanonicalUrl = (path: string = '') => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
};

// Generate Open Graph image URL
export const getOGImageUrl = (title?: string, description?: string) => {
  const params = new URLSearchParams();
  if (title) params.set('title', title);
  if (description) params.set('description', description);
  
  return `${BASE_URL}/api/og?${params.toString()}`;
};

// Generate Twitter image URL
export const getTwitterImageUrl = (title?: string) => {
  const params = new URLSearchParams();
  if (title) params.set('title', title);
  
  return `${BASE_URL}/api/twitter-image?${params.toString()}`;
};

// SEO-friendly URL slug generator
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// Meta description generator
export const generateMetaDescription = (content: string, maxLength: number = 160): string => {
  const cleanContent = content.replace(/\s+/g, ' ').trim();
  
  if (cleanContent.length <= maxLength) {
    return cleanContent;
  }
  
  const truncated = cleanContent.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  return lastSpaceIndex > maxLength * 0.8 
    ? truncated.substring(0, lastSpaceIndex) + '...'
    : truncated + '...';
};

// JSON-LD helper for articles/blog posts
export const getArticleStructuredData = (article: {
  title: string;
  description: string;
  author: string;
  publishDate: string;
  modifiedDate?: string;
  image?: string;
  url: string;
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'vMetrics',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.png`,
      },
    },
    datePublished: article.publishDate,
    dateModified: article.modifiedDate || article.publishDate,
    image: article.image ? `${BASE_URL}${article.image}` : `${BASE_URL}/og-image.png`,
    url: `${BASE_URL}${article.url}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}${article.url}`,
    },
  };
};

// Organization structured data
export const getOrganizationStructuredData = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'vMetrics',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: 'Comprehensive productivity tracking system for developers using VS Code',
    foundingDate: '2024',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: 'English',
    },
    sameAs: [
      'https://github.com/vmetrics',
      'https://twitter.com/vmetrics',
    ],
  };
};

// Website structured data
export const getWebsiteStructuredData = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'vMetrics',
    url: BASE_URL,
    description: 'Track your coding productivity with beautiful visualizations and real-time insights',
    inLanguage: 'en-US',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
};

// Local business structured data (if applicable)
export const getLocalBusinessStructuredData = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'vMetrics',
    operatingSystem: 'Cross-platform',
    applicationCategory: 'DeveloperApplication',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5.0',
      ratingCount: '1',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
};

// Helper to validate structured data
export const validateStructuredData = (data: Record<string, unknown>): boolean => {
  try {
    JSON.stringify(data);
    return Boolean(data['@context'] && data['@type']);
  } catch {
    return false;
  }
};

// SEO checklist helper
export const seoChecklist = {
  title: (title: string) => ({
    valid: title.length >= 30 && title.length <= 60,
    length: title.length,
    message: title.length < 30 ? 'Title too short' : title.length > 60 ? 'Title too long' : 'Title length optimal',
  }),
  description: (description: string) => ({
    valid: description.length >= 120 && description.length <= 160,
    length: description.length,
    message: description.length < 120 ? 'Description too short' : description.length > 160 ? 'Description too long' : 'Description length optimal',
  }),
  keywords: (keywords: string[]) => ({
    valid: keywords.length >= 5 && keywords.length <= 15,
    count: keywords.length,
    message: keywords.length < 5 ? 'Add more keywords' : keywords.length > 15 ? 'Too many keywords' : 'Keyword count optimal',
  }),
};

const seoUtils = {
  getCanonicalUrl,
  getOGImageUrl,
  getTwitterImageUrl,
  generateSlug,
  generateMetaDescription,
  getArticleStructuredData,
  getOrganizationStructuredData,
  getWebsiteStructuredData,
  getLocalBusinessStructuredData,
  validateStructuredData,
  seoChecklist,
};

export default seoUtils;
