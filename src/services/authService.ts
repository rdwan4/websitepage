import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient.js';
import { Profile } from '../types';
import { normalizeProfile } from './profileUtils';
import { isMissingTableError, toSetupMessage } from './dbErrorUtils';

const getAuthDisplayName = (user: User, fallback?: string) =>
  fallback ||
  user.user_metadata?.display_name ||
  user.user_metadata?.full_name ||
  user.user_metadata?.name ||
  user.email?.split('@')[0] ||
  'User';

const getAuthAvatarUrl = (user: User) =>
  user.user_metadata?.avatar_url ||
  user.user_metadata?.picture ||
  null;

const getAuthFullName = (user: User, fallback?: string) =>
  fallback ||
  user.user_metadata?.full_name ||
  user.user_metadata?.display_name ||
  user.user_metadata?.name ||
  null;

const getConfiguredAdminEmails = () =>
  String(import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

const resolveRole = (user: User, existingRole?: Profile['role']) => {
  if (existingRole === 'admin') {
    return 'admin';
  }

  const metadataRole =
    user.app_metadata?.role ||
    user.user_metadata?.role ||
    user.user_metadata?.user_role;

  if (metadataRole === 'admin') {
    return 'admin';
  }

  const email = user.email?.trim().toLowerCase();
  if (email && getConfiguredAdminEmails().includes(email)) {
    return 'admin';
  }

  return 'user';
};

const getFileExtension = (fileName: string) => fileName.split('.').pop() || 'bin';

const buildFallbackProfile = (user: User, displayNameOverride?: string): Profile => {
  const displayName = getAuthDisplayName(user, displayNameOverride);
  const avatarUrl = getAuthAvatarUrl(user);
  const now = new Date().toISOString();

  return {
    id: user.id,
    email: user.email || '',
    display_name: displayName,
    full_name: getAuthFullName(user, displayNameOverride),
    avatar_url: avatarUrl,
    score: 0,
    role: 'user',
    created_at: now,
    updated_at: now,
    name: displayName,
    avatar: avatarUrl,
  };
};

export const authService = {
  async signUp(email: string, password: string, displayName: string) {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = displayName.trim();

    const result = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          display_name: trimmedName,
          full_name: trimmedName,
          name: trimmedName,
        },
      },
    });

    if (result.error) {
      throw result.error;
    }

    if (result.data.user) {
      await this.ensureProfile(result.data.user, trimmedName);
    }

    return result;
  },

  async signIn(email: string, password: string) {
    const result = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (result.error) {
      throw result.error;
    }

    if (result.data.user) {
      await this.ensureProfile(result.data.user);
    }

    return result;
  },

  async signOut() {
    const result = await supabase.auth.signOut();
    if (result.error) {
      throw result.error;
    }
  },

  async signInWithGoogle() {
    const result = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (result.error) {
      throw result.error;
    }
  },

  async getSession(): Promise<Session | null> {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    return session;
  },

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) {
      if (isMissingTableError(error, 'profiles')) {
        return null;
      }
      throw error;
    }
    return normalizeProfile(data);
  },

  async ensureProfile(user: User, displayNameOverride?: string): Promise<Profile> {
    const displayName = getAuthDisplayName(user, displayNameOverride);
    const fullName = getAuthFullName(user, displayNameOverride);
    const avatarUrl = getAuthAvatarUrl(user);

    // First, try to fetch the existing profile to preserve the role
    const existingProfile = await this.getProfile(user.id);
    const resolvedRole = resolveRole(user, existingProfile?.role);

    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: user.email,
          display_name: displayName,
          full_name: fullName,
          avatar_url: avatarUrl,
          role: resolvedRole,
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single();

    if (error) {
      if (isMissingTableError(error, 'profiles')) {
        console.warn(toSetupMessage('profiles'));
        return buildFallbackProfile(user, displayNameOverride);
      }
      throw error;
    }

    const profile = normalizeProfile(data);
    if (!profile) {
      throw new Error('Failed to load profile.');
    }

    return profile;
  },

  async updateProfile(userId: string, updates: Pick<Profile, 'display_name' | 'avatar_url'>) {
    const payload: Record<string, string | null> = {
      display_name: updates.display_name,
      full_name: updates.display_name,
      avatar_url: updates.avatar_url ?? null,
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      if (isMissingTableError(error, 'profiles')) {
        throw new Error(toSetupMessage('profiles'));
      }
      throw error;
    }

    const profile = normalizeProfile(data);
    if (!profile) {
      throw new Error('Failed to update profile.');
    }

    return profile;
  },

  async uploadAvatar(userId: string, file: File) {
    const currentProfile = await this.getProfile(userId);
    if (!currentProfile) {
      throw new Error('Profile not found.');
    }

    const fileExt = getFileExtension(file.name);
    const filePath = `avatars/${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from('media').getPublicUrl(filePath);
    return this.updateProfile(userId, {
      display_name: currentProfile.display_name,
      avatar_url: data.publicUrl,
    });
  },

  async getAllProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    return data || [];
  },

  async setUserRole(userId: string, role: 'admin' | 'user'): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },
};