import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import type { AuthError, PostgrestError } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

/**
 * Enhanced error handling wrapper for Supabase operations
 */
export function handleSupabaseError(error: PostgrestError | AuthError | Error, operation: string): Error {
  console.error(`Supabase error in ${operation}:`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });

  // Handle specific error codes
  if (error.code === 'PGRST116') {
    return new Error(`No data found for ${operation}`);
  }

  if (error.code === '23505') {
    return new Error('Data already exists');
  }

  return error;
}

export async function getSymptoms(userId?: string) {
  try {
    if (userId) {
      const { data, error } = await supabase
        .from('symptoms')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (error) {
        throw handleSupabaseError(error, 'getSymptoms');
      }

      return { data, error: null };
    }

    // Get current user's symptoms
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      throw handleSupabaseError(authError, 'getSymptoms:auth');
    }

    if (!user) {
      throw new Error('No authenticated user');
    }

    const { data, error } = await supabase
      .from('symptoms')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false });

    if (error) {
      throw handleSupabaseError(error, 'getSymptoms');
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error, 'getSymptoms') };
  }
}

export async function logSymptom(symptomData: { symptom: string; severity: number; userId: string; timestamp?: string }) {
  try {
    const data = {
      symptom: symptomData.symptom,
      severity: symptomData.severity,
      user_id: symptomData.userId
    };

    // Add timestamp if provided
    if (symptomData.timestamp) {
      (data as any).timestamp = symptomData.timestamp;
    }

    const { data: result, error } = await supabase
      .from('symptoms')
      .insert([data])
      .select();

    if (error) {
      throw handleSupabaseError(error, 'logSymptom');
    }

    console.log('✅ Symptom logged successfully:', result);
    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error, 'logSymptom') };
  }
}
