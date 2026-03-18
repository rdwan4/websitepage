import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2, Plus, X, HelpCircle, Lightbulb, BookOpen, Layers, MessageSquare, ChevronRight } from 'lucide-react';
import { contentService } from '../services/contentService';
import { QuizQuestion, QuizQuestionOption, SourceType } from '../types';
import { cn } from '../lib/utils';

const translations = {
  en: {
    title: 'Daily Quiz Question',
    subtitle: 'Create engaging knowledge tests',
    questionEn: 'Question (English)',
    questionAr: 'Question (Arabic)',
    correctOption: 'Mark the correct answer',
    addOption: 'Add New Option',
    sourceType: 'Source Type',
    sourceReference: 'Reference',
    difficulty: 'Level',
    category: 'Category',
    explanationEn: 'Explanation (English)',
    explanationAr: 'Explanation (Arabic)',
    publish: 'Publish to Platform',
    cancel: 'Discard',
    error: 'An unexpected error occurred.',
  },
  ar: {
    title: 'سؤال الاختبار اليومي',
    subtitle: 'أنشئ اختبارات معرفية تفاعلية',
    questionEn: 'السؤال (إنجليزي)',
    questionAr: 'السؤال (عربي)',
    correctOption: 'حدد الإجابة الصحيحة',
    addOption: 'إضافة خيار جديد',
    sourceType: 'نوع المصدر',
    sourceReference: 'المرجع',
    difficulty: 'المستوى',
    category: 'الفئة',
    explanationEn: 'الشرح (إنجليزي)',
    explanationAr: 'الشرح (عربي)',
    publish: 'نشر على المنصة',
    cancel: 'إلغاء',
    error: 'حدث خطأ غير متوقع.',
  },
};

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
  const [questionEn, setQuestionEn] = useState('');
  const [questionAr, setQuestionAr] = useState('');
  const [explanationEn, setExplanationEn] = useState('');
  const [explanationAr, setExplanationAr] = useState('');
  const [options, setOptions] = useState<QuizQuestionOption[]>([createEmptyOption(0), createEmptyOption(1)]);
  const [correctOptionId, setCorrectOptionId] = useState('');
  const [sourceType, setSourceType] = useState<SourceType>('quran');
  const [sourceReference, setSourceReference] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [category, setCategory] = useState('Daily Knowledge');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleOptionChange = (idx: number, field: 'label_en' | 'label_ar', val: string) => {
    setOptions(curr => curr.map((opt, i) => (i === idx ? { ...opt, [field]: val } : opt)));
  };

  const handleAddOption = () => {
    if (options.length >= 5) return;
    setOptions(current => [...current, createEmptyOption(current.length)]);
  };

  const resetForm = () => {
    setQuestionEn('');
    setQuestionAr('');
    setExplanationEn('');
    setExplanationAr('');
    setOptions([createEmptyOption(0), createEmptyOption(1)]);
    setCorrectOptionId('');
    setSourceType('quran');
    setSourceReference('');
    setDifficulty('beginner');
    setCategory('Daily Knowledge');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const prepared = options
        .filter(option => option.label_en.trim())
        .map((option, index) => ({ ...option, sort_order: index }));

      if (prepared.length < 2) {
        throw new Error(lang === 'en' ? 'Add at least two options.' : 'أضف خيارين على الأقل.');
      }

      const savedQuestion = await contentService.saveQuestion({
        question_en: questionEn,
        question_ar: questionAr || null,
        explanation_en: explanationEn || null,
        explanation_ar: explanationAr || null,
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
          onClick={e => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 40 }}
          className="relative flex flex-col w-full max-w-5xl max-h-[92vh] overflow-hidden bg-app-card border border-white/10 shadow-2xl rounded-[3rem]"
        >
          {/* HEADER */}
          <div className="p-8 md:p-10 border-b border-white/5 bg-white/[0.02]">
             <div className={cn("flex items-center justify-between", lang === 'ar' && "flex-row-reverse")}>
                <div className={cn("flex items-center gap-5", lang === 'ar' && "flex-row-reverse text-right")}>
                   <div className="h-14 w-14 rounded-[1.2rem] bg-app-accent flex items-center justify-center text-app-bg shadow-2xl shadow-app-accent/20">
                      <HelpCircle className="h-7 w-7" />
                   </div>
                   <div>
                      <h2 className="text-2xl font-bold text-app-text md:text-3xl tracking-tight">{t.title}</h2>
                      <p className="text-sm text-app-muted font-medium mt-1">{t.subtitle}</p>
                   </div>
                </div>
                <button onClick={onClose} className="p-2.5 rounded-full bg-white/5 text-app-muted hover:text-app-text transition-all active:scale-90">
                   <X className="h-5 w-5" />
                </button>
             </div>
          </div>

          <div className="overflow-y-auto flex-1 p-8 md:p-10">
            <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-12">

               {/* LEFT COLUMN: MAIN CONTENT */}
               <div className="lg:col-span-7 space-y-6">
                  <div className="space-y-3">
                     <div className={cn("flex items-center gap-3 text-app-accent mb-1", lang === 'ar' && "flex-row-reverse")}>
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{lang === 'en' ? 'The Question' : 'نص السؤال'}</span>
                     </div>
                     <div className="space-y-3">
                        <input
                          required
                          value={questionEn}
                          onChange={e => setQuestionEn(e.target.value)}
                          placeholder={t.questionEn}
                          className="w-full rounded-2xl bg-app-bg border border-white/10 p-4 text-app-text outline-none focus:border-app-accent/50 font-bold"
                        />
                        <input
                          value={questionAr}
                          onChange={e => setQuestionAr(e.target.value)}
                          placeholder={t.questionAr}
                          className="w-full rounded-2xl bg-app-bg border border-white/10 p-4 text-right text-app-text outline-none focus:border-app-accent/50 font-bold"
                        />
                     </div>
                  </div>

                  <div className="space-y-3">
                     <div className={cn("flex items-center gap-3 text-indigo-400 mb-1", lang === 'ar' && "flex-row-reverse")}>
                        <Lightbulb className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{lang === 'en' ? 'Explanation' : 'شرح الإجابة'}</span>
                     </div>
                     <div className="space-y-3">
                        <textarea
                          value={explanationEn}
                          onChange={e => setExplanationEn(e.target.value)}
                          placeholder={t.explanationEn}
                          rows={3}
                          className="w-full rounded-2xl bg-app-bg border border-white/10 p-4 text-app-text outline-none focus:border-app-accent/50"
                        />
                        <textarea
                          value={explanationAr}
                          onChange={e => setExplanationAr(e.target.value)}
                          placeholder={t.explanationAr}
                          rows={3}
                          className="w-full rounded-2xl bg-app-bg border border-white/10 p-4 text-right text-app-text outline-none focus:border-app-accent/50"
                        />
                     </div>
                  </div>
               </div>

               {/* RIGHT COLUMN: OPTIONS & SETTINGS */}
               <div className="lg:col-span-5 space-y-6">
                  <div className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/5">
                     <div className={cn("flex items-center justify-between mb-4", lang === 'ar' && "flex-row-reverse")}>
                        <h3 className="text-xs font-black uppercase tracking-widest text-app-text">{t.correctOption}</h3>
                        <span className="text-[10px] font-bold text-app-accent">{options.length}/5</span>
                     </div>
                     <div className="space-y-2.5">
                        {options.map((opt, i) => (
                          <div
                            key={opt.id}
                            className={cn(
                              "group flex flex-col gap-1.5 p-3.5 rounded-xl border transition-all cursor-pointer",
                              correctOptionId === opt.id ? "bg-app-accent/10 border-app-accent/30" : "bg-app-bg border-white/5 hover:border-white/20"
                            )}
                            onClick={() => setCorrectOptionId(opt.id)}
                          >
                             <div className={cn("flex items-center justify-between", lang === 'ar' && "flex-row-reverse")}>
                                <span className="text-[9px] font-bold text-app-muted">Option {i+1}</span>
                                <div className={cn("h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors", correctOptionId === opt.id ? "border-app-accent bg-app-accent" : "border-white/20")}>
                                   {correctOptionId === opt.id && <Check className="h-2.5 w-2.5 text-app-bg stroke-[4]" />}
                                </div>
                             </div>
                             <input
                               required
                               onClick={e => e.stopPropagation()}
                               value={opt.label_en}
                               onChange={e => handleOptionChange(i, 'label_en', e.target.value)}
                               placeholder="Answer (EN)"
                               className="bg-transparent outline-none text-sm text-app-text font-bold"
                             />
                             <input
                               onClick={e => e.stopPropagation()}
                               value={opt.label_ar || ''}
                               onChange={e => handleOptionChange(i, 'label_ar', e.target.value)}
                               placeholder="الإجابة (AR)"
                               className="bg-transparent outline-none text-sm text-right text-app-text font-bold"
                             />
                          </div>
                        ))}
                     </div>
                     <button
                       type="button"
                       onClick={handleAddOption}
                       className="w-full mt-3 py-2.5 rounded-xl border border-dashed border-white/10 text-[9px] font-black uppercase tracking-widest text-app-muted hover:text-app-accent hover:border-app-accent transition-all"
                     >
                        {t.addOption}
                     </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1.5">
                        <div className={cn("flex items-center gap-2 text-app-muted", lang === 'ar' && "flex-row-reverse")}>
                           <BookOpen className="h-3 w-3" />
                           <span className="text-[9px] font-black uppercase tracking-widest">{t.sourceType}</span>
                        </div>
                        <select value={sourceType} onChange={e => setSourceType(e.target.value as any)} className="w-full rounded-xl bg-app-bg border border-white/10 p-2.5 text-xs text-app-text outline-none">
                           <option value="quran">Quran</option>
                           <option value="hadith">Hadith</option>
                           <option value="scholar">Scholar</option>
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <div className={cn("flex items-center gap-2 text-app-muted", lang === 'ar' && "flex-row-reverse")}>
                           <Layers className="h-3 w-3" />
                           <span className="text-[9px] font-black uppercase tracking-widest">{t.difficulty}</span>
                        </div>
                        <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)} className="w-full rounded-xl bg-app-bg border border-white/10 p-2.5 text-xs text-app-text outline-none">
                           <option value="beginner">Beginner</option>
                           <option value="intermediate">Medium</option>
                           <option value="advanced">Expert</option>
                        </select>
                     </div>
                  </div>

                  {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] text-center">{error}</div>}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-2xl bg-app-accent text-app-bg font-black uppercase tracking-widest text-sm shadow-xl shadow-app-accent/20 active:scale-[0.98] transition-all"
                  >
                     {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : t.publish}
                  </button>
               </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const Check = ({ className }: { className?: string; strokeWidth?: number }) => (
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
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
