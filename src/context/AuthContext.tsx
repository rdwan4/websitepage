import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient.js';
import { Profile } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, pass: string) => Promise<Profile | null>;
  register: (email: string, pass: string, displayName: string) => Promise<{ profile: Profile | null; requiresEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
  updateProfile: (updates: Pick<Profile, 'display_name' | 'avatar_url'>) => Promise<Profile>;
  uploadAvatar: (file: File) => Promise<Profile>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const syncSession = async (nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (!nextSession?.user) {
      setProfile(null);
      setLoading(false);
      return null;
    }

    try {
      const ensuredProfile = await authService.ensureProfile(nextSession.user);
      setProfile(ensuredProfile);
      return ensuredProfile;
    } catch (error) {
      console.error('Failed to sync profile with session:', error);
      setProfile(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      setLoading(true);

      try {
        const currentSession = await authService.getSession();
        if (!mounted) return;
        await syncSession(currentSession);
      } catch (error) {
        console.error('Failed to restore auth session:', error);
        if (mounted) {
          setProfile(null);
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      } finally {
        if (mounted) {
          setInitialized(true);
        }
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setLoading(true);
      void syncSession(nextSession).catch((error) => {
        console.error('Auth state sync error:', error);
        setLoading(false);
      });
    });

    void initialize();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const result = await authService.signIn(email, pass);
      const ensuredProfile = result.data.user ? await authService.ensureProfile(result.data.user) : null;
      setProfile(ensuredProfile);
      setSession(result.data.session ?? null);
      setUser(result.data.user ?? null);
      return ensuredProfile;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, pass: string, displayName: string) => {
    setLoading(true);
    try {
      const result = await authService.signUp(email, pass, displayName);
      const ensuredProfile = result.data.user ? await authService.ensureProfile(result.data.user, displayName) : null;
      setProfile(ensuredProfile);
      setSession(result.data.session ?? null);
      setUser(result.data.user ?? null);
      return {
        profile: ensuredProfile,
        requiresEmailConfirmation: !result.data.session,
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setProfile(null);
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    await authService.signInWithGoogle();
  };

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return null;
    }

    const refreshed = await authService.ensureProfile(user);
    setProfile(refreshed);
    return refreshed;
  };

  const updateProfile = async (updates: Pick<Profile, 'display_name' | 'avatar_url'>) => {
    if (!user) throw new Error('Not authenticated.');
    const updatedProfile = await authService.updateProfile(user.id, updates);
    setProfile(updatedProfile);
    return updatedProfile;
  };

  const uploadAvatar = async (file: File) => {
    if (!user) throw new Error('Not authenticated.');
    const updatedProfile = await authService.uploadAvatar(user.id, file);
    setProfile(updatedProfile);
    return updatedProfile;
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        initialized,
        login,
        register,
        logout,
        loginWithGoogle,
        refreshProfile,
        updateProfile,
        uploadAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};