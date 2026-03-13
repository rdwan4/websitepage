import { supabase } from '../supabaseClient.js';
import {
  ContentCategory,
  DailyCollectionEntry,
  DailyContentSet,
  DailyQuizBundle,
  GuidanceItem,
  QuizQuestion,
  QuizQuestionOption,
  UserAnswer,
} from '../types';
import { isMissingTableError, toSetupMessage } from './dbErrorUtils';

const DAILY_CONTENT_MINIMUM = 50;
const DAILY_QUESTION_MINIMUM = 150;
const DAILY_SLICE = 5;

const getUtcDateKey = (date = new Date()) => date.toISOString().slice(0, 10);

const hashString = (value: string) =>
  value.split('').reduce((total, char) => total * 31 + char.charCodeAt(0), 7);

const rotateDaily = <T extends { id: string }>(items: T[], dateKey: string, count = DAILY_SLICE) => {
  if (items.length === 0) {
    return [];
  }

  const ordered = [...items].sort((a, b) => a.id.localeCompare(b.id));
  const total = ordered.length;
  const offset = Math.abs(hashString(dateKey)) % total;
  const slice: T[] = [];

  for (let index = 0; index < Math.min(count, total); index += 1) {
    slice.push(ordered[(offset + index) % total]);
  }

  return slice;
};

const buildQuizSlice = <T extends { id: string }>(items: T[], answeredIds: string[], dateKey: string, count = DAILY_SLICE) => {
  if (items.length === 0) return [];

  const answeredSet = new Set(answeredIds);
  const unanswered = items.filter((item) => !answeredSet.has(item.id));
  const primary = rotateDaily(unanswered, `${dateKey}:unanswered`, count);

  if (primary.length >= count || items.length <= count) {
    return primary.length ? primary : rotateDaily(items, `${dateKey}:fallback`, count);
  }

  const used = new Set(primary.map((item) => item.id));
  const fallback = rotateDaily(items, `${dateKey}:fallback`, items.length)
    .filter((item) => !used.has(item.id))
    .slice(0, count - primary.length);

  return [...primary, ...fallback];
};

