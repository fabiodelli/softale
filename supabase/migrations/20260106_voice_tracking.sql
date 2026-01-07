-- Voice Tracking System Migration
-- Adds voice tracking capability to stories

-- 1. Add voice_id column to stories table
ALTER TABLE stories ADD COLUMN IF NOT EXISTS voice_id TEXT;

-- 2. Create voices reference table
CREATE TABLE IF NOT EXISTS voices (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female', 'neutral')),
    description TEXT,
    style TEXT, -- e.g. 'calm', 'warm', 'energetic'
    language TEXT DEFAULT 'en',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Insert voices - UPDATED with new selection
INSERT INTO voices (id, name, gender, description, style) VALUES
    -- MALE VOICES (5)
    ('GUDYcgRAONiI1nXDcNQQ', 'Milo', 'male', 'Calm, Soothing, Meditative', 'calm'),
    ('NOpBlnGInO9m6vDvFkFC', 'Spuds', 'male', 'Grandpa storyteller, warm and nostalgic', 'warm'),
    ('N2lVS1w4EtoT3dr4eOWO', 'Callum', 'male', 'American, hoarse, video game style', 'energetic'),
    ('G17SuINrv2H9FC6nvetn', 'Christopher', 'male', 'Multilingual, versatile narrator', 'neutral'),
    ('ZQe5CZNOzWyzPSCn5a3c', 'James', 'male', 'Multilingual, meditation guide', 'calm'),
    -- FEMALE VOICES (6)
    ('21m00Tcm4TlvDq8ikWAM', 'Rachel', 'female', 'Soft American voice', 'warm'),
    ('EXAVITQu4vr4xnSDxMaL', 'Bella', 'female', 'British accent, warm', 'warm'),
    ('pjcYQlDFKMbcOUp6F5GD', 'Brittney', 'female', 'Warm, inviting tone', 'warm'),
    ('mZ3kbJNnKRWI4YzJXA9j', 'Delilah', 'female', 'Relaxing and soothing', 'calm'),
    ('iCrDUkL56s3C8sCRl7wb', 'Hope', 'female', 'Soothing narrator', 'calm'),
    ('zA6D7RyKdc2EClouEMkP', 'AImee', 'female', 'ASMR and meditation specialist', 'calm')
ON CONFLICT (id) DO NOTHING;

-- 4. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stories_voice_id ON stories(voice_id);
