-- Subscription Schema for Softale Premium
-- Run this migration to add subscription tracking to profiles

-- Add subscription columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_premium ON profiles(is_premium);

-- Comment for documentation
COMMENT ON COLUMN profiles.is_premium IS 'Whether the user has an active premium subscription';
COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe Customer ID for billing';
COMMENT ON COLUMN profiles.subscription_id IS 'Active Stripe Subscription ID';
COMMENT ON COLUMN profiles.subscription_status IS 'Current subscription status: active, canceled, past_due, etc.';
COMMENT ON COLUMN profiles.subscription_end_date IS 'When the current subscription period ends';
