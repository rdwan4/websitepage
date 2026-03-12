import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { postService } from '../services/postService';
import { Post } from '../types';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  lang: 'en' | 'ar';
  onCommentAdded: () => void;
}

export const CommentModal: React.FC<CommentModalProps> = ({ isOpen, onClose, post, lang, onCommentAdded }) => {
  const { profile } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!profile || !post) return;

    setIsSubmitting(true);
    try {
      await postService.addComment({
        post_id: post.id,
        user_id: profile.id,
        content,
      });
      setContent('');
      onCommentAdded();
      onClose();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="bg-app-card border border-white/10 rounded-2xl p-8 w-full max-w-lg mx-4 relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-app-muted hover:text-app-text">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-app-text mb-4">{lang === 'en' ? 'Add a comment' : 'أضف تعليقًا'}</h2>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={lang === 'en' ? 'Write your comment...' : 'اكتب تعليقك...'}
          className="bg-white/5 border-white/10 rounded-lg p-4 text-app-text mb-4 h-32 w-full"
        />
        <button onClick={handleSubmit} disabled={isSubmitting || !content.trim()} className="bg-app-accent text-app-bg rounded-lg px-6 py-3 font-bold transition-all hover:scale-105 disabled:opacity-50">
          {isSubmitting ? (lang === 'en' ? 'Submitting...' : 'جارٍ الإرسال...') : (lang === 'en' ? 'Submit Comment' : 'إرسال التعليق')}
        </button>
      </motion.div>
    </div>
  );
};