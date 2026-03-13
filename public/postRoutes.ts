import { Post } from '../types';

export type PublicPostSection = 'articles' | 'academy' | 'library' | 'community';

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export const getPostSection = (post: Pick<Post, 'category' | 'post_type'>): PublicPostSection => {
  const slug = (post.category?.slug || post.category?.name || post.category?.name_ar || '').trim().toLowerCase();

  if (slug === 'articles' || slug === 'article' || slug === 'مقالات' || slug === 'المقالات') return 'articles';
  if (slug === 'academy' || slug === 'الأكاديمية') return 'academy';
  if (slug === 'library' || slug === 'المكتبة') return 'library';
  if (slug === 'community' || slug === 'المجتمع') return 'community';

  // Fallbacks keep non-standard category names routable.
  if (post.post_type === 'video' || post.post_type === 'audio') return 'academy';
  if (post.post_type === 'pdf') return 'library';
  return 'articles';
};

export const buildPostPath = (post: Pick<Post, 'id' | 'title' | 'category' | 'post_type'>) => {
  const section = getPostSection(post);
  const slug = slugify(post.title) || post.id;
  return `/${section}/${post.id}/${slug}`;
};
