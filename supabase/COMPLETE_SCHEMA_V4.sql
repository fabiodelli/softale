-- =====================================================
-- SOFTALE COMPLETE DATABASE SCHEMA V4
-- =====================================================
-- Single unified schema for fresh database setup
-- Last Updated: 2 January 2026
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    username TEXT,
    avatar_url TEXT,
    stripe_customer_id TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    premium_until TIMESTAMPTZ,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    signup_source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles viewable" ON public.profiles
    FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, username, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 2. STORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    slug TEXT UNIQUE,
    author TEXT DEFAULT 'Softale',
    category TEXT NOT NULL CHECK (category IN (
        'sleep', 'meditation', 'fantasy', 'nature', 
        'work_break', 'motivation', 'kids', 'music_instrumental'
    )),
    duration INTEGER NOT NULL,
    narrator TEXT,
    
    -- Audio
    audio_url TEXT NOT NULL,
    audio_phases JSONB,
    music_file TEXT,
    
    -- Cover Images
    cover_url TEXT,
    cover_portrait_url TEXT,
    cover_landscape_url TEXT,
    
    -- Content
    script_text TEXT,
    tags TEXT[],
    
    -- Status
    is_premium BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    play_count INTEGER DEFAULT 0,
    
    -- Social
    social_reel_url TEXT,
    social_status TEXT DEFAULT 'draft' CHECK (social_status IN ('draft', 'generated', 'approved', 'posted')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS stories_slug_idx ON stories (slug);
CREATE INDEX IF NOT EXISTS stories_category_idx ON stories (category);
CREATE INDEX IF NOT EXISTS stories_published_idx ON stories (is_published);

-- Policies
CREATE POLICY "Anyone can view published stories" ON public.stories
    FOR SELECT USING (is_published = TRUE);
CREATE POLICY "Admins can view all stories" ON public.stories
    FOR SELECT USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins can insert stories" ON public.stories
    FOR INSERT WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins can update stories" ON public.stories
    FOR UPDATE USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins can delete stories" ON public.stories
    FOR DELETE USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- =====================================================
-- 3. COLLECTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT,
    cover_url TEXT,
    cover_portrait_url TEXT,
    cover_landscape_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_collection_slug ON collections(slug);

-- Policies
CREATE POLICY "Public collections viewable" ON public.collections
    FOR SELECT USING (is_published = TRUE);
CREATE POLICY "Admins can manage collections" ON public.collections
    FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- =====================================================
-- 4. COLLECTION_STORIES JUNCTION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.collection_stories (
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (collection_id, story_id)
);

ALTER TABLE public.collection_stories ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_collection_stories_order ON collection_stories(collection_id, sort_order);

-- Policies
CREATE POLICY "Public can view collection stories" ON public.collection_stories
    FOR SELECT USING (true);
CREATE POLICY "Admins can manage collection stories" ON public.collection_stories
    FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- =====================================================
-- 5. LISTENING PROGRESS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.listening_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    progress_seconds INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    last_played_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, story_id)
);

ALTER TABLE public.listening_progress ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own progress" ON public.listening_progress
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.listening_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.listening_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 6. FAVORITES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.favorites (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, story_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own favorites" ON public.favorites
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON public.favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON public.favorites
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 7. USER PREFERENCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    default_sleep_timer INTEGER DEFAULT 30,
    audio_quality TEXT DEFAULT 'high',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 8. USAGE LOGS TABLE (Analytics)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    story_id UUID REFERENCES stories(id),
    action TEXT NOT NULL CHECK (action IN ('play', 'pause', 'complete', 'drop_off')),
    position_seconds INTEGER,
    device_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can log own usage" ON public.usage_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view logs" ON public.usage_logs
    FOR SELECT USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- =====================================================
-- 9. STORAGE BUCKETS
-- =====================================================
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('audio', 'audio', true),
    ('covers', 'covers', true),
    ('social', 'social', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Access Audio" ON storage.objects 
    FOR SELECT USING (bucket_id = 'audio');
CREATE POLICY "Public Access Covers" ON storage.objects 
    FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "Public Access Social" ON storage.objects 
    FOR SELECT USING (bucket_id = 'social');

CREATE POLICY "Authenticated Upload Audio" ON storage.objects 
    FOR INSERT WITH CHECK (bucket_id = 'audio' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated Upload Covers" ON storage.objects 
    FOR INSERT WITH CHECK (bucket_id = 'covers' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated Upload Social" ON storage.objects 
    FOR INSERT WITH CHECK (bucket_id = 'social' AND auth.role() = 'authenticated');

-- =====================================================
-- 10. VIEWS (Analytics)
-- =====================================================
CREATE OR REPLACE VIEW poor_retention_stories AS
SELECT story_id, COUNT(*) as drops
FROM public.usage_logs
WHERE action = 'drop_off' AND position_seconds < 30
GROUP BY story_id
ORDER BY drops DESC;

-- =====================================================
-- END OF SCHEMA
-- =====================================================
