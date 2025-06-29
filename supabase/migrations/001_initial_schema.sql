-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ボードテーブル
CREATE TABLE IF NOT EXISTS boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 付箋テーブル
CREATE TABLE IF NOT EXISTS stickies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  text TEXT,
  rich_text TEXT,
  color VARCHAR(20) NOT NULL,
  size DECIMAL(3,2) DEFAULT 1,
  font_size INTEGER DEFAULT 16,
  is_bold BOOLEAN DEFAULT false,
  is_italic BOOLEAN DEFAULT false,
  is_underline BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ボードメンバーテーブル
CREATE TABLE IF NOT EXISTS board_members (
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (board_id, user_id)
);

-- インデックス
CREATE INDEX idx_stickies_board_id ON stickies(board_id);
CREATE INDEX idx_stickies_user_id ON stickies(user_id);
CREATE INDEX idx_boards_owner_id ON boards(owner_id);
CREATE INDEX idx_board_members_user_id ON board_members(user_id);

-- updated_at を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stickies_updated_at BEFORE UPDATE ON stickies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) を有効化
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE stickies ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;

-- ボードのRLSポリシー
-- 誰でも自分が所有するボードを見れる
CREATE POLICY "Users can view their own boards" ON boards
  FOR SELECT USING (auth.uid() = owner_id);

-- メンバーになっているボードも見れる
CREATE POLICY "Users can view boards they are members of" ON boards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = boards.id
      AND board_members.user_id = auth.uid()
    )
  );

-- 公開ボードは誰でも見れる
CREATE POLICY "Anyone can view public boards" ON boards
  FOR SELECT USING (is_public = true);

-- 自分のボードは作成・更新・削除できる
CREATE POLICY "Users can create boards" ON boards
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own boards" ON boards
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own boards" ON boards
  FOR DELETE USING (auth.uid() = owner_id);

-- 付箋のRLSポリシー
-- ボードのメンバーは付箋を見れる
CREATE POLICY "Board members can view stickies" ON stickies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = stickies.board_id
      AND board_members.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = stickies.board_id
      AND boards.owner_id = auth.uid()
    )
  );

-- エディター権限があれば付箋を作成できる
CREATE POLICY "Editors can create stickies" ON stickies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = stickies.board_id
      AND board_members.user_id = auth.uid()
      AND board_members.role = 'editor'
    ) OR
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = stickies.board_id
      AND boards.owner_id = auth.uid()
    )
  );

-- 自分が作成した付箋は更新・削除できる
CREATE POLICY "Users can update their own stickies" ON stickies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stickies" ON stickies
  FOR DELETE USING (auth.uid() = user_id);

-- ボードメンバーのRLSポリシー
-- ボードのメンバーは他のメンバーを見れる
CREATE POLICY "Board members can view other members" ON board_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM board_members AS bm
      WHERE bm.board_id = board_members.board_id
      AND bm.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_members.board_id
      AND boards.owner_id = auth.uid()
    )
  );

-- ボードオーナーはメンバーを追加・削除できる
CREATE POLICY "Board owners can manage members" ON board_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_members.board_id
      AND boards.owner_id = auth.uid()
    )
  );

-- デフォルトボードを作成する関数
CREATE OR REPLACE FUNCTION create_default_board()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO boards (name, owner_id)
  VALUES ('My Board', NEW.id);
  
  INSERT INTO board_members (board_id, user_id, role)
  SELECT id, NEW.id, 'editor' FROM boards WHERE owner_id = NEW.id LIMIT 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 新規ユーザー登録時にデフォルトボードを作成
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_board();