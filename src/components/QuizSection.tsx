import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Award,
  Star,
  Users,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { postService } from '../services/postService';
import { contentService } from '../services/contentService';
import { DailyQuizBundle, LeaderboardEntry } from '../types';
import { useAuth } from '../context/AuthContext';

const copy = {
  en: {
    title: 'Daily Knowledge Quiz',
    subtitle: 'Five verified questions rotate each day from the Supabase question bank.',
    ready: 'Ready to start?',
    startBody: 'Answer today’s 5 questions. Results are saved to your profile when you are signed in.',
    start: 'Start Quiz',
    question: 'Question',
    of: 'of',
    finish: 'Finish Quiz',
    next: 'Next Question',
    complete: 'Quiz Completed!',
    resultSignedIn: 'Your answers were saved to today’s record.',
    resultGuest: 'Sign in to save today’s answers.',
    tryAgain: 'Review Again',
    signInToSave: 'Sign In to Save',
    leaderboard: 'Leaderboard',
    noScores: 'No scores yet',
    points: 'Points',
    loading: 'Loading daily quiz...',
    empty: 'No verified daily questions are published yet.',
    minimumWarning: 'Question bank below recommended minimum. Import 150+ verified questions.',
    explanation: 'Explanation',
    source: 'Source',
  },
  ar: {
    title: 'اختبار المعرفة اليومي',
    subtitle: 'خمسة أسئلة موثقة تتغير يوميا من بنك الأسئلة في Supabase.',
    ready: 'هل أنت جاهز؟',
    startBody: 'أجب عن أسئلة اليوم الخمسة. تحفظ النتائج في ملفك عند تسجيل الدخول.',
    start: 'ابدأ الاختبار',
    question: 'السؤال',
    of: 'من',
    finish: 'إنهاء الاختبار',
    next: 'السؤال التالي',
    complete: 'اكتمل الاختبار',
    resultSignedIn: 'تم حفظ إجاباتك في سجل اليوم.',
    resultGuest: 'سجّل الدخول لحفظ إجابات اليوم.',
    tryAgain: 'مراجعة من جديد',
    signInToSave: 'سجّل الدخول للحفظ',
    leaderboard: 'لوحة المتصدرين',
    noScores: 'لا توجد نتائج بعد',
    points: 'نقاط',
    loading: 'جار تحميل اختبار اليوم...',
    empty: 'لا توجد أسئلة موثقة منشورة بعد.',
    minimumWarning: 'بنك الأسئلة أقل من الحد الموصى به. أضف 150+ سؤالا موثقا.',
    explanation: 'الشرح',
    source: 'المصدر',
  },
};

