-- Update Stories Category Constraint
ALTER TABLE stories DROP CONSTRAINT IF EXISTS stories_category_check;
ALTER TABLE stories ADD CONSTRAINT stories_category_check CHECK (category IN (
    'sleep', 
    'meditation', 
    'fantasy', 
    'nature', 
    'work_break', 
    'motivation', 
    'kids', 
    'music_instrumental',
    'emotional_support'
));

-- Update Collections Category Constraint (Aligning with Stories)
ALTER TABLE collections DROP CONSTRAINT IF EXISTS collections_category_check;
ALTER TABLE collections ADD CONSTRAINT collections_category_check CHECK (category IN (
    'sleep', 
    'meditation', 
    'fantasy', 
    'nature', 
    'work_break', 
    'motivation', 
    'kids', 
    'music_instrumental',
    'emotional_support'
));
