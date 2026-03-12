import { PostgrestError } from '@supabase/supabase-js';

const readErrorMessage = (error: unknown) => {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
    return (error as any).message;
  }
  return '';
};

export const isMissingTableError = (error: unknown, table?: string) => {
  const message = readErrorMessage(error).toLowerCase();
  if (!message) return false;
  const schemaCacheMiss = message.includes('schema cache');
  const tableMissing =
    message.includes('could not find the table') ||
    message.includes('relation') && message.includes('does not exist');
  if (!schemaCacheMiss && !tableMissing) return false;
  if (!table) return true;
  return message.includes(`public.${table}`.toLowerCase()) || message.includes(`'${table}'`);
};

export const toSetupMessage = (table: string) =>
  `Database table "${table}" is missing. Run supabase_schema.sql in Supabase SQL Editor, then refresh.`;

export const toPostgrestError = (table: string): PostgrestError => ({
  name: 'PostgrestError',
  code: 'SCHEMA_MISSING',
  details: null,
  hint: null,
  message: toSetupMessage(table),
});
