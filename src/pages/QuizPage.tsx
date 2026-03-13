import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Award, BookOpen, CheckCircle2, Loader2, Plus, RotateCcw, Trophy, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { contentService } from '../services/contentService';
import { postService } from '../services/postService';
import { supabase } from '../supabaseClient';
import { DailyQuizBundle, LeaderboardEntry } from '../types';

const translations = {
  en: {
    title: 'Daily Quiz',
    leaderboard: 'Top 3 Scorers',
    noQuestion: "Today's quiz is not available yet. Please check back later.",
    submit: 'Submit Answer',
    next: 'Next Question',
    finish: 'Finish Quiz',
    correct: 'Correct! Well done.',
    incorrect: 'Incorrect. Better luck next time.',
    complete: 'Quiz Completed!',
    resultSignedIn: "Your final answers were saved to today's record.",
    resultGuest: 'You finished the quiz. Sign in if you want future results saved.',
    review: 'Review Questions',
    nextSet: 'Load 5 New Questions',
    addQuestion: 'Add Quiz Question',
    points: 'pts',
    loading: 'Loading quiz...',
    empty: 'No verified daily questions are published yet.',
    source: 'Source',
    explanation: 'Explanation',
  },
  ar: {
    title: '\u0627\u0644\u0627\u062e\u062a\u0628\u0627\u0631 \u0627\u0644\u064a\u0648\u0645\u064a',
    leaderboard: '\u0623\u0639\u0644\u0649 3 \u0646\u062a\u0627\u0626\u062c',
    noQuestion: '\u0627\u062e\u062a\u0628\u0627\u0631 \u0627\u0644\u064a\u0648\u0645 \u063a\u064a\u0631 \u0645\u062a\u0627\u062d \u0628\u0639\u062f. \u064a\u0631\u062c\u0649 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629 \u0644\u0627\u062d\u0642\u0627.',
    submit: '\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0625\u062c\u0627\u0628\u0629',
    next: '\u0627\u0644\u0633\u0624\u0627\u0644 \u0627\u0644\u062a\u0627\u0644\u064a',
    finish: '\u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u0627\u062e\u062a\u0628\u0627\u0631',
    correct: '\u0625\u062c\u0627\u0628\u0629 \u0635\u062d\u064a\u062d\u0629.',
    incorrect: '\u0625\u062c\u0627\u0628\u0629 \u062e\u0627\u0637\u0626\u0629.',
    complete: '\u0627\u0643\u062a\u0645\u0644 \u0627\u0644\u0627\u062e\u062a\u0628\u0627\u0631',
    resultSignedIn: '\u062a\u0645 \u062d\u0641\u0638 \u0625\u062c\u0627\u0628\u0627\u062a\u0643 \u0627\u0644\u0646\u0647\u0627\u0626\u064a\u0629 \u0641\u064a \u0633\u062c\u0644 \u0627\u0644\u064a\u0648\u0645.',
    resultGuest: '\u0623\u0646\u0647\u064a\u062a \u0627\u0644\u0627\u062e\u062a\u0628\u0627\u0631. \u0633\u062c\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0625\u0630\u0627 \u0623\u0631\u062f\u062a \u062d\u0641\u0638 \u0627\u0644\u0646\u062a\u0627\u0626\u062c \u0644\u0627\u062d\u0642\u0627.',
    review: '\u0645\u0631\u0627\u062c\u0639\u0629 \u0627\u0644\u0623\u0633\u0626\u0644\u0629',
    nextSet: '\u062a\u062d\u0645\u064a\u0644 5 \u0623\u0633\u0626\u0644\u0629 \u062c\u062f\u064a\u062f\u0629',
    addQuestion: '\u0625\u0636\u0627\u0641\u0629 \u0633\u0624\u0627\u0644',
    points: '\u0646\u0642\u0637\u0629',
    loading: '\u062c\u0627\u0631\u064a \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0627\u062e\u062a\u0628\u0627\u0631...',
    empty: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0623\u0633\u0626\u0644\u0629 \u064a\u0648\u0645\u064a\u0629 \u0645\u0648\u062b\u0642\u0629 \u0645\u0646\u0634\u0648\u0631\u0629 \u0628\u0639\u062f.',
    source: '\u0627\u0644\u0645\u0635\u062f\u0631',
    explanation: '\u0627\u0644\u0634\u0631\u062d',
  },
};

