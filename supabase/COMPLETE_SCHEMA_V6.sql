-- COMPLETE SCHEMA V6 (Consolidated 2026-01-20)
-- This file represents the CURRENT, CLEAN state of the database including all recent fixes.

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ANALYTICS EVENTS
CREATE TABLE public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id uuid,
  event_name text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT analytics_events_pkey PRIMARY KEY (id),
  CONSTRAINT analytics_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- STORIES
CREATE TABLE public.stories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  category text NOT NULL,
  duration integer NOT NULL,
  narrator text,
  audio_url text NOT NULL,
  cover_url text,
  is_premium boolean DEFAULT false,
  is_published boolean DEFAULT true,
  play_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  music_file text,
  audio_phases jsonb,
  script_text text,
  social_reel_url text,
  social_status text DEFAULT 'draft'::text CHECK (social_status = ANY (ARRAY['draft'::text, 'generated'::text, 'approved'::text, 'posted'::text])),
  social_posted_at timestamp with time zone,
  cover_landscape_url text,
  cover_portrait_url text,
  published_at timestamp with time zone DEFAULT now(),
  slug text,
  is_loop boolean DEFAULT false,
  voice_id text,
  tags ARRAY DEFAULT '{}'::text[],
  cost_metadata jsonb,
  CONSTRAINT stories_pkey PRIMARY KEY (id)
);

-- COLLECTIONS
CREATE TABLE public.collections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  slug text NOT NULL UNIQUE,
  cover_url text,
  is_featured boolean DEFAULT false,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  category text,
  CONSTRAINT collections_pkey PRIMARY KEY (id)
);

-- COLLECTION STORIES
CREATE TABLE public.collection_stories (
  collection_id uuid NOT NULL,
  story_id uuid NOT NULL,
  sort_order integer DEFAULT 0,
  added_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT collection_stories_pkey PRIMARY KEY (collection_id, story_id),
  CONSTRAINT collection_stories_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.collections(id),
  CONSTRAINT collection_stories_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories(id)
);

-- PROFILES
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  username text,
  avatar_url text,
  is_premium boolean DEFAULT false,
  premium_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  role text DEFAULT 'user'::text CHECK (role = ANY (ARRAY['user'::text, 'admin'::text])),
  stripe_customer_id text,
  subscription_status text DEFAULT 'none'::text,
  total_minutes_listened integer DEFAULT 0,
  stories_completed integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  last_active_date date DEFAULT CURRENT_DATE,
  -- V6 Additions (Fixes)
  subscription_id text,
  subscription_end_date timestamp with time zone,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- PROFILES INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_id ON profiles(subscription_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);

-- FAVORITES
CREATE TABLE public.favorites (
  user_id uuid NOT NULL,
  story_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT favorites_pkey PRIMARY KEY (user_id, story_id),
  CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT favorites_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories(id)
);

-- LISTENING PROGRESS
CREATE TABLE public.listening_progress (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  story_id uuid NOT NULL,
  progress_seconds integer DEFAULT 0,
  completed boolean DEFAULT false,
  last_played_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT listening_progress_pkey PRIMARY KEY (id),
  CONSTRAINT listening_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT listening_progress_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories(id)
);

-- PLAYLISTS
CREATE TABLE public.playlists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT playlists_pkey PRIMARY KEY (id),
  CONSTRAINT playlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- PLAYLIST ITEMS
CREATE TABLE public.playlist_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  playlist_id uuid NOT NULL,
  story_id uuid NOT NULL,
  position integer DEFAULT 0,
  added_at timestamp with time zone DEFAULT now(),
  CONSTRAINT playlist_items_pkey PRIMARY KEY (id),
  CONSTRAINT playlist_items_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.playlists(id),
  CONSTRAINT playlist_items_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories(id)
);

-- USAGE LOGS
CREATE TABLE public.usage_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  story_id uuid,
  action text NOT NULL,
  position_seconds integer,
  device_type text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT usage_logs_pkey PRIMARY KEY (id),
  CONSTRAINT usage_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT usage_logs_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories(id)
);

-- USER PREFERENCES
CREATE TABLE public.user_preferences (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  default_sleep_timer integer DEFAULT 30,
  audio_quality text DEFAULT 'high'::text,
  notifications_enabled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- VOICES
CREATE TABLE public.voices (
  id text NOT NULL,
  name text NOT NULL,
  gender text CHECK (gender = ANY (ARRAY['male'::text, 'female'::text, 'neutral'::text])),
  description text,
  style text,
  language text DEFAULT 'en'::text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT voices_pkey PRIMARY KEY (id)
);

-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enabling RLS on tables is recommended standard practice
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published stories are viewable by everyone." ON stories FOR SELECT USING (is_published = true);

-- (Additional RLS policies would be added here in a real production environment)
