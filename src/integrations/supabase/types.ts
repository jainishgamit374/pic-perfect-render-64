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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      inspection_images: {
        Row: {
          analysis_state: string
          analyzed_at: string | null
          area: string | null
          confidence: number | null
          created_at: string
          error: string | null
          filename: string
          id: string
          inspection_id: string
          kind: string
          location_label: string | null
          pair_key: string | null
          recommendation: string | null
          room: string | null
          section: string | null
          severity: Database["public"]["Enums"]["finding_severity"] | null
          size_bytes: number | null
          storage_path: string
          summary: string | null
          thermal_observation: string | null
          user_id: string
          visual_observation: string | null
        }
        Insert: {
          analysis_state?: string
          analyzed_at?: string | null
          area?: string | null
          confidence?: number | null
          created_at?: string
          error?: string | null
          filename: string
          id?: string
          inspection_id: string
          kind?: string
          location_label?: string | null
          pair_key?: string | null
          recommendation?: string | null
          room?: string | null
          section?: string | null
          severity?: Database["public"]["Enums"]["finding_severity"] | null
          size_bytes?: number | null
          storage_path: string
          summary?: string | null
          thermal_observation?: string | null
          user_id: string
          visual_observation?: string | null
        }
        Update: {
          analysis_state?: string
          analyzed_at?: string | null
          area?: string | null
          confidence?: number | null
          created_at?: string
          error?: string | null
          filename?: string
          id?: string
          inspection_id?: string
          kind?: string
          location_label?: string | null
          pair_key?: string | null
          recommendation?: string | null
          room?: string | null
          section?: string | null
          severity?: Database["public"]["Enums"]["finding_severity"] | null
          size_bytes?: number | null
          storage_path?: string
          summary?: string | null
          thermal_observation?: string | null
          user_id?: string
          visual_observation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_images_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          city: string | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string
          current_step: number
          home_age: string | null
          id: string
          inspection_date: string | null
          inspection_time: string | null
          inspector_name: string | null
          notes: string | null
          pin_code: string | null
          property_address: string | null
          property_size: string | null
          property_type: string | null
          state: string | null
          status: Database["public"]["Enums"]["inspection_status"]
          template_id: string | null
          title: string
          updated_at: string
          user_id: string
          weather: string | null
        }
        Insert: {
          city?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          current_step?: number
          home_age?: string | null
          id?: string
          inspection_date?: string | null
          inspection_time?: string | null
          inspector_name?: string | null
          notes?: string | null
          pin_code?: string | null
          property_address?: string | null
          property_size?: string | null
          property_type?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["inspection_status"]
          template_id?: string | null
          title: string
          updated_at?: string
          user_id: string
          weather?: string | null
        }
        Update: {
          city?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          current_step?: number
          home_age?: string | null
          id?: string
          inspection_date?: string | null
          inspection_time?: string | null
          inspector_name?: string | null
          notes?: string | null
          pin_code?: string | null
          property_address?: string | null
          property_size?: string | null
          property_type?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["inspection_status"]
          template_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          weather?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          sections: Json
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          name: string
          sections?: Json
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          sections?: Json
          updated_at?: string
          user_id?: string | null
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
      finding_severity:
        | "normal"
        | "minor"
        | "moderate"
        | "defective"
        | "critical"
      inspection_status:
        | "draft"
        | "processing"
        | "review"
        | "completed"
        | "failed"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      finding_severity: [
        "normal",
        "minor",
        "moderate",
        "defective",
        "critical",
      ],
      inspection_status: [
        "draft",
        "processing",
        "review",
        "completed",
        "failed",
      ],
    },
  },
} as const
