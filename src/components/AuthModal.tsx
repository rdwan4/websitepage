import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Mail,
  Lock,
  User,
  Chrome,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'ar';
  onSuccess: () => void;
}

const copy = {
  en: {
    welcomeBack: 'Welcome back',
    createAccount: 'Create your account',
    loginSubtitle: 'Sign in to restore your saved profile, reminders, and activity.',
    signupSubtitle: 'Register with Supabase auth so your session and profile persist on every visit.',
    displayName: 'Display name',
    email: 'Email address',
    password: 'Password',
    confirmPassword: 'Confirm password',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    orContinue: 'Or continue with',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    passwordMismatch: 'Passwords do not match.',
    signupNeedsConfirm: 'Account created. Check your email before signing in.',
    authFailed: 'Authentication failed.',
    googleFailed: 'Google sign-in failed.',
    accountExists: 'An account with this email already exists. Sign in instead.',
  },
  ar: {
    welcomeBack: 'مرحبا بعودتك',
    createAccount: 'أنشئ حسابك',
    loginSubtitle: 'سجّل الدخول لاستعادة ملفك الشخصي وتذكيراتك ونشاطك.',
    signupSubtitle: 'أنشئ حسابا عبر Supabase حتى يبقى تسجيل دخولك وبياناتك محفوظين.',
    displayName: 'الاسم الظاهر',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    signIn: 'تسجيل الدخول',
    signUp: 'إنشاء حساب',
    orContinue: 'أو تابع عبر',
    dontHaveAccount: 'ليس لديك حساب؟',
    alreadyHaveAccount: 'لديك حساب بالفعل؟',
    passwordMismatch: 'كلمتا المرور غير متطابقتين.',
    signupNeedsConfirm: 'تم إنشاء الحساب. تحقق من بريدك الإلكتروني قبل تسجيل الدخول.',
    authFailed: 'تعذر إتمام المصادقة.',
    googleFailed: 'تعذر تسجيل الدخول عبر Google.',
    accountExists: 'هذا البريد مسجل بالفعل. سجّل الدخول بدلا من ذلك.',
  },
};

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, lang, onSuccess }) => {
  const navigate = useNavigate();
  const { login, register, loginWithGoogle, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const t = copy[lang];
  const isArabic = lang === 'ar';

  useEffect(() => {
    if (!isOpen) {
      setError('');
      setMessage('');
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
    }
  }, [isOpen]);

  const resetFeedback = () => {
    setError('');
    setMessage('');
  };

  const finalizeSuccess = () => {
    onSuccess();
    onClose();
    navigate('/');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    resetFeedback();
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        finalizeSuccess();
        return;
      }

      if (password !== confirmPassword) {
        throw new Error(t.passwordMismatch);
      }

      const result = await register(email, password, displayName);

      if (result.requiresEmailConfirmation) {
        setMessage(t.signupNeedsConfirm);
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        return;
      }

      finalizeSuccess();
    } catch (err: any) {
      const authMessage = err?.message || t.authFailed;
      if (authMessage.toLowerCase().includes('already exists') || authMessage.toLowerCase().includes('already registered')) {
        setMode('login');
        setMessage(t.accountExists);
        setError('');
      } else {
        setError(authMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    resetFeedback();
    setGoogleLoading(true);

    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err?.message || t.googleFailed);
      setGoogleLoading(false);
    }
  };

  const busy = submitting || authLoading;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-app-bg/80 backdrop-blur-xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              'relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.02] shadow-2xl',
              isArabic && 'text-right'
            )}
          >
            <div className="p-8 sm:p-12">
              <button
                onClick={onClose}
                className={cn(
                  'absolute top-6 p-2 text-app-text/40 transition-all hover:rounded-full hover:bg-white/5 hover:text-app-text',
                  isArabic ? 'left-6' : 'right-6'
                )}
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-10 text-center">
                <h2 className="mb-2 text-3xl font-bold tracking-tight text-app-text">
                  {mode === 'login' ? t.welcomeBack : t.createAccount}
                </h2>
                <p className="text-sm text-app-text/60">
                  {mode === 'login' ? t.loginSubtitle : t.signupSubtitle}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <Field
                    icon={<User className="h-5 w-5" />}
                    isArabic={isArabic}
                    value={displayName}
                    onChange={setDisplayName}
                    placeholder={t.displayName}
                    type="text"
                  />
                )}

                <Field
                  icon={<Mail className="h-5 w-5" />}
                  isArabic={isArabic}
                  value={email}
                  onChange={setEmail}
                  placeholder={t.email}
                  type="email"
                />

                <Field
                  icon={<Lock className="h-5 w-5" />}
                  isArabic={isArabic}
                  value={password}
                  onChange={setPassword}
                  placeholder={t.password}
                  type={showPassword ? 'text' : 'password'}
                  action={
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="text-app-text/30 transition-colors hover:text-app-text"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  }
                />

                {mode === 'signup' && (
                  <Field
                    icon={<Lock className="h-5 w-5" />}
                    isArabic={isArabic}
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder={t.confirmPassword}
                    type={showPassword ? 'text' : 'password'}
                  />
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-app-accent py-4 text-sm font-bold uppercase tracking-widest text-app-bg shadow-xl shadow-app-accent/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {busy ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      {mode === 'login' ? t.signIn : t.signUp}
                      <ArrowRight className={cn('h-4 w-4', isArabic && 'rotate-180')} />
                    </>
                  )}
                </button>

                {(error || message) && (
                  <div
                    className={cn(
                      'rounded-2xl border p-4 text-center text-xs',
                      error
                        ? 'border-red-500/20 bg-red-500/10 text-red-400'
                        : 'border-app-accent/20 bg-app-accent/10 text-app-accent'
                    )}
                  >
                    {error || message}
                  </div>
                )}
              </form>

              <div className="relative my-10">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest">
                  <span className="bg-app-bg px-4 text-app-text/30">{t.orContinue}</span>
                </div>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={googleLoading || busy}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-4 text-sm font-medium text-app-text transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {googleLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-app-accent" />
                ) : (
                  <>
                    <Chrome className="h-5 w-5 text-blue-400" />
                    Google
                  </>
                )}
              </button>

              <p className="mt-10 text-center text-sm text-app-text/40">
                {mode === 'login' ? t.dontHaveAccount : t.alreadyHaveAccount}{' '}
                <button
                  onClick={() => {
                    setMode(mode === 'login' ? 'signup' : 'login');
                    resetFeedback();
                    setPassword('');
                    setConfirmPassword('');
                  }}
                  className="font-bold text-app-accent hover:underline"
                >
                  {mode === 'login' ? t.signUp : t.signIn}
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const Field = ({
  icon,
  isArabic,
  value,
  onChange,
  placeholder,
  type,
  action,
}: {
  icon: React.ReactNode;
  isArabic: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type: string;
  action?: React.ReactNode;
}) => (
  <div className="relative">
    <div
      className={cn(
        'absolute top-1/2 -translate-y-1/2 text-app-text/30',
        isArabic ? 'right-4' : 'left-4'
      )}
    >
      {icon}
    </div>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        'w-full rounded-2xl border border-white/10 bg-white/5 py-4 text-sm text-app-text transition-all focus:border-app-accent/50 focus:outline-none',
        isArabic ? 'pr-12 pl-12 text-right' : 'pl-12 pr-12'
      )}
      required
    />
    {action && (
      <div
        className={cn(
          'absolute top-1/2 -translate-y-1/2',
          isArabic ? 'left-4' : 'right-4'
        )}
      >
        {action}
      </div>
    )}
  </div>
);
