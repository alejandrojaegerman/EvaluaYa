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
      api_usage_events: {
        Row: {
          created_at: string
          endpoint: string
          filters: Json | null
          id: string
          referer_host: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          endpoint: string
          filters?: Json | null
          id?: string
          referer_host?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          endpoint?: string
          filters?: Json | null
          id?: string
          referer_host?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      assessments: {
        Row: {
          ai_result: Json | null
          answers: Json
          building_inferred: boolean
          building_key: string | null
          building_name: string | null
          created_at: string
          device_id: string | null
          engineer_notes: string | null
          engineer_verdict: string | null
          engineer_verified_at: string | null
          geo_inferred: boolean
          id: string
          language: string
          municipality: string | null
          photo_count: number
          photo_counts: Json
          prior_risk_level: string | null
          property: Json
          public_id: string
          report_type: string
          risk_level: string | null
          state: string | null
          status: string
          user_id: string | null
          verified_by_engineer: string | null
        }
        Insert: {
          ai_result?: Json | null
          answers?: Json
          building_inferred?: boolean
          building_key?: string | null
          building_name?: string | null
          created_at?: string
          device_id?: string | null
          engineer_notes?: string | null
          engineer_verdict?: string | null
          engineer_verified_at?: string | null
          geo_inferred?: boolean
          id?: string
          language?: string
          municipality?: string | null
          photo_count?: number
          photo_counts?: Json
          prior_risk_level?: string | null
          property?: Json
          public_id: string
          report_type?: string
          risk_level?: string | null
          state?: string | null
          status?: string
          user_id?: string | null
          verified_by_engineer?: string | null
        }
        Update: {
          ai_result?: Json | null
          answers?: Json
          building_inferred?: boolean
          building_key?: string | null
          building_name?: string | null
          created_at?: string
          device_id?: string | null
          engineer_notes?: string | null
          engineer_verdict?: string | null
          engineer_verified_at?: string | null
          geo_inferred?: boolean
          id?: string
          language?: string
          municipality?: string | null
          photo_count?: number
          photo_counts?: Json
          prior_risk_level?: string | null
          property?: Json
          public_id?: string
          report_type?: string
          risk_level?: string | null
          state?: string | null
          status?: string
          user_id?: string | null
          verified_by_engineer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_verified_by_engineer_fkey"
            columns: ["verified_by_engineer"]
            isOneToOne: false
            referencedRelation: "volunteer_engineers"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          created_at: string
          email: string | null
          id: string
          language: string | null
          message: string
          page: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          language?: string | null
          message: string
          page?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          language?: string | null
          message?: string
          page?: string | null
        }
        Relationships: []
      }
      funnel_events: {
        Row: {
          created_at: string
          device_id: string
          id: string
          language: string | null
          step: string
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          language?: string | null
          step: string
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          language?: string | null
          step?: string
        }
        Relationships: []
      }
      help_requests: {
        Row: {
          assessment_public_id: string | null
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          engineer_note: string | null
          escalated_at: string | null
          id: string
          last_reminder_at: string | null
          municipality: string | null
          note: string | null
          progress_stage: string | null
          progress_updated_at: string | null
          public_id: string
          reclaim_count: number
          reminder_count: number
          resident_confirmed_at: string | null
          resident_token: string
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
          engineer_note?: string | null
          escalated_at?: string | null
          id?: string
          last_reminder_at?: string | null
          municipality?: string | null
          note?: string | null
          progress_stage?: string | null
          progress_updated_at?: string | null
          public_id?: string
          reclaim_count?: number
          reminder_count?: number
          resident_confirmed_at?: string | null
          resident_token?: string
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
          engineer_note?: string | null
          escalated_at?: string | null
          id?: string
          last_reminder_at?: string | null
          municipality?: string | null
          note?: string | null
          progress_stage?: string | null
          progress_updated_at?: string | null
          public_id?: string
          reclaim_count?: number
          reminder_count?: number
          resident_confirmed_at?: string | null
          resident_token?: string
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      volunteer_engineers: {
        Row: {
          access_token: string | null
          created_at: string
          credential_path: string | null
          email: string | null
          id: string
          license_number: string | null
          name: string
          note: string | null
          organization: string | null
          specialization: string | null
          states: string[]
          status: string
          token_expires_at: string | null
          trust_flags: Json
          trust_score: number
          updated_at: string
          volunteer_type: string
          whatsapp: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          credential_path?: string | null
          email?: string | null
          id?: string
          license_number?: string | null
          name: string
          note?: string | null
          organization?: string | null
          specialization?: string | null
          states?: string[]
          status?: string
          token_expires_at?: string | null
          trust_flags?: Json
          trust_score?: number
          updated_at?: string
          volunteer_type?: string
          whatsapp: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          credential_path?: string | null
          email?: string | null
          id?: string
          license_number?: string | null
          name?: string
          note?: string | null
          organization?: string | null
          specialization?: string | null
          states?: string[]
          status?: string
          token_expires_at?: string | null
          trust_flags?: Json
          trust_score?: number
          updated_at?: string
          volunteer_type?: string
          whatsapp?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_admin_assessment_stats: {
        Args: never
        Returns: {
          analyzed: number
          drafts: number
          green: number
          orange: number
          red: number
          total: number
          yellow: number
        }[]
      }
      get_admin_assessment_timeseries: {
        Args: never
        Returns: {
          day: string
          green: number
          orange: number
          red: number
          total: number
          yellow: number
        }[]
      }
      get_admin_building_clusters: {
        Args: { _state?: string }
        Returns: {
          building_key: string
          building_name: string
          green: number
          last_report: string
          municipality: string
          orange: number
          red: number
          state: string
          total: number
          yellow: number
        }[]
      }
      get_admin_coverage_gaps: {
        Args: never
        Returns: {
          open_requests: number
          state: string
        }[]
      }
      get_admin_engineer_coverage: {
        Args: never
        Returns: {
          engineers: number
          state: string
        }[]
      }
      get_admin_flagged_reports: {
        Args: { _filter?: string; _limit?: number }
        Returns: {
          answer_count: number
          building_type: string
          created_at: string
          flagged_count: number
          missing_location: boolean
          mostly_unsure: boolean
          municipality: string
          no_photos: boolean
          photo_count: number
          public_id: string
          report_type: string
          risk_level: string
          state: string
          thin: boolean
          unsure_count: number
          unverified_high: boolean
          verified: boolean
        }[]
      }
      get_admin_help_requests: {
        Args: { _limit?: number }
        Returns: {
          ai_risk_level: string
          assessment_public_id: string
          claimed_at: string
          created_at: string
          engineer_name: string
          engineer_note: string
          engineer_verdict: string
          id: string
          municipality: string
          note: string
          prior_risk_level: string
          progress_stage: string
          progress_updated_at: string
          reclaim_count: number
          report_type: string
          resident_confirmed_at: string
          risk_level: string
          stalled: boolean
          state: string
          status: string
        }[]
      }
      get_admin_matching_progress: {
        Args: never
        Returns: {
          claimed_only: number
          contacted: number
          reclaimed: number
          resident_confirmed: number
          resolved: number
          stalled: number
          visited: number
        }[]
      }
      get_admin_matching_stats: {
        Args: never
        Returns: {
          avg_claim_seconds: number
          claimed: number
          closed: number
          open: number
          total: number
        }[]
      }
      get_admin_quality_metrics: { Args: never; Returns: Json }
      get_admin_state_reports: {
        Args: { _limit?: number; _state: string }
        Returns: {
          age: string
          building_type: string
          created_at: string
          flagged_count: number
          municipality: string
          public_id: string
          report_type: string
          risk_level: string
          seismic_intensity: number
          structural_type: string
        }[]
      }
      get_admin_top_states: {
        Args: never
        Returns: {
          green: number
          orange: number
          red: number
          state: string
          total: number
          yellow: number
        }[]
      }
      get_admin_verification_metrics: { Args: never; Returns: Json }
      get_admin_volunteer_stats: {
        Args: never
        Returns: {
          approved: number
          individuals: number
          organizations: number
          pending: number
          rejected: number
          total: number
        }[]
      }
      get_api_usage_metrics: { Args: { _window_hours?: number }; Returns: Json }
      get_approved_engineers: {
        Args: { _state: string }
        Returns: {
          covers_state: boolean
          id: string
          name: string
          organization: string
          specialization: string
          states: string[]
          volunteer_type: string
          whatsapp: string
        }[]
      }
      get_building_peers: {
        Args: { _building_key: string; _municipality: string; _state: string }
        Returns: {
          green: number
          last_report: string
          orange: number
          red: number
          total: number
          yellow: number
        }[]
      }
      get_damage_aggregates: {
        Args: never
        Returns: {
          green: number
          last_report: string
          municipality: string
          orange: number
          red: number
          state: string
          total: number
          verified: number
          yellow: number
        }[]
      }
      get_damage_aggregates_filtered: {
        Args: {
          _from?: string
          _municipality?: string
          _state?: string
          _to?: string
        }
        Returns: {
          green: number
          last_report: string
          municipality: string
          orange: number
          red: number
          state: string
          total: number
          verified: number
          yellow: number
        }[]
      }
      get_damage_timeseries: {
        Args: never
        Returns: {
          day: string
          green: number
          orange: number
          red: number
          total: number
          yellow: number
        }[]
      }
      get_damage_timeseries_filtered: {
        Args: {
          _from?: string
          _municipality?: string
          _state?: string
          _to?: string
        }
        Returns: {
          day: string
          green: number
          orange: number
          red: number
          total: number
          yellow: number
        }[]
      }
      get_damage_totals: {
        Args: never
        Returns: {
          areas: number
          green: number
          images: number
          orange: number
          red: number
          reports_with_photos: number
          total: number
          verified: number
          yellow: number
        }[]
      }
      get_damage_totals_filtered: {
        Args: {
          _from?: string
          _municipality?: string
          _state?: string
          _to?: string
        }
        Returns: {
          areas: number
          green: number
          images: number
          orange: number
          red: number
          reports_with_photos: number
          total: number
          verified: number
          yellow: number
        }[]
      }
      get_engineer_digest: {
        Args: never
        Returns: {
          access_token: string
          email: string
          engineer_id: string
          name: string
          open_count: number
          sample: Json
        }[]
      }
      get_engineer_stats: {
        Args: { _engineer_id: string }
        Returns: {
          avg_response_seconds: number
          claimed_active: number
          open_in_area: number
          resolved: number
          tier: string
        }[]
      }
      get_engineers_to_notify: {
        Args: { _state: string }
        Returns: {
          access_token: string
          email: string
          id: string
          name: string
        }[]
      }
      get_funnel_metrics: { Args: { _window_hours?: number }; Returns: Json }
      get_open_requests_to_escalate: {
        Args: never
        Returns: {
          created_at: string
          id: string
          municipality: string
          note: string
          public_id: string
          risk_level: string
          state: string
        }[]
      }
      get_photo_aggregates_filtered: {
        Args: {
          _from?: string
          _municipality?: string
          _state?: string
          _to?: string
        }
        Returns: {
          municipality: string
          photos: number
          reports_total: number
          reports_with_photos: number
          state: string
        }[]
      }
      get_photo_coverage_filtered: {
        Args: {
          _from?: string
          _municipality?: string
          _state?: string
          _to?: string
        }
        Returns: {
          item_id: string
          photos: number
          reports_total: number
          reports_with_photo: number
        }[]
      }
      get_photo_timeseries_filtered: {
        Args: {
          _from?: string
          _municipality?: string
          _state?: string
          _to?: string
        }
        Returns: {
          day: string
          photos: number
          reports_with_photos: number
        }[]
      }
      get_requests_needing_action: {
        Args: never
        Returns: {
          action: string
          claimed_at: string
          engineer_email: string
          engineer_id: string
          engineer_name: string
          engineer_token: string
          id: string
          last_reminder_at: string
          municipality: string
          progress_stage: string
          progress_updated_at: string
          public_id: string
          reminder_count: number
          risk_level: string
          state: string
        }[]
      }
      get_resident_request: {
        Args: { _token: string }
        Returns: {
          ai_risk_level: string
          assessment_public_id: string
          claimed_at: string
          created_at: string
          engineer_name: string
          engineer_note: string
          engineer_verdict: string
          municipality: string
          prior_risk_level: string
          progress_stage: string
          progress_updated_at: string
          report_type: string
          resident_confirmed_at: string
          risk_level: string
          state: string
          status: string
        }[]
      }
      get_risk_factors: {
        Args: { _municipality?: string; _state?: string }
        Returns: {
          factor_group: string
          factor_key: string
          green: number
          orange: number
          red: number
          total: number
          yellow: number
        }[]
      }
      get_risk_factors_filtered: {
        Args: {
          _from?: string
          _municipality?: string
          _state?: string
          _to?: string
        }
        Returns: {
          factor_group: string
          factor_key: string
          green: number
          orange: number
          red: number
          total: number
          yellow: number
        }[]
      }
      get_verified_engineers_public: {
        Args: never
        Returns: {
          id: string
          name: string
          organization: string
          resolved: number
          states: string[]
          tier: string
          volunteer_type: string
        }[]
      }
      mark_request_escalated: { Args: { _id: string }; Returns: undefined }
      mark_request_reminded: { Args: { _id: string }; Returns: undefined }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      reclaim_stalled_request: { Args: { _id: string }; Returns: undefined }
      resident_update_request: {
        Args: { _confirm: boolean; _token: string }
        Returns: boolean
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
