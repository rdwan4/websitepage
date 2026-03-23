import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { siteLinks } from '../config/siteLinks';

type Language = 'en' | 'ar';

const text = {
  en: {
    title: 'About Islamic Light',
    intro:
      'Islamic Light is a bilingual Islamic platform focused on clear, authentic, and practical knowledge for everyday Muslims.',
    sections: [
      {
        title: 'What We Publish',
        body: 'We provide Quran reading tools, prayer times, articles, community content, and quiz-based learning in Arabic and English.',
      },
      {
        title: 'Our Approach',
        body: 'We aim to make Islamic knowledge easier to access while keeping the experience clean, trustworthy, and useful on web and mobile.',
      },
      {
        title: 'Contact',
        body: `For support, corrections, or partnership questions, email ${siteLinks.supportEmail}.`,
      },
    ],
    back: 'Back to Home',
  },
  ar: {
    title: 'من نحن',
    intro:
      'النور الإسلامي منصة إسلامية ثنائية اللغة تهدف إلى تقديم معرفة واضحة وموثوقة وعملية للمستخدمين يومياً.',
    sections: [
      {
        title: 'ماذا نقدم',
        body: 'نوفر قراءة القرآن، ومواقيت الصلاة، والمقالات، والمحتوى المجتمعي، وأسئلة الاختبار باللغتين العربية والإنجليزية.',
      },
      {
        title: 'منهجنا',
        body: 'نركز على تسهيل الوصول إلى المعرفة الإسلامية مع الحفاظ على تجربة واضحة وموثوقة ومفيدة على الويب والجوال.',
      },
      {
        title: 'التواصل',
        body: `للدعم أو التصحيح أو الاستفسارات: ${siteLinks.supportEmail}`,
      },
    ],
    back: 'العودة للرئيسية',
  },
};

export const AboutPage = ({ lang }: { lang: Language }) => {
  const t = text[lang];

  return (
    <div className="min-h-screen bg-app-bg pt-32 pb-20">
      <div className="container mx-auto px-6">
        <div className={cn('mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-app-card p-8 md:p-12', lang === 'ar' && 'text-right')}>
          <h1 className="mb-6 text-4xl font-serif text-app-text">{t.title}</h1>
          <p className="mb-10 leading-relaxed text-app-muted">{t.intro}</p>

          <div className="space-y-8">
            {t.sections.map((section) => (
              <section key={section.title}>
                <h2 className="mb-3 text-lg font-bold text-app-text">{section.title}</h2>
                <p className="leading-relaxed text-app-muted">{section.body}</p>
              </section>
            ))}
          </div>

          <Link to="/" className="mt-10 inline-block text-sm font-bold text-app-accent hover:underline">
            {t.back}
          </Link>
        </div>
      </div>
    </div>
  );
};