export const QuizPage = ({ lang = 'en' }: { lang: 'en' | 'ar' }) => {
  const { profile } = useAuth();
  const t = translations[lang];
  const [bundle, setBundle] = useState<DailyQuizBundle | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'quiz' | 'result'>('quiz');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [resultMessage, setResultMessage] = useState('');

  const questions = bundle?.questions || [];
  const activeQuestion = questions[currentIndex];
  const selectedOptionId = activeQuestion ? answers[activeQuestion.id] : null;
  const answerReview = useMemo(
    () =>
      questions.map((question) => {
        const selectedId = answers[question.id];
        const selectedOption = question.options.find((option) => option.id === selectedId) || null;
        const correctOption = question.options.find((option) => option.id === question.correct_option_id) || null;
        return {
          question,
          selectedOption,
          correctOption,
          isCorrect: selectedId === question.correct_option_id,
        };
      }),
    [answers, questions]
  );

  const score = useMemo(
    () =>
      questions.reduce(
        (total, question) => total + (answers[question.id] === question.correct_option_id ? 1 : 0),
        0
      ),
    [answers, questions]
  );

  const loadQuiz = async () => {
    setLoading(true);
    setError('');
    try {
      const [quizBundle, leaderboardData] = await Promise.all([
        contentService.getDailyQuiz(profile?.id),
        postService.getLeaderboard(3),
      ]);

      const nextAnswers = Object.fromEntries(
        (quizBundle.answers || []).map((answer) => [answer.question_id, answer.selected_option_id])
      );
      const allAnswered =
        quizBundle.questions.length > 0 &&
        quizBundle.questions.every((question) => Boolean(nextAnswers[question.id]));

      setBundle(quizBundle);
      setLeaderboard(leaderboardData);
      setAnswers(nextAnswers);
      setCurrentIndex(0);
      setStep(allAnswered ? 'result' : 'quiz');
      setResultMessage('');
    } catch (loadError: any) {
      setError(loadError.message || 'Failed to load quiz.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQuiz();
  }, [profile?.id]);

  useEffect(() => {
    const leaderboardSubscription = supabase
      .channel('quiz-leaderboard')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, async () => {
        const refreshed = await postService.getLeaderboard(3);
        setLeaderboard(refreshed);
      })
      .subscribe();

    const handleQuizUpdated = () => {
      void loadQuiz();
    };

    window.addEventListener('quiz-updated', handleQuizUpdated);

    return () => {
      supabase.removeChannel(leaderboardSubscription);
      window.removeEventListener('quiz-updated', handleQuizUpdated);
    };
  }, [profile?.id]);

  const handleSubmitAnswer = async () => {
    if (!activeQuestion || !selectedOptionId) return;

    if (!profile) {
      const correct = selectedOptionId === activeQuestion.correct_option_id;
      setResultMessage(correct ? t.correct : t.incorrect);
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((current) => current + 1);
      } else {
        setStep('result');
      }
      return;
    }

    setSaving(true);
    setError('');

    try {
      const saved = await contentService.submitAnswer(profile.id, activeQuestion, selectedOptionId, bundle?.dateKey);
      const correct = saved.selected_option_id === activeQuestion.correct_option_id;
      setAnswers((current) => ({ ...current, [activeQuestion.id]: saved.selected_option_id }));
      setResultMessage(correct ? t.correct : t.incorrect);

      if (currentIndex === questions.length - 1) {
        setStep('result');
        await postService.saveQuizScore({
          user_id: profile.id,
          score: score * 20 + (correct ? 20 : 0),
          total_questions: questions.length,
          category: 'daily-quiz',
        });
        const refreshed = await postService.getLeaderboard(3);
        setLeaderboard(refreshed);
      } else {
        setCurrentIndex((current) => current + 1);
      }
    } catch (submitError: any) {
      setError(submitError.message || 'Failed to save answer.');
    } finally {
      setSaving(false);
    }
  };

  const handleReviewAnswers = () => {
    setCurrentIndex(0);
    setResultMessage('');
    setStep('quiz');
  };

  const handleLoadNextSet = async () => {
    await loadQuiz();
  };

  return (
    <motion.div
      className="min-h-screen bg-app-bg pb-20 pt-32"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="container mx-auto px-6">
        <div
          className={cn(
            'mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-center',
            lang === 'ar' && 'md:flex-row-reverse'
          )}
        >
          <div>
            <h1 className="mb-3 font-serif text-6xl text-app-text">{t.title}</h1>
            {bundle?.questions?.length ? (
              <p className="text-app-muted">
                {step === 'result'
                  ? `${t.complete} ${score}/${bundle.questions.length}`
                  : lang === 'en'
                    ? `Question ${Math.min(currentIndex + 1, bundle.questions.length)} of ${bundle.questions.length}`
                    : `\u0627\u0644\u0633\u0624\u0627\u0644 ${Math.min(currentIndex + 1, bundle.questions.length)} \u0645\u0646 ${bundle.questions.length}`}
              </p>
            ) : (
              <p className="text-app-muted">{t.noQuestion}</p>
            )}
          </div>

          {profile?.role === 'admin' && (
            <button
              onClick={() => window.dispatchEvent(new Event('open-create-quiz'))}
              className="flex items-center gap-3 rounded-2xl bg-app-accent px-6 py-3 text-sm font-bold uppercase tracking-widest text-app-bg shadow-lg shadow-app-accent/20 transition-transform hover:scale-105"
            >
              <Plus className="h-5 w-5" />
              {t.addQuestion}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="min-h-[28rem] rounded-[3rem] border border-white/10 bg-app-card p-8 shadow-xl">
              {error && (
                <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="flex flex-col items-center gap-4 text-app-muted">
                    <Loader2 className="h-8 w-8 animate-spin text-app-accent" />
                    <p>{t.loading}</p>
                  </div>
                </div>
              ) : step === 'result' ? (
                <div className="flex h-full items-center justify-center text-center">
                  <div>
                    <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gold/10 text-gold">
                      <Trophy className="h-12 w-12" />
                    </div>
                    <h2 className="mb-3 text-3xl font-bold text-app-text">{t.complete}</h2>
                    <p className="mb-8 text-app-muted">
                      {score} / {questions.length}. {profile ? t.resultSignedIn : t.resultGuest}
                    </p>
                    <div className="mx-auto mb-8 max-w-3xl space-y-4 text-left">
                      {answerReview.map(({ question, selectedOption, correctOption, isCorrect }, index) => (
                        <div key={question.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="mb-2 flex items-center justify-between gap-4">
                            <p className="font-bold text-app-text">
                              {index + 1}. {lang === 'ar' ? question.question_ar || question.question_en : question.question_en}
                            </p>
                            <span className={cn('inline-flex items-center gap-2 text-sm font-bold', isCorrect ? 'text-emerald-400' : 'text-red-400')}>
                              {isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                              {isCorrect ? (lang === 'en' ? 'Correct' : 'صحيح') : (lang === 'en' ? 'Wrong' : 'خطأ')}
                            </span>
                          </div>
                          <p className="text-sm text-app-muted">
                            {lang === 'en' ? 'Your answer: ' : 'إجابتك: '}
                            <span className="font-semibold text-app-text">
                              {selectedOption ? (lang === 'ar' ? selectedOption.label_ar || selectedOption.label_en : selectedOption.label_en) : '-'}
                            </span>
                          </p>
                          <p className="mt-1 text-sm text-app-muted">
                            {lang === 'en' ? 'Correct answer: ' : 'الإجابة الصحيحة: '}
                            <span className="font-semibold text-app-accent">
                              {correctOption ? (lang === 'ar' ? correctOption.label_ar || correctOption.label_en : correctOption.label_en) : '-'}
                            </span>
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                      <button
                        onClick={handleReviewAnswers}
                        className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-bold text-app-text transition-colors hover:bg-white/10"
                      >
                        <RotateCcw className="h-4 w-4" />
                        {t.review}
                      </button>
                      <button
                        onClick={() => void handleLoadNextSet()}
                        className="inline-flex items-center gap-3 rounded-2xl bg-app-accent px-6 py-4 font-bold text-app-bg transition-colors hover:bg-app-accent-hover"
                      >
                        <RotateCcw className="h-4 w-4" />
                        {t.nextSet}
                      </button>
                    </div>
                  </div>
                </div>
              ) : activeQuestion ? (
                <div>
                  <div className="mb-8 flex items-center justify-between">
                    <span className="rounded-full bg-app-accent/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-app-accent">
                      {activeQuestion.category}
                    </span>
                    <span className="text-xs text-app-muted">{activeQuestion.difficulty}</span>
                  </div>

                  <h2 className="mb-8 text-3xl font-bold leading-tight text-app-text">
                    {lang === 'ar' ? activeQuestion.question_ar || activeQuestion.question_en : activeQuestion.question_en}
                  </h2>

                  <div className="space-y-4">
                    {activeQuestion.options.map((option) => {
                      const isSelected = selectedOptionId === option.id;
                      return (
                        <button
                          key={option.id}
                          onClick={() =>
                            setAnswers((current) => ({
                              ...current,
                              [activeQuestion.id]: option.id,
                            }))
                          }
                          className={cn(
                            'w-full rounded-2xl border-2 p-5 text-left transition-all',
                            isSelected
                              ? 'border-app-accent bg-app-accent/10 text-app-text'
                              : 'border-white/10 bg-white/5 text-app-muted hover:border-app-accent/50'
                          )}
                        >
                          {lang === 'ar' ? option.label_ar || option.label_en : option.label_en}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => void handleSubmitAnswer()}
                    disabled={!selectedOptionId || saving}
                    className="mt-8 w-full rounded-2xl bg-app-accent py-4 text-center font-bold uppercase tracking-widest text-app-bg transition-opacity disabled:opacity-50"
                  >
                    {saving ? t.loading : currentIndex === questions.length - 1 ? t.finish : t.submit}
                  </button>

                  {(activeQuestion.explanation_en || activeQuestion.explanation_ar || activeQuestion.source_reference) && (
                    <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
                      {(activeQuestion.explanation_en || activeQuestion.explanation_ar) && (
                        <p className="mb-3 text-sm text-app-text">
                          <span className="font-semibold text-app-accent">{t.explanation}: </span>
                          {lang === 'ar'
                            ? activeQuestion.explanation_ar || activeQuestion.explanation_en
                            : activeQuestion.explanation_en || activeQuestion.explanation_ar}
                        </p>
                      )}
                      <p className="text-xs text-app-muted">
                        <span className="font-semibold text-app-text">{t.source}: </span>
                        {activeQuestion.source_reference}
                      </p>
                    </div>
                  )}

                  {resultMessage && (
                    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-sm font-bold text-app-accent">
                      {resultMessage}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-center">
                  <div>
                    <BookOpen className="mx-auto mb-6 h-16 w-16 text-app-muted/30" />
                    <p className="text-lg text-app-muted">{t.empty}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="rounded-[3rem] border border-white/10 bg-app-card p-8 shadow-xl">
              <h3 className="mb-6 flex items-center gap-3 text-2xl font-bold text-app-text">
                <Award className="h-7 w-7 text-yellow-400" />
                {t.leaderboard}
              </h3>
              <div className="space-y-5">
                {leaderboard.length ? (
                  leaderboard.map((entry, index) => (
                    <div key={entry.user_id} className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 p-4">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xl text-app-muted">{index + 1}</span>
                        <div className="h-12 w-12 overflow-hidden rounded-full bg-white/10">
                          {entry.avatar_url ? (
                            <img src={entry.avatar_url} alt={entry.display_name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-bold text-app-text">
                              {entry.display_name?.[0]}
                            </div>
                          )}
                        </div>
                        <span className="truncate font-bold text-app-text">{entry.display_name}</span>
                      </div>
                      <span className="whitespace-nowrap font-mono text-lg font-bold text-app-accent">
                        {entry.total_score} <span className="text-xs">{t.points}</span>
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-app-muted">{t.noQuestion}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
