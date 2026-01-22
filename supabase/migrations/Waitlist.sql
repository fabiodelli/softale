-- Add waitlist_joined_at column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS waitlist_joined_at timestamp with time zone;
