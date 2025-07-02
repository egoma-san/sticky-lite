# Sticky-Lite セットアップガイド

## 環境変数の設定

ログイン機能を使用するには、Supabaseの設定が必要です。

### 1. .env.localファイルの作成

プロジェクトのルートディレクトリに`.env.local`ファイルを作成します：

```bash
cp .env.local.example .env.local
```

### 2. Supabaseの認証情報を設定

`.env.local`ファイルを編集し、Supabaseのプロジェクト情報を入力します：

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセス
2. 新しいプロジェクトを作成
3. プロジェクトの設定から以下を取得：
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon/Public Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. 開発サーバーの再起動

環境変数を設定した後は、開発サーバーを再起動してください：

```bash
pnpm dev
```

## トラブルシューティング

### ログインできない場合

1. 環境変数が正しく設定されているか確認
2. `.env.local`ファイルが存在するか確認
3. 開発サーバーを再起動
4. ブラウザのコンソールでエラーを確認

### 本番環境へのデプロイ

本番環境では、ホスティングサービスの環境変数設定画面で同じ変数を設定してください。