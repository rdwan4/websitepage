export const getYouTubeVideoId = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtu.be') {
      return parsed.pathname.split('/').filter(Boolean)[0] || null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (parsed.pathname === '/watch') {
        return parsed.searchParams.get('v');
      }

      const parts = parsed.pathname.split('/').filter(Boolean);
      const marker = parts[0];
      if (marker === 'embed' || marker === 'shorts' || marker === 'live') {
        return parts[1] || null;
      }
    }
  } catch {
    return null;
  }

  return null;
};

export const getEmbeddableVideoUrl = (url: string): string => {
  const youtubeId = getYouTubeVideoId(url);
  if (youtubeId) {
    return `https://www.youtube.com/embed/${youtubeId}`;
  }

  if (url.includes('vimeo.com/')) {
    const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
    return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
  }

  return url;
};

export const getVideoThumbnailUrl = (url?: string | null): string | null => {
  if (!url) return null;

  const youtubeId = getYouTubeVideoId(url);
  if (youtubeId) {
    return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  }

  return null;
};

export const getPostPreviewImage = (post: { image_url?: string | null; media_url?: string | null; post_type?: string | null }) => {
  if (post.image_url) return post.image_url;
  if (post.post_type === 'video') return getVideoThumbnailUrl(post.media_url);
  return null;
};
