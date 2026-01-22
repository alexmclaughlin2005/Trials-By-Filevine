# Authentication Setup Complete!

## ✅ What's Been Implemented

### 1. Password Hashing with Bcrypt
- ✅ Added `bcryptjs` to api-gateway and database packages
- ✅ Login endpoint now uses `bcrypt.compare()` for secure password verification
- ✅ Signup endpoint now uses `bcrypt.hash()` with 10 salt rounds
- ✅ Removed insecure plaintext password comparison

### 2. Database Seed Script Updated
- ✅ Seed script now creates users with properly hashed passwords
- ✅ Two test users ready to use

---

## 🔐 Test User Credentials

You can now log in with these credentials:

### Attorney Account
- **Email:** `attorney@example.com`
- **Password:** `password123`
- **Role:** Attorney
- **Organization:** Sample Law Firm

### Paralegal Account
- **Email:** `paralegal@example.com`
- **Password:** `password123`
- **Role:** Paralegal
- **Organization:** Sample Law Firm

---

## 🚀 Next Steps to Complete Setup

### Step 1: Seed the Railway Production Database

You need to run the seed script on your Railway database. There are two methods:

#### Method A: Using Railway CLI (Recommended)

```bash
# Install Railway CLI if you haven't
npm i -g @railway/cli

# Login to Railway
railway login

# Link to your project (if not already linked)
railway link

# Set the DATABASE_URL environment variable temporarily
railway run --service api-gateway npm run db:seed
```

#### Method B: Using Railway Run Command

```bash
# From your project root
cd packages/database

# Run seed against production database
railway run --service api-gateway tsx prisma/seed.ts
```

#### Method C: Manual SQL (Quick but not recommended)

If you can't use the Railway CLI, you can manually insert users via Railway's PostgreSQL dashboard:

1. Go to Railway Dashboard → Your PostgreSQL service → Data tab
2. Run this SQL (password is "password123" hashed):

```sql
-- Create organization
INSERT INTO "Organization" (id, name, slug, "subscriptionTier", settings, "createdAt", "updatedAt")
VALUES (
  'org-sample',
  'Sample Law Firm',
  'sample-law-firm',
  'pro',
  '{"retentionDays": 365, "enabledFeatures": ["research", "focus_groups", "trial_mode"]}'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- Create attorney user (password: password123)
INSERT INTO "User" (
  id, email, name, role, "organizationId", "passwordHash",
  "authProviderId", "createdAt", "updatedAt"
)
VALUES (
  'user-attorney',
  'attorney@example.com',
  'John Attorney',
  'attorney',
  'org-sample',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'auth0|sample-attorney',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Create paralegal user (password: password123)
INSERT INTO "User" (
  id, email, name, role, "organizationId", "passwordHash",
  "authProviderId", "createdAt", "updatedAt"
)
VALUES (
  'user-paralegal',
  'paralegal@example.com',
  'Sarah Paralegal',
  'paralegal',
  'org-sample',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'auth0|sample-paralegal',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;
```

### Step 2: Test Login on Your Local Frontend

```bash
# Start your local frontend
cd apps/web
npm run dev

# Open http://localhost:3000
# Click "Login"
# Use: attorney@example.com / password123
```

### Step 3: Test Login on Vercel Production

1. Go to your Vercel app URL
2. Click "Login"
3. Enter: `attorney@example.com` / `password123`
4. Should successfully log in and redirect to dashboard

---

## 🧪 Testing the Authentication

### Test Login API Directly

```bash
# Test against your Railway API
curl -X POST https://trialforgeapi-gateway-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "attorney@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "email": "attorney@example.com",
    "name": "John Attorney",
    "role": "attorney",
    "organization": {
      "id": "org-id",
      "name": "Sample Law Firm"
    }
  }
}
```

### Test Authenticated API Call

```bash
# Use the token from above
curl https://trialforgeapi-gateway-production.up.railway.app/api/cases \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "cases": [
    {
      "id": "...",
      "name": "Johnson v. TechCorp Industries",
      "caseNumber": "2024-CV-12345",
      ...
    }
  ]
}
```

---

## 📝 What the Seed Script Creates

When you run the seed script, it creates:

### 1 Organization
- **Name:** Sample Law Firm
- **Subscription:** Pro tier
- **Features:** Research, Focus Groups, Trial Mode enabled

