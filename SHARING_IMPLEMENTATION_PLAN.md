# 付箋共有機能の実装計画

## 概要
Firebase を使用して、ログインユーザー間で付箋を共有できる機能を実装します。

## 実装ステップ

### 1. Firebase プロジェクトのセットアップ
```bash
npm install firebase
```

### 2. データ構造の設計
```typescript
// Firestore のデータ構造
interface UserDocument {
  email: string
  createdAt: Date
}

interface StickyDocument {
  id: string
  userId: string
  x: number
  y: number
  text: string
  richText?: string
  color: StickyColor
  size?: number
  fontSize?: number
  isBold?: boolean
  isItalic?: boolean
  isUnderline?: boolean
  createdAt: Date
  updatedAt: Date
}

interface SharedBoard {
  id: string
  ownerId: string
  name: string
  members: string[] // ユーザーIDの配列
  createdAt: Date
}
```

### 3. 機能要件

#### 基本機能
1. **個人ボード**: 各ユーザーが持つプライベートな付箋ボード
2. **共有ボード**: 複数ユーザーで共有できるボード
3. **リアルタイム同期**: 変更が即座に反映される

#### 共有機能
1. **共有リンク生成**: ボードへの招待リンクを生成
2. **メンバー管理**: 共有メンバーの追加・削除
3. **権限管理**: 閲覧のみ/編集可能の設定

### 4. UI/UX の変更点

1. **ボード切り替え**
   - 個人ボード/共有ボードの切り替えタブ
   - ボード一覧の表示

2. **共有設定画面**
   - 共有ボタンの追加
   - メンバー一覧の表示
   - 招待リンクの生成

3. **リアルタイムインジケーター**
   - 他のユーザーが編集中の付箋を表示
   - オンラインユーザーの表示

### 5. 実装の優先順位

1. **Phase 1**: Firebase 統合と基本的なデータ同期
   - Firebase 設定
   - 既存のローカルストレージからFirestoreへの移行
   - 基本的な読み書き

2. **Phase 2**: 共有機能の実装
   - 共有ボードの作成
   - メンバー招待機能
   - リアルタイム同期

3. **Phase 3**: UI/UXの改善
   - ボード管理画面
   - 共有設定画面
   - リアルタイムインジケーター

### 6. セキュリティルール

```javascript
// Firestore セキュリティルール
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザーは自分のデータのみアクセス可能
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 付箋は所有者またはボードメンバーのみアクセス可能
    match /stickies/{stickyId} {
      allow read, write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         request.auth.uid in resource.data.boardMembers);
    }
  }
}
```

## 実装開始の準備

1. Firebase コンソールでプロジェクトを作成
2. Firestore Database を有効化
3. Authentication を有効化（Email/Password）
4. Firebase SDK の設定情報を取得

この計画に従って実装を進めることで、ユーザー間で付箋を共有できるようになります。