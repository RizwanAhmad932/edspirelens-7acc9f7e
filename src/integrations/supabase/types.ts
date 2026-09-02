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
      ad_events: {
        Row: {
          ad_id: string
          created_at: string
          event_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          ad_id: string
          created_at?: string
          event_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          ad_id?: string
          created_at?: string
          event_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_events_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      ads: {
        Row: {
          ad_type: string
          clicks: number
          created_at: string
          id: string
          is_active: boolean
          link_url: string | null
          media_type: string
          media_url: string
          placement: string
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          ad_type?: string
          clicks?: number
          created_at?: string
          id?: string
          is_active?: boolean
          link_url?: string | null
          media_type?: string
          media_url: string
          placement?: string
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          ad_type?: string
          clicks?: number
          created_at?: string
          id?: string
          is_active?: boolean
          link_url?: string | null
          media_type?: string
          media_url?: string
          placement?: string
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          id: string
          logo_dark_url: string | null
          logo_light_url: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          logo_dark_url?: string | null
          logo_light_url?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          logo_dark_url?: string | null
          logo_light_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      app_shortcuts: {
        Row: {
          app_url: string
          category: string
          created_at: string
          icon_url: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          app_url: string
          category?: string
          created_at?: string
          icon_url: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          app_url?: string
          category?: string
          created_at?: string
          icon_url?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      app_themes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          theme_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          theme_name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          theme_name?: string
        }
        Relationships: []
      }
      challenges: {
        Row: {
          created_at: string
          description: string
          expires_at: string | null
          goal_target: number
          goal_type: string
          id: string
          is_active: boolean
          reward_type: string
          reward_value: string
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          expires_at?: string | null
          goal_target: number
          goal_type: string
          id?: string
          is_active?: boolean
          reward_type?: string
          reward_value: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          expires_at?: string | null
          goal_target?: number
          goal_type?: string
          id?: string
          is_active?: boolean
          reward_type?: string
          reward_value?: string
          title?: string
        }
        Relationships: []
      }
      login_logs: {
        Row: {
          email: string
          full_name: string | null
          id: string
          ip_address: string | null
          logged_in_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          email: string
          full_name?: string | null
          id?: string
          ip_address?: string | null
          logged_in_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          email?: string
          full_name?: string | null
          id?: string
          ip_address?: string | null
          logged_in_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          board: string | null
          created_at: string
          full_name: string | null
          id: string
          level: number | null
          phone: string | null
          selected_avatar: string | null
          student_class: string | null
          target_exam: string | null
          total_study_minutes: number | null
          unlocked_avatars: Json | null
          updated_at: string
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          board?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          level?: number | null
          phone?: string | null
          selected_avatar?: string | null
          student_class?: string | null
          target_exam?: string | null
          total_study_minutes?: number | null
          unlocked_avatars?: Json | null
          updated_at?: string
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          board?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          level?: number | null
          phone?: string | null
          selected_avatar?: string | null
          student_class?: string | null
          target_exam?: string | null
          total_study_minutes?: number | null
          unlocked_avatars?: Json | null
          updated_at?: string
          xp?: number | null
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          analysis_id: string | null
          correct_answer: string | null
          created_at: string
          id: string
          is_correct: boolean
          question: string
          selected_answer: string | null
          topic: string | null
          user_id: string
          video_title: string | null
        }
        Insert: {
          analysis_id?: string | null
          correct_answer?: string | null
          created_at?: string
          id?: string
          is_correct: boolean
          question: string
          selected_answer?: string | null
          topic?: string | null
          user_id: string
          video_title?: string | null
        }
        Update: {
          analysis_id?: string | null
          correct_answer?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean
          question?: string
          selected_answer?: string | null
          topic?: string | null
          user_id?: string
          video_title?: string | null
        }
        Relationships: []
      }
      user_challenges: {
        Row: {
          challenge_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          progress: number
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          progress?: number
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_analyses: {
        Row: {
          created_at: string
          duration: string | null
          id: string
          notes: Json | null
          quiz: Json | null
          quiz_score: number | null
          quiz_total: number | null
          summary: Json | null
          transcript: Json | null
          updated_at: string
          user_id: string | null
          video_title: string
          video_url: string
        }
        Insert: {
          created_at?: string
          duration?: string | null
          id?: string
          notes?: Json | null
          quiz?: Json | null
          quiz_score?: number | null
          quiz_total?: number | null
          summary?: Json | null
          transcript?: Json | null
          updated_at?: string
          user_id?: string | null
          video_title?: string
          video_url: string
        }
        Update: {
          created_at?: string
          duration?: string | null
          id?: string
          notes?: Json | null
          quiz?: Json | null
          quiz_score?: number | null
          quiz_total?: number | null
          summary?: Json | null
          transcript?: Json | null
          updated_at?: string
          user_id?: string | null
          video_title?: string
          video_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_theme: { Args: { _theme_name: string }; Returns: undefined }
      add_xp: {
        Args: { _amount: number; _user_id: string }
        Returns: undefined
      }
      get_ad_stats: {
        Args: never
        Returns: {
          ad_id: string
          clicks: number
          views: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
