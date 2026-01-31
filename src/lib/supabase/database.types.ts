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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string | null
          event_name: string
          id: string
          metadata: Json | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_name: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_name?: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      collection_stories: {
        Row: {
          added_at: string
          collection_id: string
          sort_order: number | null
          story_id: string
        }
        Insert: {
          added_at?: string
          collection_id: string
          sort_order?: number | null
          story_id: string
        }
        Update: {
          added_at?: string
          collection_id?: string
          sort_order?: number | null
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_stories_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_stories_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          category: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          slug: string
          title: string
        }
        Insert: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          slug: string
          title: string
        }
        Update: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          slug?: string
          title?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      listening_progress: {
        Row: {
          completed: boolean | null
          created_at: string | null
          id: string
          last_played_at: string | null
          progress_seconds: number | null
          story_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          last_played_at?: string | null
          progress_seconds?: number | null
          story_id: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          last_played_at?: string | null
          progress_seconds?: number | null
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listening_progress_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_items: {
        Row: {
          added_at: string | null
          id: string
          playlist_id: string
          position: number | null
          story_id: string
        }
        Insert: {
          added_at?: string | null
          id?: string
          playlist_id: string
          position?: number | null
          story_id: string
        }
        Update: {
          added_at?: string | null
          id?: string
          playlist_id?: string
          position?: number | null
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_items_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_items_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          current_streak: number | null
          email: string
          id: string
          is_premium: boolean | null
          last_active_date: string | null
          premium_until: string | null
          role: string | null
          stories_completed: number | null
          stripe_customer_id: string | null
          subscription_end_date: string | null
          subscription_id: string | null
          subscription_status: string | null
          total_minutes_listened: number | null
          updated_at: string | null
          username: string | null
          waitlist_joined_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          current_streak?: number | null
          email: string
          id: string
          is_premium?: boolean | null
          last_active_date?: string | null
          premium_until?: string | null
          role?: string | null
          stories_completed?: number | null
          stripe_customer_id?: string | null
          subscription_end_date?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          total_minutes_listened?: number | null
          updated_at?: string | null
          username?: string | null
          waitlist_joined_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          current_streak?: number | null
          email?: string
          id?: string
          is_premium?: boolean | null
          last_active_date?: string | null
          premium_until?: string | null
          role?: string | null
          stories_completed?: number | null
          stripe_customer_id?: string | null
          subscription_end_date?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          total_minutes_listened?: number | null
          updated_at?: string | null
          username?: string | null
          waitlist_joined_at?: string | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          ambient_url: string | null
          audio_phases: Json | null
          audio_url: string
          category: string
          cost_metadata: Json | null
          cover_landscape_url: string | null
          cover_portrait_url: string | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          duration: number
          id: string
          is_loop: boolean | null
          is_premium: boolean | null
          is_published: boolean | null
          music_file: string | null
          music_url: string | null
          narrator: string | null
          play_count: number | null
          published_at: string | null
          script_text: string | null
          slug: string | null
          social_posted_at: string | null
          social_reel_url: string | null
          social_status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          voice_id: string | null
          voice_url: string | null
        }
        Insert: {
          ambient_url?: string | null
          audio_phases?: Json | null
          audio_url: string
          category: string
          cost_metadata?: Json | null
          cover_landscape_url?: string | null
          cover_portrait_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          duration: number
          id?: string
          is_loop?: boolean | null
          is_premium?: boolean | null
          is_published?: boolean | null
          music_file?: string | null
          music_url?: string | null
          narrator?: string | null
          play_count?: number | null
          published_at?: string | null
          script_text?: string | null
          slug?: string | null
          social_posted_at?: string | null
          social_reel_url?: string | null
          social_status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          voice_id?: string | null
          voice_url?: string | null
        }
        Update: {
          ambient_url?: string | null
          audio_phases?: Json | null
          audio_url?: string
          category?: string
          cost_metadata?: Json | null
          cover_landscape_url?: string | null
          cover_portrait_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number
          id?: string
          is_loop?: boolean | null
          is_premium?: boolean | null
          is_published?: boolean | null
          music_file?: string | null
          music_url?: string | null
          narrator?: string | null
          play_count?: number | null
          published_at?: string | null
          script_text?: string | null
          slug?: string | null
          social_posted_at?: string | null
          social_reel_url?: string | null
          social_status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          voice_id?: string | null
          voice_url?: string | null
        }
        Relationships: []
      }
      usage_logs: {
        Row: {
          action: string
          created_at: string | null
          device_type: string | null
          id: string
          position_seconds: number | null
          story_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          device_type?: string | null
          id?: string
          position_seconds?: number | null
          story_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          device_type?: string | null
          id?: string
          position_seconds?: number | null
          story_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_logs_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          audio_quality: string | null
          created_at: string | null
          default_sleep_timer: number | null
          id: string
          notifications_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          audio_quality?: string | null
          created_at?: string | null
          default_sleep_timer?: number | null
          id?: string
          notifications_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          audio_quality?: string | null
          created_at?: string | null
          default_sleep_timer?: number | null
          id?: string
          notifications_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      voices: {
        Row: {
          created_at: string | null
          description: string | null
          gender: string | null
          id: string
          is_active: boolean | null
          language: string | null
          name: string
          style: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          gender?: string | null
          id: string
          is_active?: boolean | null
          language?: string | null
          name: string
          style?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          name?: string
          style?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      poor_retention_stories: {
        Row: {
          drops: number | null
          story_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_logs_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_tag_stats: {
        Args: never
        Returns: {
          count: number
          tag: string
        }[]
      }
      merge_tags: {
        Args: { new_tag: string; old_tag: string }
        Returns: undefined
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
