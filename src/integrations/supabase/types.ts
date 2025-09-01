export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      community_impact: {
        Row: {
          id: string
          metric_name: string
          metric_value: number
          region: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          metric_name: string
          metric_value: number
          region?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          metric_name?: string
          metric_value?: number
          region?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sdg_content: {
        Row: {
          created_at: string | null
          current_progress: number | null
          current_value: string | null
          description: string | null
          how_app_helps: string | null
          id: string
          target_number: string
          target_value: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          current_progress?: number | null
          current_value?: string | null
          description?: string | null
          how_app_helps?: string | null
          id?: string
          target_number: string
          target_value?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          current_progress?: number | null
          current_value?: string | null
          description?: string | null
          how_app_helps?: string | null
          id?: string
          target_number?: string
          target_value?: string | null
          title?: string
        }
        Relationships: []
      }
      symptoms: {
        Row: {
          id: string
          symptom: string
          timestamp: string | null
          user_id: string
        }
        Insert: {
          id?: string
          symptom: string
          timestamp?: string | null
          user_id: string
        }
        Update: {
          id?: string
          symptom?: string
          timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "symptoms_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_education_progress: {
        Row: {
          completed: boolean | null
          completion_date: string | null
          content_id: string
          created_at: string | null
          id: string
          time_spent_seconds: number | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completion_date?: string | null
          content_id: string
          created_at?: string | null
          id?: string
          time_spent_seconds?: number | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completion_date?: string | null
          content_id?: string
          created_at?: string | null
          id?: string
          time_spent_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_education_progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "sdg_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_education_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          data_sharing_consent: boolean | null
          education_completed: boolean | null
          email: string
          full_name: string | null
          id: string
          impact_notifications: boolean | null
          intasend_customer_id: string | null
          password_hash: string | null
          subscription_end_date: string | null
          subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"] | null
          updated_at: string | null
          username: string | null
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          data_sharing_consent?: boolean | null
          education_completed?: boolean | null
          email: string
          full_name?: string | null
          id?: string
          impact_notifications?: boolean | null
          intasend_customer_id?: string | null
          password_hash?: string | null
          subscription_end_date?: string | null
          subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"] | null
          updated_at?: string | null
          username?: string | null
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          data_sharing_consent?: boolean | null
          education_completed?: boolean | null
          email?: string
          full_name?: string | null
          id?: string
          impact_notifications?: boolean | null
          intasend_customer_id?: string | null
          password_hash?: string | null
          subscription_end_date?: string | null
          subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"] | null
          updated_at?: string | null
          username?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      subscription_tier:
        | "community_advocate"
        | "health_champion"
        | "global_advocate"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      subscription_tier: [
        "community_advocate",
        "health_champion",
        "global_advocate",
      ],
    },
  },
} as const
