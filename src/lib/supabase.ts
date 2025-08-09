import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://deeevpevrsclsheavsxb.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZWV2cGV2cnNjbHNoZWF2c3hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NzQ2NjQsImV4cCI6MjA3MDI1MDY2NH0.ygBYILHMaV7QWtlNDI-ZL-X4iirI_Ei-ib4yXjA2AIA";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      quotes: {
        Row: {
          id: string;
          text: string;
          category_ids: string[];
          language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          text: string;
          category_ids: string[];
          language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          text?: string;
          category_ids?: string[];
          language?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      understanding: {
        Row: {
          id: string;
          title: string;
          description: string;
          category_ids: string[];
          language: string;
          date: string | null;
          word_count: number;
          real_life_connection: string | null;
          reference: string | null;
          page_slok_number: string | null;
          is_draft: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          category_ids: string[];
          language?: string;
          date?: string | null;
          word_count?: number;
          real_life_connection?: string | null;
          reference?: string | null;
          page_slok_number?: string | null;
          is_draft?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category_ids?: string[];
          language?: string;
          date?: string | null;
          word_count?: number;
          real_life_connection?: string | null;
          reference?: string | null;
          page_slok_number?: string | null;
          is_draft?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};