### 2 Users
- John Attorney (attorney@example.com)
- Sarah Paralegal (paralegal@example.com)

### 3 System Personas
- Tech Pragmatist
- Community Caretaker
- Business Realist

### 1 Sample Case
- **Name:** Johnson v. TechCorp Industries
- **Type:** Civil case
- **Plaintiff:** Robert Johnson
- **Defendant:** TechCorp Industries, Inc.
- **Issue:** Age discrimination wrongful termination

### 1 Jury Panel with 5 Jurors
- Michael Chen (Software Engineer, 42)
- Jennifer Martinez (Teacher, 38)
- David Thompson (Business Consultant, 55)
- Emily Rodriguez (Social Worker, 29)
- Robert Williams (Retired Engineer, 61)

This gives you a fully populated demo environment!

---

## 🔍 Verifying Everything Works

### Checklist

- [ ] Railway services are all running (green)
- [ ] Seed script has been run on Railway database
- [ ] Can log in at `/login` with test credentials
- [ ] After login, JWT token is stored in localStorage
- [ ] Dashboard loads without 401 errors
- [ ] Cases are displayed on dashboard
- [ ] Can navigate to different pages
- [ ] No console errors

### Common Issues

#### Issue: Login fails with "Invalid credentials"
**Cause:** Seed script hasn't been run on Railway database
**Fix:** Run the seed script using Method A or B above

#### Issue: Login succeeds but dashboard shows 401 errors
**Cause:** JWT token not being sent with requests
**Fix:** Check that API client includes Authorization header

#### Issue: Can't see any cases after login
**Cause:** Seed script created users but no cases
**Fix:** Seed script should create sample case automatically

---

## 🎯 Creating Additional Users

### Via Signup Page

Users can create their own accounts:

1. Go to `/signup`
2. Fill in:
   - Email
   - Password (min 8 characters)
   - Name
   - Organization Name (optional)
3. Click "Sign Up"
4. Will be automatically logged in

### Via API

```bash
curl -X POST https://trialforgeapi-gateway-production.up.railway.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securepassword",
    "name": "New User",
    "organizationName": "My Law Firm"
  }'
```

---

## 📊 Authentication Flow

### Login Flow
1. User enters email/password on `/login` page
2. Frontend calls `POST /api/auth/login`
3. Backend verifies password with bcrypt
4. Backend generates JWT token (expires in 7 days)
5. Frontend stores token in localStorage
6. Frontend includes token in all subsequent API calls

### API Request Flow
1. Frontend makes API request (e.g., `GET /api/cases`)
2. API client includes `Authorization: Bearer <token>` header
3. Backend verifies JWT signature
4. Backend extracts user info from token
5. Backend processes request with user context
6. Backend returns data scoped to user's organization

### Token Structure
```json
{
  "userId": "user-id",
  "email": "attorney@example.com",
  "organizationId": "org-id",
  "role": "attorney",
  "iat": 1234567890,
  "exp": 1234567890
}
```

---

## 🔐 Security Features Implemented

- ✅ **Password Hashing**: Bcrypt with 10 salt rounds
- ✅ **JWT Tokens**: Signed with secret, 7-day expiration
- ✅ **Route Protection**: All API routes require authentication
- ✅ **Organization Isolation**: Users only see data from their org
- ✅ **Role-Based Access**: User roles stored in JWT
- ✅ **HTTPS**: All communication encrypted (Railway/Vercel)

---

## 🚧 Future Security Enhancements

These are NOT yet implemented but recommended for production:

- [ ] Password reset flow
- [ ] Email verification
- [ ] Two-factor authentication (2FA)
- [ ] Rate limiting on login attempts
- [ ] Session management (logout all devices)
- [ ] OAuth integration (Google, Microsoft)
- [ ] Audit logging for authentication events
- [ ] Password strength requirements
- [ ] Account lockout after failed attempts

---

## 🎉 Success!

Once you've seeded the Railway database, you should be able to:

1. **Log in** with `attorney@example.com` / `password123`
2. **See the dashboard** with sample data
3. **View the sample case** "Johnson v. TechCorp Industries"
4. **See 5 jurors** in the jury panel
5. **Navigate** to all pages without errors
6. **Use all features** that require authentication

---

**Last Updated:** January 22, 2026
**Status:** ✅ Auth implemented, ready to seed production database
