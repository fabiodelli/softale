-- MASTER RESET SCRIPT for Factory V3 "Clean Slate"
-- ⚠️ WARNING: THIS WILL DELETE ALL EXISTING STORIES IN THE DATABASE ⚠️

-- 1. Wipe the Slate (CASCADE also clears listening_progress, favorites, etc.)
TRUNCATE TABLE stories CASCADE;

-- 2. Seed ALL Legacy Ambients (10 files from audio/ambient/)
INSERT INTO stories (id, title, description, category, duration, audio_url, cover_url, is_premium, is_published, is_loop)
VALUES 
    (gen_random_uuid(), 'Stock: Brown Noise', 'Deep brown noise for focus and sleep', 'sleep', 120, 
     'https://xdotggbipohsrwvmqqlm.supabase.co/storage/v1/object/public/audio/ambient/brownnoise.mp3', '', false, true, true),
    
    (gen_random_uuid(), 'Stock: Fire', 'Crackling fireplace ambience', 'fantasy', 120, 
     'https://xdotggbipohsrwvmqqlm.supabase.co/storage/v1/object/public/audio/ambient/fire.mp3', '', false, true, true),
    
    (gen_random_uuid(), 'Stock: Forest', 'Peaceful forest with birds and wind', 'nature', 120, 
     'https://xdotggbipohsrwvmqqlm.supabase.co/storage/v1/object/public/audio/ambient/forest.mp3', '', false, true, true),
    
    (gen_random_uuid(), 'Stock: Night', 'Crickets and nocturnal sounds', 'nature', 120, 
     'https://xdotggbipohsrwvmqqlm.supabase.co/storage/v1/object/public/audio/ambient/night.mp3', '', false, true, true),
    
    (gen_random_uuid(), 'Stock: Ocean', 'Gentle ocean waves', 'nature', 120, 
     'https://xdotggbipohsrwvmqqlm.supabase.co/storage/v1/object/public/audio/ambient/ocean.mp3', '', false, true, true),
    
    (gen_random_uuid(), 'Stock: Rain', 'Heavy rain ambience', 'sleep', 120, 
     'https://xdotggbipohsrwvmqqlm.supabase.co/storage/v1/object/public/audio/ambient/rain.mp3', '', false, true, true),
    
    (gen_random_uuid(), 'Stock: River', 'Flowing river and stream sounds', 'nature', 120, 
     'https://xdotggbipohsrwvmqqlm.supabase.co/storage/v1/object/public/audio/ambient/river.mp3', '', false, true, true),
    
    (gen_random_uuid(), 'Stock: Thunder', 'Distant thunder and storm', 'sleep', 120, 
     'https://xdotggbipohsrwvmqqlm.supabase.co/storage/v1/object/public/audio/ambient/thunder.mp3', '', false, true, true),
    
    (gen_random_uuid(), 'Stock: White Noise', 'Pure white noise for focus', 'meditation', 120, 
     'https://xdotggbipohsrwvmqqlm.supabase.co/storage/v1/object/public/audio/ambient/white-noise.mp3', '', false, true, true),
    
    (gen_random_uuid(), 'Stock: Wind', 'High altitude wind', 'nature', 120, 
     'https://xdotggbipohsrwvmqqlm.supabase.co/storage/v1/object/public/audio/ambient/wind.mp3', '', false, true, true);

