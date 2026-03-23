import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2, X, HelpCircle, Lightbulb, BookOpen, Layers, MessageSquare, Languages } from 'lucide-react';
import { contentService } from '../services/contentService';
import { QuizQuestion, QuizQuestionOption, SourceType } from '../types';
import { cn } from '../lib/utils';

const translations = {
  en: {
    title: 'Daily Quiz Question',
    subtitle: 'Create engaging knowledge tests',
    languageMode: 'Language',
    englishOnly: 'English Only',
    arabicOnly: 'Arabic Only',
    bothLanguages: 'Both Together',
    questionEn: 'Question (English)',
    questionAr: 'Question (Arabic)',
    correctOption: 'Mark the correct answer',
    addOption: 'Add New Option',
    sourceType: 'Source Type',
    difficulty: 'Level',
    explanationEn: 'Explanation (English)',
    explanationAr: 'Explanation (Arabic)',
    publish: 'Publish to Platform',
    error: 'An unexpected error occurred.',
    questionRequired: 'Add the required question text.',
    optionsRequired: 'Add at least two options.',
    englishOptionRequired: 'Add English text for each option.',
    arabicOptionRequired: 'Add Arabic text for each option.',
    optionLabel: 'Option',
    answerEn: 'Answer (EN)',
    answerAr: 'Answer (AR)',
    questionLabel: 'The Question',
    explanationLabel: 'Explanation',
  },
  ar: {
    title: 'سؤال الاختبار اليومي',
    subtitle: 'أنشئ اختبارات معرفية تفاعلية',
    languageMode: 'اللغة',
    englishOnly: 'إنجليزي فقط',
    arabicOnly: 'عربي فقط',
    bothLanguages: 'كلتا اللغتين',
    questionEn: 'السؤال (إنجليزي)',
    questionAr: 'السؤال (عربي)',
    correctOption: 'حدد الإجابة الصحيحة',
    addOption: 'إضافة خيار جديد',
    sourceType: 'نوع المصدر',
    difficulty: 'المستوى',
    explanationEn: 'الشرح (إنجليزي)',
    explanationAr: 'الشرح (عربي)',
    publish: 'نشر على المنصة',
    error: 'حدث خطأ غير متوقع.',
    questionRequired: 'أدخل نص السؤال المطلوب.',
    optionsRequired: 'أضف خيارين على الأقل.',
    englishOptionRequired: 'أدخل النص الإنجليزي لكل خيار.',
    arabicOptionRequired: 'أدخل النص العربي لكل خيار.',
    optionLabel: 'الخيار',
    answerEn: 'الإجابة (EN)',
    answerAr: 'الإجابة (AR)',
    questionLabel: 'نص السؤال',
    explanationLabel: 'شرح الإجابة',
  },
} as const;

const createEmptyOption = (index: number): QuizQuestionOption => ({
  id: crypto.randomUUID(),
  label_en: '',
  label_ar: '',
  sort_order: index,
});

interface CreateQuizQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newQuestion: QuizQuestion) => void;
  lang: 'en' | 'ar';
}

