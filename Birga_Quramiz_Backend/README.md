# Birga Quramiz Backend

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create env file:

```bash
cp .env.example .env
```

3. Run Prisma migrations:

```bash
pnpm prisma migrate deploy
```

4. Start dev server:

```bash
pnpm start:dev
```

Backend runs on `http://localhost:5000`.

## Admin Bootstrap

Create or update an admin user:

```bash
$env:ADMIN_PHONE='+998900000000'
$env:ADMIN_PASSWORD='admin12345'
$env:ADMIN_NAME='Main Admin'
pnpm run seed:admin
```

## Image Uploads

Seller product images are stored under:

- `uploads/products`

And served from:

- `http://localhost:5000/uploads/products/<file>`
