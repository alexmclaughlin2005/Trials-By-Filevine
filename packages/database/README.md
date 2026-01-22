# @juries/database

Database package containing Prisma schema, migrations, and database utilities.

## Overview

This package provides:
- Prisma schema definitions for all database models
- Database migrations
- Type-safe Prisma client
- Seed scripts for development data

## Technology

- **ORM:** Prisma 5.x
- **Database:** PostgreSQL 16
- **Extensions:** pgvector (for embeddings)

## Schema Organization

The schema is organized by domain:

- **Organizations & Users:** Multi-tenant organization structure
- **Cases:** Case management and metadata
- **Jury Panel:** Jurors and panel management
- **Personas:** Persona library and mappings
- **Research:** Research artifacts and provenance
- **Trial Sessions:** Audio recordings and transcripts
- **Focus Groups:** Simulation sessions and results
- **Audit:** Immutable audit log

## Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run generate

# Run migrations (development)
npm run migrate:dev

# Push schema without migrations
npm run db:push

# Seed database
npm run seed
```

## Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/trialforge"
```

## Key Models

### Multi-Tenancy
All models include `organization_id` for tenant isolation. Row-level security policies enforce data separation.

### Audit Fields
Standard audit columns on all entities:
- `created_at` - Creation timestamp
- `updated_at` - Last modified timestamp
- `created_by` - User ID who created
- `updated_by` - User ID who last modified

### Encryption
Juror PII fields (`first_name`, `last_name`) are encrypted at the application layer using tenant-specific keys.

## Usage

```typescript
import { prisma } from '@juries/database';

// Query with automatic tenant isolation
const cases = await prisma.case.findMany({
  where: {
    organization_id: orgId,
    status: 'active'
  }
});
```

## Migrations

```bash
# Create a new migration
npm run migrate:dev -- --name migration_name

# Deploy migrations (production)
npm run migrate:deploy

# Reset database (development only)
npm run migrate:reset
```

## Seeding

Seed script populates:
- System personas (pre-defined from research)
- Sample organization and users
- Example case with jurors
- Sample research artifacts

```bash
npm run seed
```

## Testing

```bash
npm test
```

## Notes

- Never commit `.env` files
- Use `.env.example` as template
- Always use transactions for multi-step operations
- Leverage Prisma's type safety for schema validation
