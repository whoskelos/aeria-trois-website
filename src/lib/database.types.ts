export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      review_submission_attempts: {
        Row: {
          client_key: string;
          created_at: string;
          id: number;
        };
        Insert: {
          client_key: string;
          created_at?: string;
          id?: number;
        };
        Update: {
          client_key?: string;
          created_at?: string;
          id?: number;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          client_key: string;
          created_at: string;
          id: string;
          name: string;
          opinion: string;
          privacy_accepted: boolean;
          rating: number;
          status: string;
          updated_at: string;
        };
        Insert: {
          client_key: string;
          created_at?: string;
          id?: string;
          name: string;
          opinion: string;
          privacy_accepted?: boolean;
          rating: number;
          status?: string;
          updated_at?: string;
        };
        Update: {
          client_key?: string;
          created_at?: string;
          id?: string;
          name?: string;
          opinion?: string;
          privacy_accepted?: boolean;
          rating?: number;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      sanitize_review_text: {
        Args: { p_allow_newlines?: boolean; p_value: string };
        Returns: string;
      };
      submit_review: {
        Args: {
          p_client_key: string;
          p_name: string;
          p_opinion: string;
          p_privacy_accepted: boolean;
          p_rating: number;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type ReviewRow = Database['public']['Tables']['reviews']['Row'];
export type ReviewStatus = 'pending' | 'approved' | 'rejected';
