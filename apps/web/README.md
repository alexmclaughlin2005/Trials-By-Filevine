# TrialForge AI - Web Application

Main web application for TrialForge AI, built with Next.js 14 and deployed to Vercel.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

```
apps/web/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authenticated routes
│   │   ├── dashboard/
│   │   ├── cases/
│   │   └── personas/
│   ├── (public)/            # Public routes
│   │   ├── login/
│   │   └── signup/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Landing page
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── sidebar.tsx
│   └── providers.tsx
├── lib/                     # Utilities
│   ├── api-client.ts       # API client
│   └── utils.ts            # Helpers
└── hooks/                   # Custom hooks
```

## Features Implemented

### ✅ Core Setup
- Next.js 14 with App Router
- TypeScript configuration
- Tailwind CSS with custom theme
- shadcn/ui components (Button)

### ✅ Layouts
- Landing page with hero and features
- Authenticated layout with sidebar
- Public layout for login/signup

### ✅ Pages
- **Landing Page** - Marketing page with CTA
- **Dashboard** - Overview with stats and recent cases
- **Cases** - Case list and management
- **Personas** - Persona library
- **Login/Signup** - Authentication placeholders

### ✅ Infrastructure
- API Client with error handling
- React Query setup for data fetching
- Responsive design
- Dark mode support (CSS variables ready)

## Development

```bash
# Start dev server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type check
npm run type-check
```

## Environment Variables

See `.env.local.example` for required variables:

- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_WS_URL` - WebSocket URL
- Auth0 credentials
- Feature flags

## Next Steps

### Authentication
1. Set up Auth0 application
2. Configure callback URLs
3. Implement auth middleware
4. Add protected route wrapper

### API Integration
1. Connect to API Gateway
2. Implement data fetching hooks
3. Add loading and error states
4. Handle authentication tokens

### Additional Pages
1. Case detail page with tabs
2. Jury panel management
3. Focus group creation
4. Trial mode interface
5. Settings page

### UI Enhancements
1. Add more shadcn/ui components
2. Implement toast notifications
3. Add loading skeletons
4. Create reusable forms

## Deployment

Deploys automatically to Vercel on push to `main`:

```bash
# Manual deploy
vercel deploy

# Production deploy
vercel deploy --prod
```

## Testing

```bash
# Run tests (when added)
npm test

# E2E tests with Playwright
npm run test:e2e
```

## Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [TanStack Query](https://tanstack.com/query)

## Support

For issues or questions, see the main project documentation or contact the frontend team.
