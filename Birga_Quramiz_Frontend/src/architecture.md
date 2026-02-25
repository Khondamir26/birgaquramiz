# Frontend Architecture - Birga Quramiz

## Stack
- Next.js App Router
- React + TypeScript
- TailwindCSS + shadcn/ui
- Zustand for local app state
- Axios API layer

## Page Map
- `/` Landing page
- `/catalog` Marketplace page
- `/catalog/[id]` Product detail page
- `/builders` Builders catalog
- `/builders/[id]` Builder profile
- `/equipment` Equipment rental
- `/cart` Cart and quick checkout
- `/checkout` Detailed checkout
- `/ai-chat` AI consultant
- `/profile` User dashboard/profile
- `/seller/dashboard` Seller Panel overview
- `/seller/products` Seller product management
- `/seller/orders` Seller order management
- `/admin` Admin Panel overview
- `/admin/products` Product moderation
- `/admin/users` User management
- `/admin/orders` Order supervision

## Recommended Folder Strategy
- `src/app/*` route-level pages and layouts
- `src/components/layout/*` global shell: navbar/footer
- `src/components/ui/*` reusable shadcn primitives
- `src/components/product/*` domain components for marketplace
- `src/components/builder/*` domain components for builders
- `src/lib/api/*` API modules grouped by domain (`auth`, `products`, `orders`, `seller`)
- `src/store/*` Zustand stores (`authStore`, `cartStore`)
- `src/hooks/*` shared data/auth hooks (`useFetch`, `useAuth`)
- `src/types/*` domain and shared TypeScript types

## API Integration Structure
- `src/lib/axios.ts`: base axios instance + auth header handling
- `src/lib/api/client.ts`: shared low-level request wrapper
- Domain APIs:
  - `auth.ts`: login/register/profile
  - `products.ts`: list/create/moderation
  - `orders.ts`: checkout and order lifecycle
  - `seller.ts`: seller registration + analytics

## State Management Structure
- Global auth state in `authStore`
  - token, user profile, role-sensitive UI decisions
- Global cart state in `cartStore`
  - add/remove/update quantity, total calculations
- Server data should stay in API hooks (`useFetch`) and be refreshed after actions

## UX Principles Applied
- Light, high-trust visual language
- Deep blue primary + red accent palette
- Medium/2xl radius and soft card shadows
- Clear page hierarchy and modular sections
- Mobile-friendly responsive behavior on all core pages
