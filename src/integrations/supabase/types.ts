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
      admin_users: {
        Row: {
          assigned_by: string | null
          created_at: string | null
          id: string
          permissions: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          permissions?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          permissions?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
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
      subscription_invoices: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          invoice_data: Json | null
          paid_at: string | null
          status: string
          subscription_id: string | null
          tracking_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          invoice_data?: Json | null
          paid_at?: string | null
          status?: string
          subscription_id?: string | null
          tracking_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          invoice_data?: Json | null
          paid_at?: string | null
          status?: string
          subscription_id?: string | null
          tracking_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_logs: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          currency: string | null
          id: string
          metadata: Json | null
          payment_provider: string | null
          payment_type: string
          phone_number: string | null
          status: string
          target_tier: Database["public"]["Enums"]["subscription_tier"]
          tracking_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          payment_provider?: string | null
          payment_type: string
          phone_number?: string | null
          status: string
          target_tier: Database["public"]["Enums"]["subscription_tier"]
          tracking_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          payment_provider?: string | null
          payment_type?: string
          phone_number?: string | null
          status?: string
          target_tier?: Database["public"]["Enums"]["subscription_tier"]
          tracking_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      symptoms: {
        Row: {
          id: string
          severity: number | null
          symptom: string
          timestamp: string | null
          user_id: string
        }
        Insert: {
          id?: string
          severity?: number | null
          symptom: string
          timestamp?: string | null
          user_id: string
        }
        Update: {
          id?: string
          severity?: number | null
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
      system_metrics: {
        Row: {
          dimensions: Json | null
          id: string
          metric_name: string
          metric_type: string
          metric_value: number
          timestamp: string | null
        }
        Insert: {
          dimensions?: Json | null
          id?: string
          metric_name: string
          metric_type: string
          metric_value: number
          timestamp?: string | null
        }
        Update: {
          dimensions?: Json | null
          id?: string
          metric_name?: string
          metric_type?: string
          metric_value?: number
          timestamp?: string | null
        }
        Relationships: []
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
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          cancelled_at: string | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          metadata: Json | null
          status: string
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end: string
          current_period_start?: string
          id?: string
          metadata?: Json | null
          status?: string
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          metadata?: Json | null
          status?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
          phone_number: string | null
          role: Database["public"]["Enums"]["app_role"] | null
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
          phone_number?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
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
          phone_number?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
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
      is_admin: {
        Args: { _user_id?: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: { _user_id?: string }
        Returns: boolean
      }
      update_system_metrics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role: "user" | "admin" | "super_admin"
      subscription_tier:
        | "community_advocate"
        | "health_champion"
        | "global_advocate"
        | "enterprise"
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
      app_role: ["user", "admin", "super_admin"],
      subscription_tier: [
        "community_advocate",
        "health_champion",
        "global_advocate",
        "enterprise",
      ],
    },
  },
} as const
