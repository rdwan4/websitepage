export interface Category {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  icon?: string | null;
  created_at?: string;
}

export type PostType = 'video' | 'image' | 'article' | 'blog' | 'pdf' | 'audio' | 'blogger';
export type UserRole = 'admin' | 'user';
export type ContentCategory = 'dua' | 'hadith' | 'inspiration';
export type GuidanceCategory = 'reflection' | 'story' | 'gallery' | 'daily-wisdom';
export type SourceType = 'quran' | 'hadith' | 'athar' | 'scholar';

export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  image_url: string;
  category_id: string;
  author_id: string;
  is_featured: boolean;
  is_trending: boolean;
  views_count: number;
  likes_count: number;
  is_approved: boolean;
  created_at: string;
  category?: Category;
  post_type: PostType;
  media_url?: string;
  attachments?: string[];
  series_slug?: string | null;
  series_title?: string | null;
  lesson_order?: number;
  parent_post_id?: string | null;
  author_name?: string;
  comments_count?: number;
}

export interface PostProgress {
  user_id: string;
  post_id: string;
  last_position_seconds: number;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export type ReminderType = 'prayer' | 'quran' | 'dua' | 'study' | 'general';
export type ReminderDayKey =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description: string;
  time: string;
  type: ReminderType;
  days: string[];
  enabled: boolean;
  created_at: string;
}

export type BroadcastNotificationType = 'dua' | 'hadith' | 'general';

export interface BroadcastNotification {
  id: string;
  type: BroadcastNotificationType;
  title_en: string;
  title_ar: string | null;
  body_en: string;
  body_ar: string | null;
  send_at: string;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
}

export interface UserNotificationPreference {
  user_id: string;
  allow_broadcast: boolean;
  reminder_mode: 'auto' | 'manual';
  manual_time: string | null;
  preferred_language: 'app' | 'en' | 'ar';
  created_at: string;
  updated_at: string;
}

export interface BroadcastDeliveryMetric {
  notification_id: string;
  delivered_count: number;
  pending_count: number;
  target_count: number;
}

export interface BroadcastAdminMetrics {
  total_users: number;
  opted_in_users: number;
  opted_out_users: number;
  delivered_total: number;
  pending_total: number;
  by_notification: BroadcastDeliveryMetric[];
}

export interface ProfileRow {
  id: string;
  email: string;
  display_name: string;
  full_name?: string | null;
  avatar_url: string | null;
  score: number;
  role: UserRole;
  fcm_token?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile extends ProfileRow {
  name: string;
  avatar: string | null;
}

export interface Activity {
  id: string;
  user_id: string;
  type: 'answered_question' | 'read_book' | 'watched_video' | 'post_created' | 'comment_added';
  content: string;
  score_earned: number;
  created_at: string;
  user?: Profile;
  comments?: Comment[];
}

export type CommentStatus = 'pending' | 'approved' | 'rejected';

export interface Comment {
  id: string;
  post_id?: string;
  activity_id?: string;
  user_id: string;
  content: string;
  status: CommentStatus;
  created_at: string;
  user?: Profile;
  post?: {
    title?: string;
  };
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface QuizScore {
  id: string;
  user_id: string;
  score: number;
  total_questions: number;
  category: string;
  created_at: string;
  user?: Profile;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  name: string;
  avatar: string | null;
  total_score: number;
  rank: number;
}

export interface GuidanceItem {
  id: string;
  slug: string;
  title_en: string;
  title_ar: string;
  summary_en: string;
  summary_ar: string;
  body_en: string;
  body_ar: string;
  image_url: string | null;
  accent_label_en: string | null;
  accent_label_ar: string | null;
  source_type: SourceType | null;
  source_reference: string | null;
  category: GuidanceCategory;
  position: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailyCollectionEntry {
  id: string;
  category: ContentCategory;
  title: string;
  title_ar: string | null;
  arabic_text: string | null;
  english_text: string;
  transliteration: string | null;
  source_type: SourceType;
  source_reference: string;
  authenticity_notes: string | null;
  image_url: string | null;
  tags: string[] | null;
  is_published: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailyContentSet {
  category: ContentCategory;
  items: DailyCollectionEntry[];
  totalAvailable: number;
  hasMinimumDataset: boolean;
}

export interface QuizQuestionOption {
  id: string;
  label_en: string;
  label_ar: string | null;
  sort_order: number;
}

export interface QuizQuestion {
  id: string;
  question_en: string;
  question_ar: string | null;
  explanation_en: string | null;
  explanation_ar: string | null;
  source_type: SourceType;
  source_reference: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  options: QuizQuestionOption[];
  correct_option_id: string;
  is_published: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAnswer {
  id: string;
  user_id: string;
  question_id: string;
  answer_date: string;
  selected_option_id: string;
  is_correct: boolean;
  created_at: string;
}

export interface DailyQuizBundle {
  dateKey: string;
  questions: QuizQuestion[];
  totalAvailable: number;
  hasMinimumDataset: boolean;
  answers: UserAnswer[];
}

export interface QuranSurahMetadata {
  id: number;
  name_ar: string;
  name_en: string;
  transliteration_en: string;
  translated_name_en: string;
  verses_count: number;
  revelation_place: 'makkah' | 'madinah';
  start_page: number;
  end_page: number;
}

export interface QuranVerse {
  numberInSurah: number;
  page: number;
  text: string;
}

export interface QuranSurahText {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
  ayahs: QuranVerse[];
}

export interface QuranPageRow {
  page_number: number;
  image_url: string;
}
