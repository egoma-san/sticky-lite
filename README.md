
# Sticky-Lite

> A minimalist sticky notes application where you can write, place, and dispose of digital sticky notes freely.

## 📑 Table of Contents

- [Overview](#-overview)
- [Quick Start](#-quick-start)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running Tests](#running-tests)
- [Features](#-features)
  - [Core Features](#core-features-mvp)
  - [Technical Features](#technical-features)
  - [Screenshots](#screenshots)
- [Development](#0-開発ポリシー)
  - [Development Policies](#0-開発ポリシー)
  - [Epic & Sprint Planning](#1-epic--スプリント計画)
  - [Task List](#2-タスク一覧markdown-チェックリスト)
  - [Test Setup](#3-テストツール設定)
  - [Directory Structure](#4-推奨ディレクトリ構成)
  - [Getting Started Guide](#5-day-1--着手ガイド)
- [License](#-license)
- [Contributing](#-contributing)
- [Acknowledgments](#-acknowledgments)

## 🌟 Overview

Sticky-Lite (付箋を書いて捨てるだけアプリ) is a lightweight PWA that recreates the simple joy of using physical sticky notes in a digital space. Click anywhere to create a note, write your thoughts, drag it around, and toss it away when done.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Zustand · PWA  
**Runtime:** **Docker** / Docker Compose  
**QA:** TDD（Jest + React-Testing-Library / Playwright）

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development without Docker)
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/sticky-lite.git
cd sticky-lite

# Start with Docker (recommended)
docker compose up

# OR start locally
pnpm install
pnpm dev
```

Visit http://localhost:3000 to start using Sticky-Lite!

### Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for instructions on deploying to Vercel with Supabase integration.

### Running Tests

```bash
# Run all tests in Docker
docker compose -f docker-compose.test.yml up --abort-on-container-exit

# OR run tests locally
pnpm test        # Unit tests
pnpm test:e2e    # E2E tests
```

## ✨ Features

### Core Features (MVP)

- **📝 Write Text** - Click anywhere on the board to create a sticky note and start typing
- **🎯 Free Positioning** - Place sticky notes anywhere on an infinite canvas
- **✋ Drag & Drop** - Move notes around by dragging them
- **🔍 Zoom & Pan** - Navigate the board with mouse wheel or pinch gestures
- **🗑️ Easy Disposal** - Drag notes to the trash zone to delete them
- **💾 Auto-save** - All notes are automatically saved to localStorage

### Technical Features

- **📱 PWA Support** - Install as a native app on any device
- **🐳 Containerized** - Consistent development environment with Docker
- **🧪 Test-Driven** - Comprehensive test coverage with Jest and Playwright
- **♿ Accessible** - Built with accessibility in mind
- **🚀 Fast & Lightweight** - Optimized for performance

### Screenshots

<details>
<summary>View Screenshots</summary>

![Main Board](docs/images/board-placeholder.png)
*Main board with sticky notes*

![Creating a Note](docs/images/create-note-placeholder.png)
*Click anywhere to create a new note*

![Trash Zone](docs/images/trash-zone-placeholder.png)
*Drag notes to trash to delete*

</details>

---

## 0. 開発ポリシー

| ポリシー | 内容 |
| --- | --- |
| **TDD** | ① **赤テスト**（失敗テスト）→ ② 実装 → ③ **緑テスト** → ④ リファクタ |
| **最小 MVP** | “**文字を書く**・貼る・**自由配置**・ズーム・捨てる” を必須機能とする |
| **コンテナ駆動** | `docker compose up` だけで動作。CI も同一イメージで実行 |
| **PWA ファースト** | Web/PWA で検証 → 必要なら Capacitor でストア配布 |
| **CI/CD** | GitHub Actions で lint / test / container build / Vercel deploy |

---

## 1. Epic & スプリント計画

| Epic | 目標 |
| :-- | --- |
| **E0 Container** | Dockerfile & Compose でローカル起動／テスト統一 |
| **E1 基盤** | プロジェクト初期化 & PWA 対応 |
| **E2 MVP** | 付箋 CRUD・自由配置・文字入力・ズーム・削除・永続化 |
| **E3 Quality** | TDD 強化・E2E テスト・パフォーマンス |
| **E4 配布** | CI/CD ➜ 生成イメージを Vercel 本番 & ストア build |

---

## 2. タスク一覧（Markdown チェックリスト）

### ✅ E0 Container ― “docker compose up” だけで動く

- [ ] **0-1 Dockerfile 作成（マルチステージ）**

  ```dockerfile
  # --- dependencies ---
  FROM node:20-alpine AS deps
  WORKDIR /app
  COPY package.json pnpm-lock.yaml* ./
  RUN npm i -g pnpm && pnpm install --frozen-lockfile

  # --- builder ---
  FROM node:20-alpine AS builder
  WORKDIR /app
  COPY --from=deps /app/node_modules ./node_modules
  COPY . .
  RUN pnpm run build

  # --- runner ---
  FROM node:20-alpine AS runner
  WORKDIR /app
  ENV NODE_ENV=production
  COPY --from=builder /app/.next ./.next
  COPY --from=builder /app/public ./public
  COPY package.json pnpm-lock.yaml* ./
  RUN npm i -g pnpm && pnpm install --prod --frozen-lockfile --ignore-scripts
  EXPOSE 3000
  CMD ["pnpm","start"]
  ```

- [ ] **0-2 .dockerignore**（`node_modules`, `.next`, `tests/e2e` など）

- [ ] **0-3 docker-compose.yml**

  ```yaml
  version: "3"
  services:
    web:
      build: .
      image: sticky-lite:dev
      ports: ["3000:3000"]
      volumes:
        - .:/app            # ホットリロード
        - /app/node_modules # 隠蔽
      environment:
        - NODE_ENV=development
      command: ["pnpm","dev","--turbo"]
  ```

- [ ] **0-4 docker-compose.test.yml**

  ```yaml
  services:
    sut:
      build: .
      command: ["pnpm","test","--runInBand"]
  ```

---

### ✅ E1 基盤

| # | タスク |
|:-:| --- |
| 1-1 | Next.js + Tailwind 初期化（`pnpm create next-app --ts --tailwind`） |
| 1-2 | ESLint / Prettier / Husky |
| 1-3 | PWA セットアップ（`next-pwa` または自前 Service Worker） |

---

### ✅ E2 MVP

| # | 機能 | 主なテスト (赤 → 緑) |
|:-:| --- | --- |
| 2-1 | **<Board> コンポーネント** | RTL: `data-testid="board"` が存在 |
| 2-2 | **Zustand ストア** | CRUD 単体テスト |
| 2-3 | **クリック位置で付箋生成** | Playwright: クリック座標 ＝ 付箋 `left/top` |
| 2-4 | **文字入力（textarea）** | 入力 → ストアに反映 |
| 2-5 | **ドラッグ移動 & ゴミ箱削除** | ドラッグで座標更新／削除確認 |
| 2-6 | **ピンチ／ホイールズーム & パン** | wheel + `ctrlKey` で `scale` 変化 |
| 2-7 | **localStorage 永続化** | Reload 後も位置・文字保持 |
| 2-8 | **アクセシビリティ調整** | Lighthouse A11Y ≥ 90 |

---

### ✅ E3 Quality

| # | タスク |
|:-:| --- |
| 3-1 | 単体テスト境界値／例外系 |
| 3-2 | E2E シナリオ “追加→入力→移動→削除→reload” |
| 3-3 | 1 000 枚付箋で 30 fps 以上 |

---

### ✅ E4 配布

| # | タスク |
|:-:| --- |
| 4-1 | GitHub Actions（lint → test → container build → Vercel deploy） |
| 4-2 | Capacitor ラップ & ストア build（任意） |

> **GitHub Actions 例**

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: {version: 9}
      - run: docker compose -f docker-compose.test.yml up --abort-on-container-exit
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

---

## 3. テストツール設定

```bash
# 単体テスト
pnpm add -D jest @testing-library/react @testing-library/jest-dom vitest

# E2E
pnpm add -D playwright @playwright/test
npx playwright install
```

```jsonc
// package.json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "test": "jest --runInBand",
  "test:e2e": "playwright test",
  "lint": "next lint"
}
```

---

## 4. 推奨ディレクトリ構成

```
app/
├─ components/
│   ├─ StickyNote.tsx
│   ├─ Board.tsx
│   └─ TrashZone.tsx
├─ store/
│   └─ useStickyStore.ts
├─ page.tsx
├─ layout.tsx
└─ globals.css
tests/
├─ unit/        # Jest / Vitest
└─ e2e/         # Playwright
Dockerfile
docker-compose.yml
docker-compose.test.yml
.dockerignore
public/
└─ icons/ manifest.json
```

---

## 5. Day 1 – 着手ガイド

```bash
# 1. リポジトリ作成 & clone
pnpm create next-app sticky-lite --ts --tailwind

# 2. Dockerfile / docker-compose.yml を追加
docker compose up   # http://localhost:3000 で確認

# 3. 初回赤テスト
docker compose -f docker-compose.test.yml run --rm sut  # 失敗を確認

# 4. __tests__/board.test.tsx を書く → Board 実装 → tests 緑

# 5. PR → GitHub Actions が緑 → Vercel Preview 自動デプロイ
```

---

### 🎯 ゴール

- `docker compose up` だけでローカル開発が開始  
- クリック位置に付箋生成 → 文字入力 → ドラッグ配置 → ズーム → ゴミ箱削除  
- リロードしても状態保持  
- 単体 & E2E テストを **Docker イメージ上** で実行し CI がパス  

---


## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate and follow the TDD approach outlined in the development policies.

---

## 🙏 Acknowledgments

- Inspired by the simplicity of physical sticky notes
- Built with love using modern web technologies

