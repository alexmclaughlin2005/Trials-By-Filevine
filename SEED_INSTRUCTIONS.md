# How to Seed the Railway Database

Since the Railway CLI has SSL certificate issues, use this standalone script instead.

## Step 1: Get Your DATABASE_URL from Railway

1. Go to https://railway.app/dashboard
2. Click on your **PostgreSQL** service (not api-gateway)
3. Click on the **Variables** tab
4. Find and copy the **DATABASE_URL** value
   - It looks like: `postgresql://postgres:PASSWORD@HOST:PORT/railway`

## Step 2: Run the Seed Script

Open your terminal and run:

```bash
cd "/Users/alexmclaughlin/Desktop/Cursor Projects/Trials by Filevine"

DATABASE_URL="your-database-url-here" npx tsx seed-production.ts
```

**Replace `your-database-url-here` with the actual DATABASE_URL you copied from Railway.**

## Example

```bash
DATABASE_URL="postgresql://postgres:abc123@postgres.railway.app:5432/railway" npx tsx seed-production.ts
```

## What You'll See

```
🌱 Seeding Railway production database...

✅ Created organization: Sample Law Firm
⏳ Hashing passwords...
✅ Created users: John Attorney Sarah Paralegal
✅ Created 3 system personas
✅ Created sample case: Johnson v. TechCorp Industries
✅ Created 5 sample jurors

🎉 Seeding complete!

✨ Sample credentials:
   Email:    attorney@example.com
   Password: password123

   Email:    paralegal@example.com
   Password: password123

📊 Sample data created:
   - 1 Organization: Sample Law Firm
   - 2 Users: John Attorney, Sarah Paralegal
   - 3 System Personas
   - 1 Case: Johnson v. TechCorp Industries
   - 1 Jury Panel with 5 Jurors

🔗 Next step: Log in at your Vercel URL with the credentials above
```

## Step 3: Test Login

1. Go to your Vercel app URL
2. Click "Login"
3. Enter:
   - **Email:** `attorney@example.com`
   - **Password:** `password123`
4. You should be logged in and see the dashboard with sample data!

---

## Troubleshooting

### Error: "DATABASE_URL environment variable is required"

Make sure you're including the DATABASE_URL in the command:

```bash
DATABASE_URL="postgresql://..." npx tsx seed-production.ts
```

### Error: Connection refused or timeout

- Check that your DATABASE_URL is correct
- Make sure your IP is allowed in Railway (Railway usually allows all IPs by default)
- Try running from a different network if blocked

### Error: tsx command not found

Install tsx globally:

```bash
npm install -g tsx
```

Or use npx (which should work):

```bash
DATABASE_URL="..." npx tsx seed-production.ts
```

---

## Alternative: Use Railway Dashboard SQL

If the script doesn't work, you can manually insert the data:

1. Go to Railway Dashboard → PostgreSQL service → **Data** tab
2. Click **Query**
3. Use the SQL from [AUTH_SETUP_COMPLETE.md](AUTH_SETUP_COMPLETE.md) (Method C)

---

**Need help? Share the error message and I'll help troubleshoot!**
