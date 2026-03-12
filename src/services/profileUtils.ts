import { LeaderboardEntry, Profile, ProfileRow } from '../types';

export const normalizeProfile = (row: Partial<ProfileRow> | null | undefined): Profile | null => {
  if (!row?.id || !row.email) {
    return null;
  }

  const displayName = row.display_name || row.full_name || 'User';
  const avatarUrl = row.avatar_url ?? null;

  return {
    id: row.id,
    email: row.email,
    display_name: displayName,
    full_name: row.full_name ?? displayName,
    avatar_url: avatarUrl,
    score: row.score ?? 0,
    role: row.role === 'admin' ? 'admin' : 'user',
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || row.created_at || new Date().toISOString(),
    name: displayName,
    avatar: avatarUrl,
  };
};

export const normalizeProfiles = (rows: Array<Partial<ProfileRow>> | null | undefined): Profile[] =>
  (rows || [])
    .map((row) => normalizeProfile(row))
    .filter((profile): profile is Profile => Boolean(profile));

export const normalizeLeaderboardEntry = (row: any): LeaderboardEntry => {
  const displayName = row.display_name || row.name || 'User';
  const avatarUrl = row.avatar_url ?? row.avatar ?? null;

  return {
    user_id: row.user_id,
    display_name: displayName,
    avatar_url: avatarUrl,
    name: displayName,
    avatar: avatarUrl,
    total_score: row.total_score ?? 0,
    rank: row.rank ?? 0,
  };
};
