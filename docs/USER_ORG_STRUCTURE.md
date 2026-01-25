# User & Organization Structure

## Overview

Trials by Filevine uses a **multi-tenant SaaS architecture** with strict organization-level data isolation. Every user belongs to exactly one organization, and all data is scoped to both the user and their organization.

## Data Model

### Organization

```prisma
model Organization {
  id               String   @id @default(uuid())
  name             String
  slug             String   @unique      // Used for routing/subdomains
  settings         Json?
  subscriptionTier String   @default("trial")  // trial | basic | pro | enterprise

  // Relations - owns all tenant data
  users               User[]
  cases               Case[]
  personas            Persona[]
  notifications       Notification[]
  chatConversations   ChatConversation[]  // (via userId)
  filevineConnections FilevineConnection[]
}
```

**Key Points:**
- Top-level tenant entity
- Unique slug for potential subdomain routing
- Subscription tiers control feature access
- Owns all user data through relations

### User

```prisma
model User {
  id             String   @id @default(uuid())
  organizationId String   @map("organization_id")  // Required foreign key
  email          String   @unique
  name           String
  passwordHash   String
  role           String   // admin | attorney | paralegal | consultant

  organization Organization @relation(fields: [organizationId], references: [id])
}
```

**Key Points:**
- Every user **must** belong to one organization
- Email is globally unique (across all organizations)
- Role-based access control (4 roles)
- Users cannot exist without an organization

## Roles & Permissions

The system has 4 built-in roles with different access levels:

| Role | Description | Typical Access |
|------|-------------|----------------|
| `admin` | Full organization access | All features, user management, billing |
| `attorney` | Case management | Create/manage cases, jurors, arguments |
| `paralegal` | Case support | Assist with cases, data entry |
| `consultant` | Research/analysis | View cases, personas, run simulations |

## Data Isolation Pattern

### Multi-Tenant Queries

Every database query follows this pattern for data isolation:

```typescript
const user = request.user as any; // { userId: string, organizationId: string }

await server.prisma.chatConversation.findMany({
  where: {
    userId: user.userId,              // User-level isolation
    organizationId: user.organizationId,  // Org-level isolation
  },
})
```

### Authentication Flow

1. **Login** → JWT token issued with `{ userId, organizationId, role }`
2. **Request** → `server.authenticate` middleware validates token
3. **Query** → All queries automatically scoped to `user.organizationId`
4. **Response** → Only data from user's organization returned

### Data Ownership Hierarchy

```
Organization (Tenant)
└── Users (belongs to one org)
    └── Personal Data
        ├── Chat Conversations (user + org scoped)
        ├── Notifications (user + org scoped)
        └── Created Resources (org scoped, tracked by userId)

Organization Data (shared by all users in org)
├── Cases
├── Jurors
├── Personas (can be org-specific or system-wide)
├── Focus Groups
└── Audit Logs
```

## Security Guarantees

1. **No Cross-Tenant Data Leakage**
   - All queries include `organizationId` filter
   - Database indexes on `organizationId` for performance
   - Prisma middleware could enforce this at ORM level

2. **User Isolation**
   - Some resources (like chat conversations) are user-specific
   - Others (like cases) are org-wide but tracked by creator

3. **Audit Trail**
   - All actions logged with `userId` and `organizationId`
   - Complete audit history per organization

## Example: Chat History Isolation

The chat conversation model demonstrates proper multi-tenant isolation:

```prisma
model ChatConversation {
  id             String   @id @default(uuid())
  userId         String   @map("user_id")         // User who owns this conversation
  organizationId String   @map("organization_id") // Org for isolation
  title          String?
  messages       ChatMessage[]

  @@index([userId])
  @@index([organizationId])
}
```

**Query Example:**
```typescript
// Get conversations - always scoped to both user and org
const conversations = await prisma.chatConversation.findMany({
  where: {
    userId: user.userId,           // Only my conversations
    organizationId: user.organizationId,  // Only from my org
  },
})
```

## Migration Considerations

If adding new features:

1. **Always include `organizationId`** on tenant-scoped models
2. **Add database indexes** on `organizationId` for query performance
3. **Include in queries** - never query without org scope
4. **Consider user vs org ownership** - is data personal or shared?
5. **Add to relations** - ensure Organization model has relation

## Future Enhancements

Potential improvements to the multi-tenant architecture:

- **Prisma Middleware** - Automatically inject `organizationId` filters
- **Row-Level Security** - PostgreSQL RLS for defense in depth
- **Separate Databases** - Large orgs could have dedicated DBs
- **Subdomain Routing** - `acme.trialforge.com` routes to Acme org
- **Cross-Org Sharing** - Opt-in sharing of personas/templates (with proper permissions)
