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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analysis_rate_limits: {
        Row: {
          count: number
          id: string
          request_key: string
          updated_at: string
          window_start: string
        }
        Insert: {
          count?: number
          id?: string
          request_key: string
          updated_at?: string
          window_start?: string
        }
        Update: {
          count?: number
          id?: string
          request_key?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      assessments: {
        Row: {
          ai_result: Json | null
          answers: Json
          created_at: string
          device_id: string | null
          geo_inferred: boolean
          id: string
          language: string
          municipality: string | null
          property: Json
          public_id: string
          risk_level: string | null
          state: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          ai_result?: Json | null
          answers?: Json
          created_at?: string
          device_id?: string | null
          geo_inferred?: boolean
          id?: string
          language?: string
          municipality?: string | null
          property?: Json
          public_id: string
          risk_level?: string | null
          state?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          ai_result?: Json | null
          answers?: Json
          created_at?: string
          device_id?: string | null
          geo_inferred?: boolean
          id?: string
          language?: string
          municipality?: string | null
          property?: Json
          public_id?: string
          risk_level?: string | null
          state?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      help_requests: {
        Row: {
          assessment_public_id: string | null
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          id: string
          municipality: string | null
          note: string | null
          public_id: string
          resident_whatsapp: string
          risk_level: string | null
          state: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assessment_public_id?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          id?: string
          municipality?: string | null
          note?: string | null
          public_id?: string
          resident_whatsapp: string
          risk_level?: string | null
          state?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assessment_public_id?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          id?: string
          municipality?: string | null
          note?: string | null
          public_id?: string
          resident_whatsapp?: string
          risk_level?: string | null
          state?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "help_requests_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "volunteer_engineers"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_leads: {
        Row: {
          contact_name: string | null
          created_at: string
          email: string
          id: string
          note: string | null
          organization: string
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          email: string
          id?: string
          note?: string | null
          organization: string
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          email?: string
          id?: string
          note?: string | null
          organization?: string
        }
        Relationships: []
      }
      seismic_events: {
        Row: {
          bbox: Json
          created_at: string
          event_id: string
          grid: Json
          id: string
          is_active: boolean
          label: string
          updated_at: string
        }
        Insert: {
          bbox: Json
          created_at?: string
          event_id: string
          grid: Json
          id?: string
          is_active?: boolean
          label?: string
          updated_at?: string
        }
        Update: {
          bbox?: Json
          created_at?: string
          event_id?: string
          grid?: Json
          id?: string
          is_active?: boolean
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      volunteer_engineers: {
        Row: {
          access_token: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          note: string | null
          organization: string | null
          specialization: string | null
          states: string[]
          status: string
          updated_at: string
          whatsapp: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          note?: string | null
          organization?: string | null
          specialization?: string | null
          states?: string[]
          status?: string
          updated_at?: string
          whatsapp: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          note?: string | null
          organization?: string | null
          specialization?: string | null
          states?: string[]
          status?: string
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_approved_engineers: {
        Args: { _state: string }
        Returns: {
          covers_state: boolean
          id: string
          name: string
          organization: string
          specialization: string
          states: string[]
          whatsapp: string
        }[]
      }
      get_damage_aggregates: {
        Args: never
        Returns: {
          green: number
          last_report: string
          municipality: string
          red: number
          state: string
          total: number
          yellow: number
        }[]
      }
      get_damage_totals: {
        Args: never
        Returns: {
          areas: number
          green: number
          red: number
          total: number
          yellow: number
        }[]
      }
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