export const QuizSection = ({ lang, onAuthClick }: { lang: 'en' | 'ar'; onAuthClick: () => void }) => {
  const t = copy[lang];
  const { profile } = useAuth();
  const [step, setStep] = useState<'start' | 'quiz' | 'result'>('start');
  const [bundle, setBundle] = useState<DailyQuizBundle | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const questions = bundle?.questions || [];
  const score = useMemo(
    () => questions.reduce((total, question) => total + (answers[question.id] === question.correct_option_id ? 1 : 0), 0),
    [answers, questions]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [quizBundle, leaderboardData] = await Promise.all([
          contentService.getDailyQuiz(profile?.id),
          postService.getLeaderboard(5),
        ]);

        setBundle(quizBundle);
        setLeaderboard(leaderboardData);

        const answerMap = Object.fromEntries(
          (quizBundle.answers || []).map((answer) => [answer.question_id, answer.selected_option_id])
        );
        setAnswers(answerMap);
      } catch (loadError: any) {
        setError(loadError.message || 'Failed to load quiz.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [profile?.id]);

  const activeQuestion = questions[currentQuestion];
  const isAnswered = activeQuestion ? Boolean(answers[activeQuestion.id]) : false;

  const handleAnswer = async (optionId: string) => {
    if (!activeQuestion || !profile || answers[activeQuestion.id]) {
      if (!profile) {
        setAnswers((current) => ({ ...current, [activeQuestion.id]: optionId }));
      }
      return;
    }

    setSubmitting(true);
    try {
      const saved = await contentService.submitAnswer(profile.id, activeQuestion, optionId, bundle?.dateKey);
      setAnswers((current) => ({ ...current, [activeQuestion.id]: saved.selected_option_id }));
    } catch (saveError: any) {
      setError(saveError.message || 'Failed to save answer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuestAnswer = (optionId: string) => {
    if (!activeQuestion || profile || answers[activeQuestion.id]) return;
    setAnswers((current) => ({ ...current, [activeQuestion.id]: optionId }));
  };

  const handleNext = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((current) => current + 1);
      setSelectedOption(null);
      return;
    }

    setStep('result');

    if (profile) {
      try {
        await postService.saveQuizScore({
          user_id: profile.id,
          score: score * 20,
          total_questions: questions.length,
          category: 'daily-quiz',
        });
        const refreshed = await postService.getLeaderboard(5);
        setLeaderboard(refreshed);
      } catch (saveError: any) {
        setError(saveError.message || 'Failed to save quiz score.');
      }
    }
  };

  const resetQuiz = () => {
    setStep('start');
    setCurrentQuestion(0);
    setSelectedOption(null);
  };

  return (
    <section id="quiz" className="py-32 bg-app-bg relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-7">
            <div className="mb-12">
              <h2 className="text-4xl font-serif text-app-text mb-4">{t.title}</h2>
              <p className="text-app-muted">{t.subtitle}</p>
            </div>

            <div className="bg-app-card border border-white/5 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden min-h-[440px] flex flex-col justify-center">
              {error && (
                <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-app-muted">
                  <Loader2 className="h-8 w-8 animate-spin text-app-accent" />
                  <p>{t.loading}</p>
                </div>
              ) : !bundle?.questions.length ? (
                <div className="text-center">
                  <BookOpen className="mx-auto mb-6 h-14 w-14 text-app-muted/40" />
                  <h3 className="mb-3 text-2xl font-bold text-app-text">{t.empty}</h3>
                  
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  {step === 'start' && (
                    <motion.div
                      key="start"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="text-center"
                    >
                      <div className="w-20 h-20 bg-app-accent/10 rounded-3xl flex items-center justify-center text-app-accent mx-auto mb-8">
                        <Award className="w-10 h-10" />
                      </div>
                      <h3 className="text-2xl font-bold text-app-text mb-4">{t.ready}</h3>
                      <p className="text-app-muted mb-8 max-w-sm mx-auto">{t.startBody}</p>
                      
                      <button
                        onClick={() => setStep('quiz')}
                        className="px-12 py-4 bg-app-accent text-app-bg rounded-2xl font-bold hover:scale-105 transition-all shadow-lg shadow-app-accent/20"
                      >
                        {t.start}
                      </button>
                    </motion.div>
                  )}

                  {step === 'quiz' && activeQuestion && (
                    <motion.div
                      key={activeQuestion.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <div className="flex items-center justify-between mb-8">
                        <span className="text-xs font-bold text-app-accent uppercase tracking-widest">
                          {t.question} {currentQuestion + 1} {t.of} {questions.length}
                        </span>
                        <span className="text-xs font-bold text-app-muted">{activeQuestion.category}</span>
                      </div>

                      <h3 className="text-2xl font-bold text-app-text mb-8 leading-tight">
                        {lang === 'ar' ? activeQuestion.question_ar || activeQuestion.question_en : activeQuestion.question_en}
                      </h3>

                      <div className="space-y-4 mb-8">
                        {activeQuestion.options.map((option) => {
                          const chosenId = answers[activeQuestion.id];
                          const currentSelected = selectedOption || chosenId;
                          const answered = Boolean(chosenId);
                          const isCorrect = option.id === activeQuestion.correct_option_id;
                          const isChosen = currentSelected === option.id;

                          return (
                            <button
                              key={option.id}
                              onClick={() => {
                                setSelectedOption(option.id);
                                if (profile) {
                                  void handleAnswer(option.id);
                                } else {
                                  handleGuestAnswer(option.id);
                                }
                              }}
                              disabled={answered || submitting}
                              className={cn(
                                'w-full p-6 rounded-2xl border text-left transition-all flex items-center justify-between group',
                                !answered
                                  ? 'bg-white/5 border-white/10 hover:border-app-accent/50 hover:bg-white/10'
                                  : isCorrect
                                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'
                                    : isChosen
                                      ? 'bg-red-500/10 border-red-500/50 text-red-400'
                                      : 'bg-white/5 border-white/10 opacity-50'
                              )}
                            >
                              <span className="font-medium">
                                {lang === 'ar' ? option.label_ar || option.label_en : option.label_en}
                              </span>
                              {answered && isCorrect && <CheckCircle2 className="w-5 h-5" />}
                              {answered && isChosen && !isCorrect && <XCircle className="w-5 h-5" />}
                            </button>
                          );
                        })}
                      </div>

                      {isAnswered && (
                        <>
                          {(activeQuestion.explanation_en || activeQuestion.explanation_ar || activeQuestion.source_reference) && (
                            <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5">
                              {(activeQuestion.explanation_en || activeQuestion.explanation_ar) && (
                                <p className="mb-2 text-sm text-app-text">
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

                          <button
                            onClick={() => void handleNext()}
                            className="w-full py-4 bg-app-accent text-app-bg rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-all"
                          >
                            {currentQuestion === questions.length - 1 ? t.finish : t.next}
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </motion.div>
                  )}

                  {step === 'result' && (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center"
                    >
                      <div className="w-24 h-24 bg-gold/10 rounded-full flex items-center justify-center text-gold mx-auto mb-8 relative">
                        <Trophy className="w-12 h-12" />
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2 bg-app-accent text-app-bg w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        >
                          {score}
                        </motion.div>
                      </div>
                      <h3 className="text-3xl font-bold text-app-text mb-2">{t.complete}</h3>
                      <p className="text-app-muted mb-8">
                        {score} / {questions.length}. {profile ? t.resultSignedIn : t.resultGuest}
                      </p>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                          onClick={resetQuiz}
                          className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-app-text hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4" /> {t.tryAgain}
                        </button>
                        {!profile && (
                          <button
                            onClick={onAuthClick}
                            className="w-full sm:w-auto px-8 py-4 bg-app-accent text-app-bg rounded-2xl font-bold hover:scale-105 transition-all"
                          >
                            {t.signInToSave}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-app-card border border-white/5 rounded-[3rem] p-10 shadow-2xl h-full">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-serif text-app-text flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-gold" />
                  {t.leaderboard}
                </h3>
                <Users className="w-5 h-5 text-app-muted" />
              </div>

              <div className="space-y-6">
                {leaderboard.length > 0 ? (
                  leaderboard.map((entry, index) => (
                    <div
                      key={entry.user_id}
                      className={cn(
                        'flex items-center justify-between p-4 rounded-2xl transition-all',
                        index === 0 ? 'bg-gold/10 border border-gold/20' : 'bg-white/5 border border-white/5'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm',
                            index === 0
                              ? 'bg-gold text-app-bg'
                              : index === 1
                                ? 'bg-slate-300 text-app-bg'
                                : index === 2
                                  ? 'bg-amber-600 text-app-bg'
                                  : 'bg-white/10 text-app-text/40'
                          )}
                        >
                          {index + 1}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-app-accent/20 flex items-center justify-center text-app-accent font-bold overflow-hidden">
                            {entry.avatar ? <img src={entry.avatar} alt="" className="w-full h-full object-cover" /> : entry.name?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-app-text">{entry.name}</p>
                            <p className="text-[10px] text-app-muted uppercase tracking-widest">Rank #{entry.rank}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-app-accent">{entry.total_score}</p>
                        <p className="text-[10px] text-app-muted uppercase font-bold">{t.points}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 opacity-20">
                    <Star className="w-12 h-12 mx-auto mb-4" />
                    <p>{t.noScores}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
