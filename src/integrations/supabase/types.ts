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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      appliances: {
        Row: {
          brand: string | null
          created_at: string
          id: string
          last_maintenance_date: string | null
          maintenance_schedule: Json | null
          model: string | null
          name: string
          next_maintenance_date: string | null
          notes: string | null
          property_id: string
          purchase_date: string | null
          status: string | null
          type: string
          updated_at: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          id?: string
          last_maintenance_date?: string | null
          maintenance_schedule?: Json | null
          model?: string | null
          name: string
          next_maintenance_date?: string | null
          notes?: string | null
          property_id: string
          purchase_date?: string | null
          status?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          id?: string
          last_maintenance_date?: string | null
          maintenance_schedule?: Json | null
          model?: string | null
          name?: string
          next_maintenance_date?: string | null
          notes?: string | null
          property_id?: string
          purchase_date?: string | null
          status?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appliances_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostics: {
        Row: {
          appliance_id: string | null
          created_at: string
          description: string | null
          diagnosis_summary: string | null
          estimated_cost_max: number | null
          estimated_cost_min: number | null
          file_url: string | null
          fix_instructions: string | null
          id: string
          input_type: string
          probable_causes: string[] | null
          property_id: string | null
          scam_alerts: string[] | null
          status: string | null
          urgency: string | null
          user_id: string
        }
        Insert: {
          appliance_id?: string | null
          created_at?: string
          description?: string | null
          diagnosis_summary?: string | null
          estimated_cost_max?: number | null
          estimated_cost_min?: number | null
          file_url?: string | null
          fix_instructions?: string | null
          id?: string
          input_type: string
          probable_causes?: string[] | null
          property_id?: string | null
          scam_alerts?: string[] | null
          status?: string | null
          urgency?: string | null
          user_id: string
        }
        Update: {
          appliance_id?: string | null
          created_at?: string
          description?: string | null
          diagnosis_summary?: string | null
          estimated_cost_max?: number | null
          estimated_cost_min?: number | null
          file_url?: string | null
          fix_instructions?: string | null
          id?: string
          input_type?: string
          probable_causes?: string[] | null
          property_id?: string | null
          scam_alerts?: string[] | null
          status?: string | null
          urgency?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostics_appliance_id_fkey"
            columns: ["appliance_id"]
            isOneToOne: false
            referencedRelation: "appliances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostics_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_history: {
        Row: {
          after_photo_url: string | null
          appliance_id: string
          before_photo_url: string | null
          completed: boolean
          cost: number | null
          created_at: string
          id: string
          maintenance_date: string
          maintenance_type: string
          notes: string | null
          updated_at: string
          user_id: string
          vendor_id: string | null
        }
        Insert: {
          after_photo_url?: string | null
          appliance_id: string
          before_photo_url?: string | null
          completed?: boolean
          cost?: number | null
          created_at?: string
          id?: string
          maintenance_date?: string
          maintenance_type: string
          notes?: string | null
          updated_at?: string
          user_id: string
          vendor_id?: string | null
        }
        Update: {
          after_photo_url?: string | null
          appliance_id?: string
          before_photo_url?: string | null
          completed?: boolean
          cost?: number | null
          created_at?: string
          id?: string
          maintenance_date?: string
          maintenance_type?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_history_appliance_id_fkey"
            columns: ["appliance_id"]
            isOneToOne: false
            referencedRelation: "appliances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_history_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          id: string
          notification_type: string
          related_id: string | null
          sent_at: string
          user_id: string
        }
        Insert: {
          id?: string
          notification_type: string
          related_id?: string | null
          sent_at?: string
          user_id: string
        }
        Update: {
          id?: string
          notification_type?: string
          related_id?: string | null
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      predictive_alerts: {
        Row: {
          appliance_id: string
          confidence_score: number
          created_at: string
          dismissed: boolean
          id: string
          predicted_failure_date: string | null
          prediction_type: string
          recommendation: string
          severity: string
          updated_at: string
          user_id: string
        }
        Insert: {
          appliance_id: string
          confidence_score: number
          created_at?: string
          dismissed?: boolean
          id?: string
          predicted_failure_date?: string | null
          prediction_type: string
          recommendation: string
          severity: string
          updated_at?: string
          user_id: string
        }
        Update: {
          appliance_id?: string
          confidence_score?: number
          created_at?: string
          dismissed?: boolean
          id?: string
          predicted_failure_date?: string | null
          prediction_type?: string
          recommendation?: string
          severity?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictive_alerts_appliance_id_fkey"
            columns: ["appliance_id"]
            isOneToOne: false
            referencedRelation: "appliances"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          country: string | null
          created_at: string
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          diagnostics_used_this_month: number | null
          email: string | null
          full_name: string | null
          id: string
          last_payment_date: string | null
          monthly_usage_limits: Json | null
          notification_preferences: Json | null
          onboarding_completed: boolean | null
          payment_required: boolean | null
          paystack_customer_code: string | null
          paystack_subscription_code: string | null
          phone: string | null
          subscription_end_date: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string
          user_type: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          diagnostics_used_this_month?: number | null
          email?: string | null
          full_name?: string | null
          id: string
          last_payment_date?: string | null
          monthly_usage_limits?: Json | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          payment_required?: boolean | null
          paystack_customer_code?: string | null
          paystack_subscription_code?: string | null
          phone?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_type?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          diagnostics_used_this_month?: number | null
          email?: string | null
          full_name?: string | null
          id?: string
          last_payment_date?: string | null
          monthly_usage_limits?: Json | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          payment_required?: boolean | null
          paystack_customer_code?: string | null
          paystack_subscription_code?: string | null
          phone?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_type?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limiting: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          identifier: string
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          identifier: string
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          metadata: Json | null
          payment_method: string | null
          plan: string
          reference: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          plan: string
          reference: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          plan?: string
          reference?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      usage_reset_log: {
        Row: {
          id: string
          records_deleted: number | null
          reset_date: string
        }
        Insert: {
          id?: string
          records_deleted?: number | null
          reset_date?: string
        }
        Update: {
          id?: string
          records_deleted?: number | null
          reset_date?: string
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          created_at: string
          diagnostic_id: string | null
          id: string
          input_type: string
          subscription_tier: string
          user_id: string
        }
        Insert: {
          created_at?: string
          diagnostic_id?: string | null
          id?: string
          input_type: string
          subscription_tier: string
          user_id: string
        }
        Update: {
          created_at?: string
          diagnostic_id?: string | null
          id?: string
          input_type?: string
          subscription_tier?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_tracking_diagnostic_id_fkey"
            columns: ["diagnostic_id"]
            isOneToOne: false
            referencedRelation: "diagnostics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vendor_bookings: {
        Row: {
          appliance_id: string | null
          created_at: string
          id: string
          notes: string | null
          scheduled_date: string
          scheduled_time: string
          service_type: string
          status: string
          updated_at: string
          user_id: string
          vendor_id: string
        }
        Insert: {
          appliance_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_date: string
          scheduled_time: string
          service_type: string
          status?: string
          updated_at?: string
          user_id: string
          vendor_id: string
        }
        Update: {
          appliance_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_date?: string
          scheduled_time?: string
          service_type?: string
          status?: string
          updated_at?: string
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_bookings_appliance_id_fkey"
            columns: ["appliance_id"]
            isOneToOne: false
            referencedRelation: "appliances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_bookings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_ratings: {
        Row: {
          appliance_id: string | null
          cost: number | null
          created_at: string
          id: string
          rating: number
          review: string | null
          service_date: string | null
          updated_at: string
          user_id: string
          vendor_id: string
        }
        Insert: {
          appliance_id?: string | null
          cost?: number | null
          created_at?: string
          id?: string
          rating: number
          review?: string | null
          service_date?: string | null
          updated_at?: string
          user_id: string
          vendor_id: string
        }
        Update: {
          appliance_id?: string | null
          cost?: number | null
          created_at?: string
          id?: string
          rating?: number
          review?: string | null
          service_date?: string | null
          updated_at?: string
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_ratings_appliance_id_fkey"
            columns: ["appliance_id"]
            isOneToOne: false
            referencedRelation: "appliances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_ratings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          specialties: string[] | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          specialties?: string[] | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          specialties?: string[] | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      warranties: {
        Row: {
          appliance_id: string
          coverage_details: string | null
          created_at: string
          document_url: string | null
          expiration_date: string | null
          id: string
          notes: string | null
          provider: string | null
          purchase_date: string | null
          updated_at: string
          user_id: string
          warranty_type: string
        }
        Insert: {
          appliance_id: string
          coverage_details?: string | null
          created_at?: string
          document_url?: string | null
          expiration_date?: string | null
          id?: string
          notes?: string | null
          provider?: string | null
          purchase_date?: string | null
          updated_at?: string
          user_id: string
          warranty_type: string
        }
        Update: {
          appliance_id?: string
          coverage_details?: string | null
          created_at?: string
          document_url?: string | null
          expiration_date?: string | null
          id?: string
          notes?: string | null
          provider?: string | null
          purchase_date?: string | null
          updated_at?: string
          user_id?: string
          warranty_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "warranties_appliance_id_fkey"
            columns: ["appliance_id"]
            isOneToOne: false
            referencedRelation: "appliances"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      transaction_summary: {
        Row: {
          amount: number | null
          amount_naira: number | null
          created_at: string | null
          id: string | null
          payment_method: string | null
          plan: string | null
          reference: string | null
          status: string | null
          updated_at: string | null
          user_email: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_usage_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_usage_summary: {
        Row: {
          audio_limit: number | null
          audio_usage: number | null
          current_period_end: string | null
          current_period_start: string | null
          payment_required: boolean | null
          photo_limit: number | null
          photo_usage: number | null
          subscription_end_date: string | null
          subscription_status: string | null
          subscription_tier: string | null
          text_limit: number | null
          text_usage: number | null
          user_id: string | null
          video_limit: number | null
          video_usage: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_add_property: { Args: { p_user_id: string }; Returns: boolean }
      can_create_diagnostic: {
        Args: { p_input_type: string; p_user_id: string }
        Returns: boolean
      }
      check_paid_user_renewals: { Args: never; Returns: undefined }
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_identifier: string
          p_max_requests: number
          p_window_minutes: number
        }
        Returns: boolean
      }
      cleanup_rate_limiting: { Args: never; Returns: undefined }
      get_monthly_usage: {
        Args: { p_user_id: string }
        Returns: {
          count: number
          input_type: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_vendor_stats: {
        Args: { p_vendor_id: string }
        Returns: {
          avg_rating: number
          rating_count: number
          total_cost: number
          total_services: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reset_free_user_usage: { Args: never; Returns: undefined }
      reset_monthly_usage: { Args: never; Returns: undefined }
      reset_monthly_usage_with_log: { Args: never; Returns: undefined }
      reset_paid_user_usage: { Args: { p_user_id: string }; Returns: undefined }
      update_user_country: {
        Args: { p_country_code: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "free" | "pro" | "business"
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
      app_role: ["admin", "free", "pro", "business"],
    },
  },
} as const
