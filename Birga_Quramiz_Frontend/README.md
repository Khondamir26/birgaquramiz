# Birga Quramiz Frontend

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create env file:

```bash
cp .env.example .env
```

3. Start dev server:

```bash
pnpm dev
```

Frontend runs on `http://localhost:3000`.

## Features

- Multilingual UI via `next-intl` (`en`, `ru`, `uz`)
- Guest checkout (no registration required)
- Role-based UX for user/seller/admin
- Seller product image upload from local files
