# TrialForge AI - Web Application

Main web application for TrialForge AI, built with Next.js 14 and deployed to Vercel.

## Overview

The web application provides:
- Case management and organization
- Juror research and persona mapping
- Focus group simulations
- Trial preparation tools
- Real-time collaboration features
- Administrative controls

## Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI + shadcn/ui
- **State Management:** React Context + Zustand
- **Forms:** React Hook Form + Zod
- **Real-time:** Socket.io-client
- **API Client:** TanStack Query (React Query)
- **Auth:** Auth0 React SDK

## Project Structure

```
apps/web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Auth-protected routes
│   │   │   ├── dashboard/
│   │   │   ├── cases/
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx          # Case overview
│   │   │   │       ├── facts/
│   │   │   │       ├── arguments/
│   │   │   │       ├── jury-panel/
│   │   │   │       ├── voir-dire/
│   │   │   │       ├── focus-groups/
│   │   │   │       └── trial-mode/
│   │   │   ├── personas/
│   │   │   └── settings/
│   │   ├── (public)/          # Public routes
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── api/               # API routes (if needed)
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── cases/
│   │   ├── jurors/
│   │   ├── personas/
│   │   ├── focus-groups/
│   │   ├── trial-mode/
│   │   └── shared/
│   │
│   ├── lib/                  # Utilities and helpers
│   │   ├── api-client.ts    # API client setup
│   │   ├── auth.ts          # Auth utilities
│   │   ├── utils.ts         # General utilities
│   │   └── websocket.ts     # WebSocket client
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── use-cases.ts
│   │   ├── use-jurors.ts
│   │   ├── use-personas.ts
│   │   └── use-websocket.ts
│   │
│   ├── types/               # TypeScript types
│   │   ├── case.ts
│   │   ├── juror.ts
│   │   ├── persona.ts
│   │   └── api.ts
│   │
│   └── styles/
│       └── globals.css
│
├── public/                  # Static assets
│   ├── images/
│   └── fonts/
│
├── .env.local              # Local environment variables
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Environment Variables

```env
# API
NEXT_PUBLIC_API_URL=https://api.trialforge.ai
NEXT_PUBLIC_WS_URL=wss://api.trialforge.ai

# Auth0
NEXT_PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=...
NEXT_PUBLIC_AUTH0_AUDIENCE=https://api.trialforge.ai
AUTH0_SECRET=...

# Feature Flags
NEXT_PUBLIC_ENABLE_TRIAL_MODE=true
NEXT_PUBLIC_ENABLE_FOCUS_GROUPS=true

# Analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY=...
NEXT_PUBLIC_SENTRY_DSN=...
```

## Key Features

### 1. Case Workspace

Central hub for managing trial preparation:
- Case facts and timeline
- Arguments library with versioning
- Witness list and outlines
- Quick access to jury panel, focus groups, trial sessions

### 2. Jury Panel Management

Comprehensive juror research and analysis:
- Import jury list (CSV or manual entry)
- Automated research initiation
- Match confirmation workflow
- Persona mapping with AI suggestions
- Strike/keep priority tracking
- Real-time status updates

### 3. Persona Library

Reusable behavioral persona system:
- Browse system and custom personas
- View persona attributes and signals
- Create new personas
- Map personas to jurors
- View persona distribution across panel

### 4. Focus Group Simulations

Test arguments against simulated jury panels:
- Configure panel (generic, case-matched, custom)
- Run simulations with AI-powered personas
- View per-persona reactions and concerns
- Get weakness reports and recommendations
- A/B test different argument versions

### 5. Voir Dire Preparation

Strategic question generation and planning:
- AI-generated questions based on case facts
- Target specific personas
- Follow-up question trees
- Track responses during voir dire
- Real-time persona classification updates

### 6. Real-time Collaboration

Multi-user features for team coordination:
- User presence indicators
- Shared cursor tracking (focus groups)
- Live simulation results broadcast
- Activity notifications
- Conflict-free collaborative editing

## UI Components

Using shadcn/ui for consistency:
- Button, Input, Select, Checkbox, Radio
- Dialog, Sheet, Popover, Tooltip
- Table, Card, Tabs, Accordion
- Command palette for quick actions
- Toast notifications

## State Management

### React Query for Server State
- Caching API responses
- Automatic background refetching
- Optimistic updates
- Error handling and retry logic

### Zustand for Client State
- User preferences
- UI state (sidebar, modals)
- Selected items
- Filters and search

### Context for Auth & Organization
- Current user
- Organization settings
- Permissions and roles

## Routing Structure

```
/dashboard                    - Dashboard overview
/cases                       - Cases list
/cases/[id]                  - Case overview
/cases/[id]/facts            - Case facts & evidence
/cases/[id]/arguments        - Arguments library
/cases/[id]/jury-panel       - Jury panel management
/cases/[id]/voir-dire        - Voir dire preparation
/cases/[id]/focus-groups     - Focus group simulations
/cases/[id]/trial-mode       - Trial support (links to PWA)
/personas                    - Persona library
/personas/[id]               - Persona details
/settings                    - Organization settings
/settings/users              - User management
/settings/integrations       - External integrations
```

## API Integration

Using TanStack Query for data fetching:

```typescript
// Example: Fetch cases
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useCases() {
  return useQuery({
    queryKey: ['cases'],
    queryFn: () => apiClient.get('/api/v1/cases'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Example: Create case with optimistic update
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCaseInput) =>
      apiClient.post('/api/v1/cases', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}
```

## WebSocket Integration

Real-time updates using Socket.io:

```typescript
// Example: Subscribe to case updates
import { useWebSocket } from '@/hooks/use-websocket';

export function CaseWorkspace({ caseId }: { caseId: string }) {
  const { subscribe, unsubscribe } = useWebSocket();

  useEffect(() => {
    const channel = `case:${caseId}`;

    subscribe(channel, 'research:complete', (data) => {
      // Handle research completion
      queryClient.invalidateQueries(['juror', data.jurorId]);
    });

    return () => unsubscribe(channel);
  }, [caseId]);

  // ...
}
```

## Authentication Flow

Using Auth0 for authentication:

1. User clicks "Login"
2. Redirected to Auth0 Universal Login
3. Auth0 returns with authorization code
4. Exchange code for JWT access token
5. Store token in secure httpOnly cookie
6. Include token in API requests
7. Refresh token before expiry

Protected routes check authentication status:

```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: ['/dashboard/:path*', '/cases/:path*'],
};
```

## Styling

Tailwind CSS with custom configuration:

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        brand: { /* custom brand colors */ },
        sidebar: { /* sidebar colors */ },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Lint
npm run lint

# Type check
npm run type-check
```

## Testing

```bash
# Unit tests (Jest + React Testing Library)
npm run test:unit

# E2E tests (Playwright)
npm run test:e2e

# Component tests (Storybook)
npm run storybook
```

## Deployment

Deployed to Vercel with automatic deployments:

1. Push to `main` branch
2. Vercel builds and deploys automatically
3. Preview deployments for pull requests
4. Environment variables configured in Vercel dashboard

```bash
# Deploy manually
vercel deploy

# Deploy to production
vercel deploy --prod
```

## Performance Optimization

- **Code Splitting:** Automatic route-based code splitting
- **Image Optimization:** Next.js Image component with WebP
- **Font Optimization:** Self-hosted fonts with font-display: swap
- **Bundle Analysis:** Regular bundle size monitoring
- **Lazy Loading:** Lazy load heavy components (charts, editors)
- **React Server Components:** Use RSC where possible to reduce client bundle

## Accessibility

- Semantic HTML throughout
- ARIA labels and roles where needed
- Keyboard navigation support
- Focus management for modals and dialogs
- Screen reader tested
- WCAG 2.1 AA compliance target

## Security

- Input sanitization on all forms
- XSS prevention via React's built-in escaping
- CSRF protection
- Secure cookie settings (httpOnly, secure, sameSite)
- Content Security Policy headers
- Subresource Integrity for external scripts

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile: iOS Safari 14+, Chrome Android 90+

## Support

For issues or questions, see the main project documentation or contact the frontend team.
