-- Enable Realtime for Messages Table
-- Run this SQL in your Supabase SQL Editor to enable real-time messaging

-- Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Verify Realtime is enabled (optional check)
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