export const CreateQuizQuestionModal = ({
  isOpen,
  onClose,
  onSuccess,
  lang,
}: CreateQuizQuestionModalProps) => {
  const t = translations[lang];
  const [languageMode, setLanguageMode] = useState<'en' | 'ar' | 'both'>('both');
  const [questionEn, setQuestionEn] = useState('');
  const [questionAr, setQuestionAr] = useState('');
  const [explanationEn, setExplanationEn] = useState('');
  const [explanationAr, setExplanationAr] = useState('');
  const [options, setOptions] = useState<QuizQuestionOption[]>([createEmptyOption(0), createEmptyOption(1)]);
  const [correctOptionId, setCorrectOptionId] = useState('');
  const [sourceType, setSourceType] = useState<SourceType>('quran');
  const [sourceReference, setSourceReference] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [category] = useState('Daily Knowledge');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const showEnglishFields = languageMode === 'en' || languageMode === 'both';
  const showArabicFields = languageMode === 'ar' || languageMode === 'both';

  const handleOptionChange = (idx: number, field: 'label_en' | 'label_ar', val: string) => {
    setOptions((curr) => curr.map((opt, i) => (i === idx ? { ...opt, [field]: val } : opt)));
  };

  const handleRemoveOption = (optionId: string) => {
    setOptions((current) => {
      if (current.length <= 2) {
        return current;
      }

      const next = current
        .filter((option) => option.id !== optionId)
        .map((option, index) => ({ ...option, sort_order: index }));

      if (correctOptionId === optionId) {
        setCorrectOptionId(next[0]?.id || '');
      }

      return next;
    });
  };

  const handleAddOption = () => {
    if (options.length >= 5) return;
    setOptions((current) => [...current, createEmptyOption(current.length)]);
  };

  const resetForm = () => {
    setLanguageMode('both');
    setQuestionEn('');
    setQuestionAr('');
    setExplanationEn('');
    setExplanationAr('');
    setOptions([createEmptyOption(0), createEmptyOption(1)]);
    setCorrectOptionId('');
    setSourceType('quran');
    setSourceReference('');
    setDifficulty('beginner');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const prepared = options
        .map((option, index) => ({
          ...option,
          label_en: option.label_en.trim(),
          label_ar: option.label_ar?.trim() || null,
          sort_order: index,
        }))
        .filter((option) => option.label_en || option.label_ar);

      if (prepared.length < 2) {
        throw new Error(t.optionsRequired);
      }

      if ((showEnglishFields && !questionEn.trim()) || (showArabicFields && !questionAr.trim())) {
        throw new Error(t.questionRequired);
      }

      if (prepared.some((option) => showEnglishFields && !option.label_en)) {
        throw new Error(t.englishOptionRequired);
      }

      if (prepared.some((option) => showArabicFields && !option.label_ar)) {
        throw new Error(t.arabicOptionRequired);
      }

      const savedQuestion = await contentService.saveQuestion({
        question_en: showEnglishFields ? questionEn : '',
        question_ar: showArabicFields ? questionAr || null : null,
        explanation_en: showEnglishFields ? explanationEn || null : null,
        explanation_ar: showArabicFields ? explanationAr || null : null,
        source_type: sourceType,
        source_reference: sourceReference,
        difficulty,
        category,
        correct_option_id: correctOptionId || prepared[0].id,
        is_published: true,
        is_verified: true,
        options: prepared,
      });

      onSuccess(savedQuestion);
      onClose();
      resetForm();
    } catch (submitError: any) {
      setError(submitError.message || t.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl md:p-10"
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 40 }}
          className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[3rem] border border-white/10 bg-app-card shadow-2xl"
        >
          <div className="border-b border-white/5 bg-white/[0.02] p-8 md:p-10">
            <div className={cn('flex items-center justify-between', lang === 'ar' && 'flex-row-reverse')}>
              <div className={cn('flex items-center gap-5', lang === 'ar' && 'flex-row-reverse text-right')}>
                <div className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-app-accent text-app-bg shadow-2xl shadow-app-accent/20">
                  <HelpCircle className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-app-text md:text-3xl">{t.title}</h2>
                  <p className="mt-1 text-sm font-medium text-app-muted">{t.subtitle}</p>
                </div>
              </div>
              <button onClick={onClose} className="rounded-full bg-white/5 p-2.5 text-app-muted transition-all hover:text-app-text active:scale-90">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 md:p-10">
            <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-7">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className={cn('flex items-center gap-2 text-app-muted', lang === 'ar' && 'flex-row-reverse')}>
                      <Languages className="h-3 w-3" />
                      <span className="text-[9px] font-black uppercase tracking-widest">{t.languageMode}</span>
                    </div>
                    <select
                      value={languageMode}
                      onChange={(e) => setLanguageMode(e.target.value as 'en' | 'ar' | 'both')}
                      className="w-full rounded-xl border border-white/10 bg-app-bg p-3 text-xs text-app-text outline-none"
                    >
                      <option value="en">{t.englishOnly}</option>
                      <option value="ar">{t.arabicOnly}</option>
                      <option value="both">{t.bothLanguages}</option>
                    </select>
                  </div>

                  <div className={cn('mb-1 flex items-center gap-3 text-app-accent', lang === 'ar' && 'flex-row-reverse')}>
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t.questionLabel}</span>
                  </div>

                  <div className="space-y-3">
                    {showEnglishFields && (
                      <input
                        value={questionEn}
                        onChange={(e) => setQuestionEn(e.target.value)}
                        placeholder={t.questionEn}
                        className="w-full rounded-2xl border border-white/10 bg-app-bg p-4 font-bold text-app-text outline-none focus:border-app-accent/50"
                      />
                    )}
                    {showArabicFields && (
                      <input
                        value={questionAr}
                        onChange={(e) => setQuestionAr(e.target.value)}
                        placeholder={t.questionAr}
                        className="w-full rounded-2xl border border-white/10 bg-app-bg p-4 text-right font-bold text-app-text outline-none focus:border-app-accent/50"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className={cn('mb-1 flex items-center gap-3 text-indigo-400', lang === 'ar' && 'flex-row-reverse')}>
                    <Lightbulb className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t.explanationLabel}</span>
                  </div>

                  <div className="space-y-3">
                    {showEnglishFields && (
                      <textarea
                        value={explanationEn}
                        onChange={(e) => setExplanationEn(e.target.value)}
                        placeholder={t.explanationEn}
                        rows={3}
                        className="w-full rounded-2xl border border-white/10 bg-app-bg p-4 text-app-text outline-none focus:border-app-accent/50"
                      />
                    )}
                    {showArabicFields && (
                      <textarea
                        value={explanationAr}
                        onChange={(e) => setExplanationAr(e.target.value)}
                        placeholder={t.explanationAr}
                        rows={3}
                        className="w-full rounded-2xl border border-white/10 bg-app-bg p-4 text-right text-app-text outline-none focus:border-app-accent/50"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6 lg:col-span-5">
                <div className="rounded-[2rem] border border-white/5 bg-white/[0.03] p-6">
                  <div className={cn('mb-4 flex items-center justify-between', lang === 'ar' && 'flex-row-reverse')}>
                    <h3 className="text-xs font-black uppercase tracking-widest text-app-text">{t.correctOption}</h3>
                    <span className="text-[10px] font-bold text-app-accent">{options.length}/5</span>
                  </div>

                  <div className="space-y-2.5">
                    {options.map((opt, i) => (
                      <div
                        key={opt.id}
                        className={cn(
                          'group flex cursor-pointer flex-col gap-1.5 rounded-xl border p-3.5 transition-all',
                          correctOptionId === opt.id ? 'border-app-accent/30 bg-app-accent/10' : 'border-white/5 bg-app-bg hover:border-white/20'
                        )}
                        onClick={() => setCorrectOptionId(opt.id)}
                      >
                        <div className={cn('flex items-center justify-between', lang === 'ar' && 'flex-row-reverse')}>
                          <span className="text-[9px] font-bold text-app-muted">
                            {t.optionLabel} {i + 1}
                          </span>
                          <div className={cn('flex items-center gap-2', lang === 'ar' && 'flex-row-reverse')}>
                            {options.length > 2 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveOption(opt.id);
                                }}
                                className="rounded-full p-1 text-app-muted transition-colors hover:text-red-400"
                                aria-label={`Remove option ${i + 1}`}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <div className={cn('flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors', correctOptionId === opt.id ? 'border-app-accent bg-app-accent' : 'border-white/20')}>
                              {correctOptionId === opt.id && <Check className="h-2.5 w-2.5 stroke-[4] text-app-bg" />}
                            </div>
                          </div>
                        </div>

                        {showEnglishFields && (
                          <input
                            onClick={(e) => e.stopPropagation()}
                            value={opt.label_en}
                            onChange={(e) => handleOptionChange(i, 'label_en', e.target.value)}
                            placeholder={t.answerEn}
                            className="bg-transparent text-sm font-bold text-app-text outline-none"
                          />
                        )}

                        {showArabicFields && (
                          <input
                            onClick={(e) => e.stopPropagation()}
                            value={opt.label_ar || ''}
                            onChange={(e) => handleOptionChange(i, 'label_ar', e.target.value)}
                            placeholder={t.answerAr}
                            className="bg-transparent text-right text-sm font-bold text-app-text outline-none"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="mt-3 w-full rounded-xl border border-dashed border-white/10 py-2.5 text-[9px] font-black uppercase tracking-widest text-app-muted transition-all hover:border-app-accent hover:text-app-accent"
                  >
                    {t.addOption}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className={cn('flex items-center gap-2 text-app-muted', lang === 'ar' && 'flex-row-reverse')}>
                      <BookOpen className="h-3 w-3" />
                      <span className="text-[9px] font-black uppercase tracking-widest">{t.sourceType}</span>
                    </div>
                    <select value={sourceType} onChange={(e) => setSourceType(e.target.value as SourceType)} className="w-full rounded-xl border border-white/10 bg-app-bg p-2.5 text-xs text-app-text outline-none">
                      <option value="quran">Quran</option>
                      <option value="hadith">Hadith</option>
                      <option value="scholar">Scholar</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <div className={cn('flex items-center gap-2 text-app-muted', lang === 'ar' && 'flex-row-reverse')}>
                      <Layers className="h-3 w-3" />
                      <span className="text-[9px] font-black uppercase tracking-widest">{t.difficulty}</span>
                    </div>
                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as 'beginner' | 'intermediate' | 'advanced')} className="w-full rounded-xl border border-white/10 bg-app-bg p-2.5 text-xs text-app-text outline-none">
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Medium</option>
                      <option value="advanced">Expert</option>
                    </select>
                  </div>
                </div>

                {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-[10px] text-red-400">{error}</div>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-app-accent py-4 text-sm font-black uppercase tracking-widest text-app-bg shadow-xl shadow-app-accent/20 transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : t.publish}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const Check = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={3}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
