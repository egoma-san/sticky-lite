-- Create snapshots table
CREATE TABLE IF NOT EXISTS snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  snapshot_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add RLS policies
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;

-- Users can only see their own snapshots
CREATE POLICY "Users can view own snapshots" ON snapshots
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create snapshots for their boards
CREATE POLICY "Users can create snapshots" ON snapshots
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM boards 
      WHERE boards.id = board_id 
      AND boards.user_id = auth.uid()
    )
  );

-- Users can update their own snapshots
CREATE POLICY "Users can update own snapshots" ON snapshots
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own snapshots
CREATE POLICY "Users can delete own snapshots" ON snapshots
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_snapshots_user_board ON snapshots(user_id, board_id);

-- Add constraint to limit snapshots per board
CREATE OR REPLACE FUNCTION check_snapshot_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already has 5 snapshots for this board
  IF (SELECT COUNT(*) FROM snapshots 
      WHERE user_id = NEW.user_id 
      AND board_id = NEW.board_id) >= 5 THEN
    RAISE EXCEPTION 'Maximum of 5 snapshots per board allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_snapshot_limit
  BEFORE INSERT ON snapshots
  FOR EACH ROW
  EXECUTE FUNCTION check_snapshot_limit();

-- Add updated_at trigger
CREATE TRIGGER update_snapshots_updated_at
  BEFORE UPDATE ON snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();