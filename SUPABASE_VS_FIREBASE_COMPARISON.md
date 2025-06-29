# Supabase vs Firebase 比較

## 概要比較

| 項目 | Supabase | Firebase |
|------|----------|----------|
| **データベース** | PostgreSQL (リレーショナル) | Firestore (NoSQL) |
| **オープンソース** | ✅ 完全オープンソース | ❌ プロプライエタリ |
| **料金体系** | 明確で予測可能 | 使用量に応じて変動 |
| **無料枠** | 2プロジェクト、500MB DB | 1GB、50K読み取り/日 |
| **リアルタイム** | ✅ PostgreSQL の変更を監視 | ✅ ネイティブサポート |
| **セルフホスト** | ✅ 可能 | ❌ 不可 |
| **ベンダーロックイン** | なし（PostgreSQL標準） | あり（Google依存） |

## Supabase の利点

### 1. **PostgreSQL の強力な機能**
- SQLクエリが使える
- 複雑なリレーションが簡単
- Row Level Security (RLS) で細かい権限制御
- トランザクションサポート

### 2. **開発者体験**
- TypeScript の型自動生成
- SQL エディタ内蔵
- データベースマイグレーション管理
- REST API と GraphQL が自動生成

### 3. **コスト面**
- 料金が明確で予測可能
- セルフホストで完全無料も可能
- スケール時のコストが抑えやすい

### 4. **将来性**
- オープンソースなので安心
- 他のPostgreSQLサービスへの移行が容易

## 付箋アプリでの Supabase 実装案

### データベース設計

```sql
-- ユーザーテーブル（Supabase Auth が自動作成）
-- auth.users

-- 付箋テーブル
CREATE TABLE stickies (
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

-- ボードテーブル
CREATE TABLE boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ボードメンバーテーブル
CREATE TABLE board_members (
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'viewer', -- 'viewer' or 'editor'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (board_id, user_id)
);

-- RLS (Row Level Security) ポリシー
ALTER TABLE stickies ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;

-- 付箋のポリシー
CREATE POLICY "Users can view stickies in their boards" ON stickies
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = stickies.board_id
      AND board_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create stickies in their boards" ON stickies
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM board_members
      WHERE board_members.board_id = stickies.board_id
      AND board_members.user_id = auth.uid()
      AND board_members.role = 'editor'
    )
  );
```

### 実装の利点

1. **型安全性**
```typescript
// Supabase CLI で型を自動生成
supabase gen types typescript --project-id your-project > types/supabase.ts
```

2. **リアルタイム同期**
```typescript
// リアルタイムで付箋の変更を監視
const channel = supabase
  .channel('board-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'stickies', filter: `board_id=eq.${boardId}` },
    (payload) => {
      // 付箋の追加/更新/削除を処理
    }
  )
  .subscribe()
```

3. **簡単な共有機能**
```typescript
// ボードにメンバーを追加
await supabase
  .from('board_members')
  .insert({ board_id: boardId, user_id: invitedUserId, role: 'editor' })
```

## 結論

**Supabase を推奨する理由：**

1. ✅ **オープンソース** - ベンダーロックインなし
2. ✅ **PostgreSQL** - 将来的な拡張性が高い
3. ✅ **型安全** - TypeScript との相性が良い
4. ✅ **コスト予測可能** - 使用量による急激な料金上昇なし
5. ✅ **セルフホスト可能** - 必要に応じて自社サーバーへ移行可能

付箋アプリのような共有機能を持つアプリケーションには、Supabase の方が適していると考えられます。