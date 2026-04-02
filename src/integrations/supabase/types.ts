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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number
          bank_name: string | null
          card_brand: string | null
          closing_day: number | null
          color: string | null
          created_at: string
          credit_limit: number | null
          currency: string
          due_day: number | null
          id: string
          is_active: boolean | null
          last_four_digits: string | null
          name: string
          type: string
          user_id: string
        }
        Insert: {
          balance?: number
          bank_name?: string | null
          card_brand?: string | null
          closing_day?: number | null
          color?: string | null
          created_at?: string
          credit_limit?: number | null
          currency?: string
          due_day?: number | null
          id?: string
          is_active?: boolean | null
          last_four_digits?: string | null
          name: string
          type?: string
          user_id: string
        }
        Update: {
          balance?: number
          bank_name?: string | null
          card_brand?: string | null
          closing_day?: number | null
          color?: string | null
          created_at?: string
          credit_limit?: number | null
          currency?: string
          due_day?: number | null
          id?: string
          is_active?: boolean | null
          last_four_digits?: string | null
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          context_snapshot: Json | null
          created_at: string
          id: string
          messages: Json
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          context_snapshot?: Json | null
          created_at?: string
          id?: string
          messages?: Json
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          context_snapshot?: Json | null
          created_at?: string
          id?: string
          messages?: Json
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          alert_threshold: number
          category_id: string | null
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean | null
          limit_amount: number
          name: string
          period: string
          start_date: string
          user_id: string
        }
        Insert: {
          alert_threshold?: number
          category_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          limit_amount: number
          name: string
          period?: string
          start_date?: string
          user_id: string
        }
        Update: {
          alert_threshold?: number
          category_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          limit_amount?: number
          name?: string
          period?: string
          start_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          type: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          type?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_goals: {
        Row: {
          category: string | null
          created_at: string
          current_amount: number
          deadline: string | null
          description: string | null
          id: string
          priority: string
          status: string
          target_amount: number
          title: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          current_amount?: number
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: string
          status?: string
          target_amount: number
          title: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          current_amount?: number
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: string
          status?: string
          target_amount?: number
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ai_model: string
          ai_provider: string
          avatar_url: string | null
          created_at: string
          currency: string
          full_name: string
          id: string
          locale: string
          monthly_income: number | null
          updated_at: string
        }
        Insert: {
          ai_model?: string
          ai_provider?: string
          avatar_url?: string | null
          created_at?: string
          currency?: string
          full_name?: string
          id: string
          locale?: string
          monthly_income?: number | null
          updated_at?: string
        }
        Update: {
          ai_model?: string
          ai_provider?: string
          avatar_url?: string | null
          created_at?: string
          currency?: string
          full_name?: string
          id?: string
          locale?: string
          monthly_income?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          attachment_url: string | null
          category_id: string | null
          created_at: string
          date: string
          description: string
          id: string
          is_recurring: boolean | null
          notes: string | null
          recurring_interval: string | null
          tags: string[] | null
          type: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          attachment_url?: string | null
          category_id?: string | null
          created_at?: string
          date?: string
          description: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          recurring_interval?: string | null
          tags?: string[] | null
          type: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          attachment_url?: string | null
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          recurring_interval?: string | null
          tags?: string[] | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