const normalizeGuidanceItem = (row: any): GuidanceItem => ({
  id: row.id,
  slug: row.slug,
  title_en: row.title_en,
  title_ar: row.title_ar,
  summary_en: row.summary_en,
  summary_ar: row.summary_ar,
  body_en: row.body_en,
  body_ar: row.body_ar,
  image_url: row.image_url ?? null,
  accent_label_en: row.accent_label_en ?? null,
  accent_label_ar: row.accent_label_ar ?? null,
  source_type: row.source_type ?? null,
  source_reference: row.source_reference ?? null,
  category: row.category,
  position: row.position ?? 0,
  is_published: Boolean(row.is_published),
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const normalizeDailyEntry = (row: any): DailyCollectionEntry => ({
  id: row.id,
  category: row.category,
  title: row.title,
  title_ar: row.title_ar ?? null,
  arabic_text: row.arabic_text ?? null,
  english_text: row.english_text,
  transliteration: row.transliteration ?? null,
  source_type: row.source_type,
  source_reference: row.source_reference,
  authenticity_notes: row.authenticity_notes ?? null,
  image_url: row.image_url ?? null,
  tags: row.tags ?? null,
  is_published: Boolean(row.is_published),
  is_verified: Boolean(row.is_verified),
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const normalizeQuestion = (row: any): QuizQuestion => ({
  id: row.id,
  question_en: row.question_en,
  question_ar: row.question_ar ?? null,
  explanation_en: row.explanation_en ?? null,
  explanation_ar: row.explanation_ar ?? null,
  source_type: row.source_type,
  source_reference: row.source_reference,
  difficulty: row.difficulty,
  category: row.category,
  options: (row.options || [])
    .map(
      (option: any): QuizQuestionOption => ({
        id: option.id,
        label_en: option.label_en,
        label_ar: option.label_ar ?? null,
        sort_order: option.sort_order ?? 0,
      })
    )
    .sort((a: QuizQuestionOption, b: QuizQuestionOption) => a.sort_order - b.sort_order),
  correct_option_id: row.correct_option_id,
  is_published: Boolean(row.is_published),
  is_verified: Boolean(row.is_verified),
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const loadQuestionOptions = async (questionIds: string[]) => {
  if (!questionIds.length) {
    return new Map<string, QuizQuestionOption[]>();
  }

  const { data, error } = await supabase
    .from('question_options')
    .select('*')
    .in('question_id', questionIds)
    .order('sort_order', { ascending: true });

  if (error) {
    if (isMissingTableError(error, 'question_options')) {
      console.warn(toSetupMessage('question_options'));
      return new Map<string, QuizQuestionOption[]>();
    }
    throw error;
  }

  const optionMap = new Map<string, QuizQuestionOption[]>();
  (data || []).forEach((option: any) => {
    const questionId = option.question_id;
    if (!questionId) return;

    const normalizedOption: QuizQuestionOption = {
      id: option.id,
      label_en: option.label_en,
      label_ar: option.label_ar ?? null,
      sort_order: option.sort_order ?? 0,
    };

    const existing = optionMap.get(questionId) || [];
    existing.push(normalizedOption);
    optionMap.set(questionId, existing);
  });

  optionMap.forEach((options, questionId) => {
    optionMap.set(
      questionId,
      options.sort((a, b) => a.sort_order - b.sort_order)
    );
  });

  return optionMap;
};

const hydrateQuestions = async (rows: any[]) => {
  const normalized = (rows || []).map(normalizeQuestion);
  const optionsByQuestion = await loadQuestionOptions(normalized.map((question) => question.id));

  return normalized.map((question) => ({
    ...question,
    options: optionsByQuestion.get(question.id) || [],
  }));
};

const sanitizeUuid = (value?: string | null) => {
  const trimmed = (value || '').trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const contentService = {
  getDateKey: getUtcDateKey,

  async getGuidanceItems(publishedOnly = true) {
    let query = supabase
      .from('guidance_items')
      .select('*')
      .order('position', { ascending: true })
      .order('created_at', { ascending: false });

    if (publishedOnly) {
      query = query.eq('is_published', true);
    }

    const { data, error } = await query;

    if (error) {
      if (isMissingTableError(error, 'guidance_items')) {
        console.warn(toSetupMessage('guidance_items'));
        return [];
      }
      throw error;
    }
    return (data || []).map(normalizeGuidanceItem);
  },

  async saveGuidanceItem(payload: Partial<GuidanceItem>) {
    const prepared: Record<string, any> = { ...payload };
    prepared.id = sanitizeUuid(prepared.id);
    if (!prepared.id) {
      delete prepared.id;
    }

    if (typeof prepared.slug === 'string') {
      prepared.slug = prepared.slug.trim();
    }

    if (typeof prepared.source_reference === 'string') {
      prepared.source_reference = prepared.source_reference.trim() || null;
    }

    const { data, error } = await supabase
      .from('guidance_items')
      .upsert(prepared, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) {
      if (isMissingTableError(error, 'guidance_items')) {
        throw new Error(toSetupMessage('guidance_items'));
      }
      throw error;
    }
    return normalizeGuidanceItem(data);
  },

  async deleteGuidanceItem(id: string) {
    const { error } = await supabase.from('guidance_items').delete().eq('id', id);
    if (error) {
      if (isMissingTableError(error, 'guidance_items')) {
        throw new Error(toSetupMessage('guidance_items'));
      }
      throw error;
    }
  },

  async getDailyCollection(category: ContentCategory, dateKey = getUtcDateKey()): Promise<DailyContentSet> {
    const { data: verifiedData, error } = await supabase
      .from('daily_content')
      .select('*')
      .eq('category', category)
      .eq('is_published', true)
      .eq('is_verified', true);

    if (error) {
      if (isMissingTableError(error, 'daily_content')) {
        console.warn(toSetupMessage('daily_content'));
        return {
          category,
          items: [],
          totalAvailable: 0,
          hasMinimumDataset: false,
        };
      }
      throw error;
    }

    let allItems = (verifiedData || []).map(normalizeDailyEntry);
    if (allItems.length < DAILY_SLICE) {
      const { data: publishedData, error: publishedError } = await supabase
        .from('daily_content')
        .select('*')
        .eq('category', category)
        .eq('is_published', true);

      if (publishedError) {
        if (isMissingTableError(publishedError, 'daily_content')) {
          console.warn(toSetupMessage('daily_content'));
          return {
            category,
            items: [],
            totalAvailable: 0,
            hasMinimumDataset: false,
          };
        }
        throw publishedError;
      }

      allItems = (publishedData || []).map(normalizeDailyEntry);
    }

    return {
      category,
      items: rotateDaily(allItems, `${category}:${dateKey}`),
      totalAvailable: allItems.length,
      hasMinimumDataset: allItems.length >= DAILY_CONTENT_MINIMUM,
    };
  },

  async listDailyContent(category?: ContentCategory) {
    let query = supabase.from('daily_content').select('*').order('created_at', { ascending: false });
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (error) {
      if (isMissingTableError(error, 'daily_content')) {
        console.warn(toSetupMessage('daily_content'));
        return [];
      }
      throw error;
    }
    return (data || []).map(normalizeDailyEntry);
  },

  async saveDailyContent(payload: Partial<DailyCollectionEntry>) {
    const prepared = { ...payload } as any;
    prepared.id = sanitizeUuid(prepared.id);
    if (!prepared.id) {
      delete prepared.id;
    }

    if (prepared.category === ('' as any)) {

      prepared.category = null;
    }
    const { data, error } = await supabase
      .from('daily_content')
      .upsert(prepared, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) {
      if (isMissingTableError(error, 'daily_content')) {
        throw new Error(toSetupMessage('daily_content'));
      }
      throw error;
    }
    return normalizeDailyEntry(data);
  },

  async deleteDailyContent(id: string) {
    const { error } = await supabase.from('daily_content').delete().eq('id', id);
    if (error) {
      if (isMissingTableError(error, 'daily_content')) {
        throw new Error(toSetupMessage('daily_content'));
      }
      throw error;
    }
  },

  async listQuestions() {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (isMissingTableError(error, 'questions')) {
        console.warn(toSetupMessage('questions'));
        return [];
      }
      throw error;
    }
    return hydrateQuestions(data || []);
  },

  async getDailyQuiz(userId?: string, dateKey = getUtcDateKey()): Promise<DailyQuizBundle> {
    const { data: verifiedQuestions, error } = await supabase
      .from('questions')
      .select('*')
      .eq('is_published', true)
      .eq('is_verified', true);

    if (error) {
      if (isMissingTableError(error, 'questions')) {
        console.warn(toSetupMessage('questions'));
        return {
          dateKey,
          questions: [],
          totalAvailable: 0,
          hasMinimumDataset: false,
          answers: [],
        };
      }
      throw error;
    }

    let allQuestions = await hydrateQuestions(verifiedQuestions || []);
    if (allQuestions.length < DAILY_SLICE) {
      const { data: publishedQuestions, error: publishedError } = await supabase
        .from('questions')
        .select('*')
        .eq('is_published', true);

      if (publishedError) {
        if (isMissingTableError(publishedError, 'questions')) {
          console.warn(toSetupMessage('questions'));
          return {
            dateKey,
            questions: [],
            totalAvailable: 0,
            hasMinimumDataset: false,
            answers: [],
          };
        }
        throw publishedError;
      }

      allQuestions = await hydrateQuestions(publishedQuestions || []);
    }
    let answers: UserAnswer[] = [];
    if (userId) {
      const { data: answerData, error: answerError } = await supabase
        .from('user_answers')
        .select('*')
        .eq('user_id', userId)
        .eq('answer_date', dateKey);

      if (answerError) {
        if (isMissingTableError(answerError, 'user_answers')) {
          console.warn(toSetupMessage('user_answers'));
          answers = [];
        } else {
          throw answerError;
        }
      } else {
        answers = answerData || [];
      }
    }

    const questions: QuizQuestion[] = buildQuizSlice(
      allQuestions,
      answers.map((answer) => answer.question_id),
      `quiz:${dateKey}`,
      DAILY_SLICE
    );

    return {
      dateKey,
      questions,
      totalAvailable: allQuestions.length,
      hasMinimumDataset: allQuestions.length >= DAILY_QUESTION_MINIMUM,
      answers,
    };
  },

  async saveQuestion(payload: Partial<QuizQuestion> & { options: Array<Partial<QuizQuestionOption>> }) {
    const { options, ...questionPayload } = payload;
    const preparedOptions = (options || [])
      .map((option, index) => ({
        id: sanitizeUuid(option.id),
        label_en: (option.label_en || '').trim(),
        label_ar: (option.label_ar || '').trim() || null,
        sort_order: option.sort_order ?? index,
      }))
      .filter((option) => option.label_en.length > 0);

    if (preparedOptions.length < 2) {
      throw new Error('Add at least two options before saving the question.');
    }

    const questionEn = (questionPayload.question_en || '').trim();
    const sourceReference = (questionPayload.source_reference || '').trim();
    const questionCategory = (questionPayload.category || '').trim() || 'daily-quiz';

    if (!questionEn) {
      throw new Error('Question text is required.');
    }

    if (!sourceReference) {
      throw new Error('Source reference is required.');
    }

    const preparedQuestionPayload: Record<string, any> = {
      ...questionPayload,
      id: sanitizeUuid(questionPayload.id),
      question_en: questionEn,
      question_ar: (questionPayload.question_ar || '').trim() || null,
      explanation_en: (questionPayload.explanation_en || '').trim() || null,
      explanation_ar: (questionPayload.explanation_ar || '').trim() || null,
      source_reference: sourceReference,
      category: questionCategory,
      correct_option_id: null,
    };

    if (!preparedQuestionPayload.id) {
      delete preparedQuestionPayload.id;
    }

    const { data: question, error: questionError } = await supabase
      .from('questions')
      .upsert(preparedQuestionPayload, { onConflict: 'id' })
      .select('*')
      .single();

    if (questionError) {
      if (isMissingTableError(questionError, 'questions')) {
        throw new Error(toSetupMessage('questions'));
      }
      throw questionError;
    }

    let resolvedCorrectOptionId = sanitizeUuid(payload.correct_option_id);

    if (preparedOptions.length) {
      const optionPayload = preparedOptions.map((option, index) => {
        const row: any = {
          question_id: question.id,
          label_en: option.label_en,
          label_ar: option.label_ar,
          sort_order: option.sort_order ?? index,
        };

        if (option.id) {
          row.id = option.id;
        }

        return row;
      });

      const { data: savedOptions, error: optionError } = await supabase
        .from('question_options')
        .upsert(optionPayload, { onConflict: 'id' })
        .select('*');

      if (optionError) {
        if (isMissingTableError(optionError, 'question_options')) {
          throw new Error(toSetupMessage('question_options'));
        }
        throw optionError;
      }

      if (resolvedCorrectOptionId) {
        const matchingOption = (savedOptions || []).find((option: any) => option.id === resolvedCorrectOptionId);
        if (matchingOption) {
          resolvedCorrectOptionId = matchingOption.id;
        }
      } else if (savedOptions?.length) {
        resolvedCorrectOptionId = savedOptions[0].id;
      }
    }

    if (resolvedCorrectOptionId) {
      const { error: updateQuestionError } = await supabase
        .from('questions')
        .update({ correct_option_id: resolvedCorrectOptionId })
        .eq('id', question.id);

      if (updateQuestionError) {
        if (isMissingTableError(updateQuestionError, 'questions')) {
          throw new Error(toSetupMessage('questions'));
        }
        throw updateQuestionError;
      }
    }

    const refreshed = await this.listQuestions();
    const match = refreshed.find((item) => item.id === question.id);
    if (!match) {
      throw new Error('Failed to load saved question.');
    }
    return match;
  },

  async deleteQuestion(id: string) {
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) {
      if (isMissingTableError(error, 'questions')) {
        throw new Error(toSetupMessage('questions'));
      }
      throw error;
    }
  },

  async submitAnswer(userId: string, question: QuizQuestion, selectedOptionId: string, dateKey = getUtcDateKey()) {
    const payload = {
      user_id: userId,
      question_id: question.id,
      answer_date: dateKey,
      selected_option_id: selectedOptionId,
      is_correct: selectedOptionId === question.correct_option_id,
    };

    const { data, error } = await supabase
      .from('user_answers')
      .upsert(payload, { onConflict: 'user_id,question_id,answer_date' })
      .select('*')
      .single();

    if (error) {
      if (isMissingTableError(error, 'user_answers')) {
        throw new Error(toSetupMessage('user_answers'));
      }
      throw error;
    }
    return data as UserAnswer;
  },
};
