import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2, Plus, X } from 'lucide-react';
import { contentService } from '../services/contentService';
import { QuizQuestion, QuizQuestionOption, SourceType } from '../types';

const translations = {
  en: {
    title: 'Create Daily Quiz Question',
    questionEn: 'Question (English)',
    questionAr: 'Question (Arabic)',
    option: 'Option',
    correctOption: 'Correct Option',
    addOption: 'Add Option',
    sourceType: 'Source Type',
    sourceReference: 'Source Reference',
    difficulty: 'Difficulty',
    category: 'Category',
    explanationEn: 'Explanation (English)',
    explanationAr: 'Explanation (Arabic)',
    publish: 'Publish Question',
    cancel: 'Cancel',
    error: 'Failed to create question.',
  },
  ar: {
    title: 'إنشاء سؤال الاختبار اليومي',
    questionEn: 'السؤال (إنجليزي)',
    questionAr: 'السؤال (عربي)',
    option: 'خيار',
    correctOption: 'الخيار الصحيح',
    addOption: 'إضافة خيار',
    sourceType: 'نوع المصدر',
    sourceReference: 'مرجع المصدر',
    difficulty: 'الصعوبة',
    category: 'الفئة',
    explanationEn: 'الشرح (إنجليزي)',
    explanationAr: 'الشرح (عربي)',
    publish: 'نشر السؤال',
    cancel: 'إلغاء',
    error: 'فشل إنشاء السؤال.',
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

  const handleAddOption = () => {
    if (options.length >= 5) return;
    setOptions((current) => [...current, createEmptyOption(current.length)]);
  };

  const handleOptionChange = (index: number, field: 'label_en' | 'label_ar', value: string) => {
    setOptions((current) =>
      current.map((option, optionIndex) => (optionIndex === index ? { ...option, [field]: value } : option))
    );
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const preparedOptions = options
        .filter((option) => option.label_en.trim())
        .map((option, index) => ({ ...option, sort_order: index }));

      if (preparedOptions.length < 2) {
        throw new Error(lang === 'en' ? 'Add at least two options.' : '\u0623\u0636\u0641 \u062e\u064a\u0627\u0631\u064a\u0646 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644.');
      }

      const fallbackCorrectId = correctOptionId || preparedOptions[0].id;
      const savedQuestion = await contentService.saveQuestion({
        question_en: questionEn,
        question_ar: questionAr || null,
        explanation_en: explanationEn || null,
        explanation_ar: explanationAr || null,
        source_type: sourceType,
        source_reference: sourceReference,
        difficulty,
        category,
        correct_option_id: fallbackCorrectId,
        is_published: true,
        is_verified: true,
        options: preparedOptions,
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
      <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/50 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-app-card p-8 shadow-xl"
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-app-text">{t.title}</h2>
            <button onClick={onClose} className="text-app-muted transition-colors hover:text-app-text">
              <X />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder={t.questionEn}
              value={questionEn}
              onChange={(event) => setQuestionEn(event.target.value)}
              required
              className="w-full rounded-xl bg-white/5 p-3 text-app-text"
            />
            <input
              type="text"
              placeholder={t.questionAr}
              value={questionAr}
              onChange={(event) => setQuestionAr(event.target.value)}
              className="w-full rounded-xl bg-white/5 p-3 text-app-text"
            />
            <textarea
              placeholder={t.explanationEn}
              value={explanationEn}
              onChange={(event) => setExplanationEn(event.target.value)}
              rows={3}
              className="w-full rounded-xl bg-white/5 p-3 text-app-text"
            />
            <textarea
              placeholder={t.explanationAr}
              value={explanationAr}
              onChange={(event) => setExplanationAr(event.target.value)}
              rows={3}
              className="w-full rounded-xl bg-white/5 p-3 text-app-text"
            />

            <hr className="border-white/10" />
            <h3 className="font-bold text-app-text">{t.correctOption}</h3>

            {options.map((option, index) => (
              <div key={option.id} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct_option"
                  checked={(correctOptionId || options[0]?.id) === option.id}
                  onChange={() => setCorrectOptionId(option.id)}
                />
                <input
                  type="text"
                  placeholder={`${t.option} ${index + 1} (EN)`}
                  value={option.label_en}
                  onChange={(event) => handleOptionChange(index, 'label_en', event.target.value)}
                  required
                  className="w-full rounded-xl bg-white/5 p-3 text-app-text"
                />
                <input
                  type="text"
                  placeholder={`${t.option} ${index + 1} (AR)`}
                  value={option.label_ar || ''}
                  onChange={(event) => handleOptionChange(index, 'label_ar', event.target.value)}
                  className="w-full rounded-xl bg-white/5 p-3 text-app-text"
                />
              </div>
            ))}

            <button type="button" onClick={handleAddOption} className="text-sm text-app-accent">
              {t.addOption}
            </button>

            <hr className="border-white/10" />

            <div className="grid grid-cols-2 gap-4">
              <select
                value={sourceType}
                onChange={(event) => setSourceType(event.target.value as SourceType)}
                className="w-full rounded-xl bg-white/5 p-3 text-app-text"
              >
                <option value="quran">Quran</option>
                <option value="hadith">Hadith</option>
                <option value="scholar">Scholar</option>
                <option value="athar">Athar</option>
              </select>
              <input
                type="text"
                placeholder={t.sourceReference}
                value={sourceReference}
                onChange={(event) => setSourceReference(event.target.value)}
                className="w-full rounded-xl bg-white/5 p-3 text-app-text"
              />
              <select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value as typeof difficulty)}
                className="w-full rounded-xl bg-white/5 p-3 text-app-text"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <input
                type="text"
                placeholder={t.category}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-xl bg-white/5 p-3 text-app-text"
              />
            </div>

            {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>}

            <div className="mt-6 flex justify-end gap-4">
              <button type="button" onClick={onClose} className="rounded-xl bg-white/10 px-4 py-2">
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-app-accent px-4 py-2 text-app-bg disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {t.publish}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
