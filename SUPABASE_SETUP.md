# Supabase Setup Guide

このガイドでは、Sticky-LiteアプリケーションでSupabaseを使用するための設定手順を説明します。

## 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com) にアクセスしてアカウントを作成
2. 新しいプロジェクトを作成

## 2. 認証設定

Supabaseダッシュボードで以下の設定を行います：

### メール認証の無効化（開発環境）

1. **Authentication** → **Providers** → **Email** を選択
2. **Confirm email** を **OFF** に設定（開発環境のみ推奨）
3. **Save** をクリック

### 認証設定の確認

1. **Authentication** → **Settings** → **Auth settings** を選択
2. 以下の設定を確認/変更：
   - **Enable email confirmations**: OFF（開発環境）
   - **Enable email change confirmations**: OFF（開発環境）
   - **Minimum password length**: 6（お好みで調整）

## 3. データベーステーブルの作成

SQL Editorで以下のスクリプトを実行：

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create boards table
CREATE TABLE IF NOT EXISTS public.boards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'My Board',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create stickies table
CREATE TABLE IF NOT EXISTS public.stickies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    x INTEGER NOT NULL DEFAULT 0,
    y INTEGER NOT NULL DEFAULT 0,
    text TEXT,
    rich_text TEXT,
    color TEXT NOT NULL DEFAULT 'yellow',
    size DECIMAL NOT NULL DEFAULT 1,
    font_size INTEGER NOT NULL DEFAULT 16,
    is_bold BOOLEAN NOT NULL DEFAULT false,
    is_italic BOOLEAN NOT NULL DEFAULT false,
    is_underline BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stickies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for boards
CREATE POLICY "Users can view their own boards" ON public.boards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own boards" ON public.boards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own boards" ON public.boards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own boards" ON public.boards
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for stickies
CREATE POLICY "Users can view their own stickies" ON public.stickies
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stickies" ON public.stickies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stickies" ON public.stickies
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stickies" ON public.stickies
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON public.boards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stickies_updated_at BEFORE UPDATE ON public.stickies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.stickies;
```

## 4. 環境変数の設定

`.env.local` ファイルに以下を追加：

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

これらの値は、Supabaseダッシュボードの **Settings** → **API** から取得できます。

## 5. トラブルシューティング

### 新規登録ができない場合

1. **メール認証が有効になっている可能性**
   - Supabaseダッシュボードで認証設定を確認
   - 開発環境では「Confirm email」をOFFに設定

2. **パスワードが短すぎる**
   - 最小パスワード長を確認（デフォルトは6文字）

3. **RLSポリシーの問題**
   - 上記のSQLスクリプトを実行してRLSポリシーを設定

4. **環境変数が正しく設定されていない**
   - `.env.local` ファイルを確認
   - ブラウザのコンソールでエラーを確認

### デバッグ方法

1. ブラウザの開発者ツールでネットワークタブを確認
2. Supabaseへのリクエストとレスポンスを確認
3. Supabaseダッシュボードの **Authentication** → **Users** でユーザーが作成されているか確認

## 6. データの同期とマージ

### ローカルデータとクラウドデータの管理

1. **ログイン時のデータマージ**
   - ローカルに付箋がある場合、確認ダイアログが表示されます
   - 「OK」を選択：ローカルの付箋をクラウドに追加
   - 「キャンセル」を選択：ローカルの付箋を破棄

2. **ログアウト時の注意**
   - ログアウトすると、クラウドの付箋にアクセスできなくなります
   - ローカルには保存されません
   - 再度ログインすることでクラウドの付箋に再アクセス可能

3. **複数デバイスでの利用**
   - 同じアカウントでログインすれば、リアルタイムで同期
   - 各デバイスのローカルデータは個別に管理
   - ログイン時にマージするか選択可能

## 7. 本番環境での推奨設定

本番環境では以下の設定を推奨します：

1. **メール認証を有効化**
2. **強力なパスワードポリシーを設定**
3. **レート制限を設定**
4. **適切なCORSポリシーを設定**
