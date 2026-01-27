-- Profile comments: pre-match comments sent from feed (e.g. "Send Comment")
-- Recipient sees them in Likes tab; premium to see who commented + message.

CREATE TABLE IF NOT EXISTS profile_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_comments_receiver ON profile_comments(receiver_id);
CREATE INDEX IF NOT EXISTS idx_profile_comments_sender ON profile_comments(sender_id);
CREATE INDEX IF NOT EXISTS idx_profile_comments_created ON profile_comments(created_at DESC);

ALTER TABLE profile_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view received profile comments" ON profile_comments;
DROP POLICY IF EXISTS "Users can insert profile comments" ON profile_comments;

CREATE POLICY "Users can view received profile comments"
ON profile_comments FOR SELECT
TO authenticated
USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

CREATE POLICY "Users can insert profile comments"
ON profile_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);
