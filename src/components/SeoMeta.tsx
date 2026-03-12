import { useEffect } from 'react';

type Language = 'en' | 'ar';

const SITE_URL = 'https://www.islamiclight.online';

const routeMeta: Record<
  string,
  {
    title: Record<Language, string>;
    description: Record<Language, string>;
  }
> = {
  '/': {
    title: {
      en: 'Islamic Vision | Authentic Islamic Knowledge',
      ar: 'رؤى إسلامية | معرفة إسلامية موثوقة',
    },
    description: {
      en: 'Explore Quran, academy lessons, articles, and Islamic community knowledge.',
      ar: 'استكشف القرآن والدروس والأكاديمية والمقالات والمعرفة الإسلامية.',
    },
  },
  '/quran': {
    title: { en: 'Quran Reader | Islamic Vision', ar: 'قارئ القرآن | رؤى إسلامية' },
    description: {
      en: 'Read the Mushaf page by page with bookmark support.',
      ar: 'اقرأ المصحف صفحةً صفحة مع حفظ العلامة.',
    },
  },
  '/academy': {
    title: { en: 'Academy | Islamic Vision', ar: 'الأكاديمية | رؤى إسلامية' },
    description: {
      en: 'Learn from structured Islamic lessons and courses.',
      ar: 'تعلّم من دروس ودورات إسلامية منظّمة.',
    },
  },
  '/articles': {
    title: { en: 'Articles | Islamic Vision', ar: 'المقالات | رؤى إسلامية' },
    description: {
      en: 'Read insightful Islamic articles and reflections.',
      ar: 'اقرأ مقالات وتأملات إسلامية نافعة.',
    },
  },
  '/library': {
    title: { en: 'Library | Islamic Vision', ar: 'المكتبة | رؤى إسلامية' },
    description: {
      en: 'Browse books, PDFs, audio, and Islamic resources.',
      ar: 'تصفح الكتب وملفات PDF والصوتيات والموارد الإسلامية.',
    },
  },
  '/community': {
    title: { en: 'Community | Islamic Vision', ar: 'المجتمع | رؤى إسلامية' },
    description: {
      en: 'Join the Islamic community and share beneficial content.',
      ar: 'انضم للمجتمع الإسلامي وشارك المحتوى النافع.',
    },
  },
  '/privacy': {
    title: { en: 'Privacy Policy | Islamic Vision', ar: 'سياسة الخصوصية | رؤى إسلامية' },
    description: {
      en: 'Read our privacy policy and data handling approach.',
      ar: 'اطلع على سياسة الخصوصية وآلية التعامل مع البيانات.',
    },
  },
  '/terms': {
    title: { en: 'Terms of Service | Islamic Vision', ar: 'شروط الاستخدام | رؤى إسلامية' },
    description: {
      en: 'Review the platform terms and user rules.',
      ar: 'راجع شروط المنصة وقواعد الاستخدام.',
    },
  },
};

const upsertMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
  let node = document.head.querySelector<HTMLMetaElement>(selector);
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(attribute, key);
    document.head.appendChild(node);
  }
  node.setAttribute('content', content);
};

export const SeoMeta = ({ pathname, lang }: { pathname: string; lang: Language }) => {
  useEffect(() => {
    const meta = routeMeta[pathname] || routeMeta['/'];
    const title = meta.title[lang];
    const description = meta.description[lang];
    const canonical = `${SITE_URL}${pathname === '/' ? '' : pathname}`;

    document.title = title;

    upsertMeta('meta[name="description"]', 'name', 'description', description);
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', title);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);

    let canonicalLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonical);
  }, [pathname, lang]);

  return null;
};

