-- Add category column to collections table
ALTER TABLE collections ADD COLUMN IF NOT EXISTS category TEXT;

-- Update valid categories check (same as stories for consistency)
ALTER TABLE collections DROP CONSTRAINT IF EXISTS collections_category_check;
ALTER TABLE collections ADD CONSTRAINT collections_category_check CHECK (category IN (
    'sleep', 
    'meditation', 
    'fantasy', 
    'nature', 
    'work_break', 
    'motivation', 
    'kids', 
    'music_instrumental'
));
