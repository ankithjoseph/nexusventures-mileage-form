# Copilot Instructions for Nexus Ventures Forms

## Project Overview
A React + TypeScript business forms application (mileage logbooks, expense reports, SEPA mandates, etc.) for Irish employees/directors. Features PocketBase authentication, PDF generation, and email delivery via Resend.

## Architecture

### Frontend (Vite + React + TypeScript)
- **Entry**: [src/main.tsx](src/main.tsx) → [src/App.tsx](src/App.tsx) (route definitions)
- **Pages**: `src/pages/` - Each form type is a separate page component
- **UI Components**: `src/components/ui/` - shadcn/ui components (DO NOT manually edit, use `npx shadcn@latest add <component>`)
- **Custom Components**: `src/components/` - Form sections, layouts, reusable pieces

### Backend (Express server.js)
- Single `server.js` handles: email sending via Resend, PocketBase record creation, file uploads, reCAPTCHA verification
- API routes proxied via Vite in development (`/api` → `localhost:3001`)

### Authentication Flow
- [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx) manages PocketBase auth state
- [src/components/RequireAuth.tsx](src/components/RequireAuth.tsx) protects routes, redirects to `/login?returnTo=...`
- Session tokens stored in sessionStorage (non-persistent) or PocketBase authStore (persistent)

### Data Flow for Form Submission
1. Page component validates form data
2. [src/utils/pdfGenerator.ts](src/utils/pdfGenerator.ts) creates PDF using jsPDF
3. POST to `/api/send-email` with form data + base64 PDF
4. Server persists to PocketBase and sends email via Resend

## Development Commands
```bash
npm run dev       # Frontend only (port 8080) - proxies /api to backend
npm run server    # Backend only (port 3001) - requires running separately
npm run build     # Production build
npm run lint      # ESLint check
```

## Key Conventions

### i18n/Translations
- Use `useLanguage()` hook from [src/contexts/LanguageContext.tsx](src/contexts/LanguageContext.tsx)
- Call `t('key.name')` for translated strings
- Add new keys to `translations` object in LanguageContext (both `en` and `es`)

### Adding New Forms/Pages
1. Create page in `src/pages/NewForm.tsx`
2. Add route metadata to [src/routeMeta.ts](src/routeMeta.ts)
3. Add route in [src/App.tsx](src/App.tsx) wrapped with `RequireAuth` + `PageMeta`
4. Add server-side meta in `ROUTE_META` object in `server.js` for SSR

### Type Definitions
- Form data interfaces go in [src/types/](src/types/) (e.g., `logbook.ts` for mileage data)
- Include factory functions like `createEmptyLogbook()` for initial state

### PDF Generation Pattern
```typescript
// In pdfGenerator.ts - extend jsPDFWithAutoTable interface
const doc: jsPDFWithAutoTable = new jsPDF({ compress: true });
autoTable(doc, { ... }); // Use jspdf-autotable for tables
yPos = doc.lastAutoTable?.finalY ?? yPos + 10; // Track Y position
```

### Form Components Pattern
- Use controlled components with `useState` for form data
- Validation in `handleSubmit` before PDF generation
- Show loading state with `isSubmitting` flag
- Display success via `ThankYouDialog` component

## Environment Variables
```env
VITE_POCKETBASE_URL=http://127.0.0.1:8090   # Frontend PocketBase URL
POCKETBASE_URL=...                           # Server-side PocketBase URL
RESEND_API_KEY=re_...                        # Email service API key
```

## PocketBase Collections
- See [docs/pocketbase-expense_reports.md](docs/pocketbase-expense_reports.md) for schema
- Field mapping: Frontend uses Spanish field names → Server maps to English for PocketBase
- User relations require auth token in request header

## Styling
- Tailwind CSS with shadcn/ui theming via CSS variables
- Colors defined in [src/index.css](src/index.css) using HSL variables
- Component aliases configured in [components.json](components.json): `@/components/ui/...`
