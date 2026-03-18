import { useEffect } from 'react';

type Language = 'en' | 'ar';

type RouteMeta = {
  title: Record<Language, string>;
  description: Record<Language, string>;
  keywords: Record<Language, string>;
};

const SITE_URL = 'https://www.islamiclight.online';
const OG_IMAGE = `${SITE_URL}/favicon.svg`;

const routeMeta: Record<string, RouteMeta> = {
  '/': {
    title: {
      en: 'Islam | Authentic Islamic Knowledge',
      ar: 'إسلام | معرفة إسلامية أصيلة',
    },
    description: {
      en: 'Explore Quran, prayer times, articles, and Islamic community knowledge.',
      ar: 'اكتشف القرآن ومواقيت الصلاة والمقالات والمجتمع الإسلامي في منصة واحدة واضحة وموثوقة.',
    },
    keywords: {
      en: 'Islamic knowledge, Quran, prayer times, Islamic articles, Muslim community',
      ar: 'معرفة إسلامية, القرآن, مواقيت الصلاة, مقالات إسلامية, مجتمع إسلامي',
    },
  },
  '/quran': {
    title: { en: 'Quran Reader | Islam', ar: 'مصحف القرآن | إسلام' },
    description: {
      en: 'Read the Mushaf page by page with bookmark support and offline-friendly Quran access.',
      ar: 'اقرأ المصحف صفحة صفحة مع حفظ العلامة ودعم القراءة المريحة وإمكانية الوصول بدون تعقيد.',
    },
    keywords: {
      en: 'Quran reader, Mushaf online, Quran pages, read Quran online',
      ar: 'مصحف القرآن, القرآن, صفحات القرآن, قراءة القرآن',
    },
  },
  '/prayer': {
    title: { en: 'Prayer Time | Islam', ar: 'مواقيت الصلاة | إسلام' },
    description: {
      en: 'See today prayer times, qibla direction, azan selection, reminders, and location-aware prayer settings.',
      ar: 'اعرف مواقيت الصلاة واتجاه القبلة وخيارات الأذان والتنبيهات بإعدادات تناسب موقعك الحالي.',
    },
    keywords: {
      en: 'prayer times, salah times, qibla, azan, prayer reminders',
      ar: 'مواقيت الصلاة, أوقات الصلاة, القبلة, الأذان, تنبيهات الصلاة',
    },
  },
  '/academy': {
    title: { en: 'Prayer Time | Islam', ar: 'مواقيت الصلاة | إسلام' },
    description: {
      en: 'Legacy academy route now opens the prayer time experience.',
      ar: 'المسار القديم للأكاديمية يوجّه الآن إلى صفحة مواقيت الصلاة.',
    },
    keywords: {
      en: 'prayer times, salah times, qibla, azan',
      ar: 'مواقيت الصلاة, أوقات الصلاة, القبلة, الأذان',
    },
  },
  '/articles': {
    title: { en: 'Articles | Islam', ar: 'المقالات | إسلام' },
    description: {
      en: 'Read insightful Islamic articles, reflections, and contemporary discussions.',
      ar: 'اقرأ مقالات إسلامية نافعة وتأملات هادئة وموضوعات معاصرة بأسلوب واضح.',
    },
    keywords: {
      en: 'Islamic articles, Muslim reflections, Islamic history, Islamic learning',
      ar: 'مقالات إسلامية, تأملات إيمانية, التاريخ الإسلامي, التعلم الإسلامي',
    },
  },

  '/community': {
    title: { en: 'Community | Islam', ar: 'المجتمع | إسلام' },
    description: {
      en: 'Join the Islamic community and explore approved posts, lessons, reflections, and shared knowledge.',
      ar: 'انضم إلى المجتمع الإسلامي وتصفح المنشورات والدروس والتأملات والمحتوى المعتمد.',
    },
    keywords: {
      en: 'Islamic community, Muslim community, shared lessons, Islamic posts',
      ar: 'المجتمع الإسلامي, مجتمع المسلمين, دروس مشتركة, منشورات إسلامية',
    },
  },
  '/privacy': {
    title: { en: 'Privacy Policy | Islam', ar: 'سياسة الخصوصية | إسلام' },
    description: {
      en: 'Read our privacy policy and how the platform handles data.',
      ar: 'اطلع على سياسة الخصوصية وكيف تتعامل المنصة مع البيانات والمعلومات.',
    },
    keywords: {
      en: 'privacy policy, data policy, Islamic platform privacy',
      ar: 'سياسة الخصوصية, سياسة البيانات, خصوصية المنصة الإسلامية',
    },
  },
  '/terms': {
    title: { en: 'Terms of Service | Islam', ar: 'شروط الخدمة | إسلام' },
    description: {
      en: 'Review the platform terms, publishing rules, and community standards.',
      ar: 'راجع شروط المنصة وقواعد النشر ومعايير المجتمع قبل الاستخدام.',
    },
    keywords: {
      en: 'terms of service, user rules, platform terms',
      ar: 'شروط الخدمة, قواعد الاستخدام, شروط المنصة',
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

const upsertLink = (selector: string, rel: string, href: string) => {
  let node = document.head.querySelector<HTMLLinkElement>(selector);
  if (!node) {
    node = document.createElement('link');
    node.setAttribute('rel', rel);
    document.head.appendChild(node);
  }
  node.setAttribute('href', href);
};

export const SeoMeta = ({ pathname, lang }: { pathname: string; lang: Language }) => {
  useEffect(() => {
    const meta = routeMeta[pathname] || routeMeta['/'];
    const title = meta.title[lang];
    const description = meta.description[lang];
    const keywords = meta.keywords[lang];
    const canonical = `${SITE_URL}${pathname === '/' ? '' : pathname}`;

    document.documentElement.setAttribute('lang', lang);
    document.title = title;

    upsertMeta('meta[name="description"]', 'name', 'description', description);
    upsertMeta('meta[name="keywords"]', 'name', 'keywords', keywords);
    upsertMeta('meta[name="robots"]', 'name', 'robots', 'index,follow,max-image-preview:large');
    upsertMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
    upsertMeta('meta[property="og:site_name"]', 'property', 'og:site_name', 'Islam');
    upsertMeta('meta[property="og:locale"]', 'property', 'og:locale', lang === 'ar' ? 'ar_IQ' : 'en_US');
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', title);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', OG_IMAGE);
    upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', OG_IMAGE);

    upsertLink('link[rel="canonical"]', 'canonical', canonical);
    upsertLink('link[rel="alternate"][hreflang="en"]', 'alternate', canonical);
    const enAlt = document.head.querySelector<HTMLLinkElement>('link[rel="alternate"][hreflang="en"]');
    enAlt?.setAttribute('hreflang', 'en');
    const arSelector = 'link[rel="alternate"][hreflang="ar"]';
    upsertLink(arSelector, 'alternate', canonical);
    const arAlt = document.head.querySelector<HTMLLinkElement>(arSelector);
    arAlt?.setAttribute('hreflang', 'ar');
  }, [pathname, lang]);

  return null;
};
