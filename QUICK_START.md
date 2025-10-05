# 🚀 Quick Start - Deploy to Vercel

## Step 1: Create Neon Database (5 min)

1. Go to [neon.tech](https://neon.tech) and sign up/login
2. Click **"New Project"**
3. Name: `digital-pm`
4. Region: **US East** (closest to Denver)
5. Click **"Create Project"**
6. **Copy the connection string** (starts with `postgresql://`)

## Step 2: Deploy to Vercel (3 min)

1. Push this code to GitHub (instructions below)
2. Go to [vercel.com](https://vercel.com) and login with: `canoes.aprons.0k@icloud.com`
3. Click **"Add New Project"**
4. Import your GitHub repo: `ayalamanuliber/digital-pm`
5. **Add Environment Variable:**
   - Name: `DATABASE_URL`
   - Value: (paste your Neon connection string)
6. Click **"Deploy"**

## Step 3: Initialize Database (2 min)

After deployment succeeds:

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Run database migration
vercel env pull .env.local
npm run db:push

# Seed demo data (optional)
npm run db:seed
```

## Step 4: Test It! ✅

Visit your Vercel URL (e.g., `https://digital-pm.vercel.app`)

**What's Ready:**
- ✅ Dashboard with real data
- ✅ Projects module (view/create/edit)
- ✅ Workers module (view/create/edit)
- ✅ Tasks module (view/create/edit)
- ✅ Calendar scheduling
- ✅ All data persists in Neon database

---

## 🔧 Local Development

```bash
# 1. Clone repo
git clone https://github.com/ayalamanuliber/digital-pm.git
cd digital-pm

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env.local
# Add your DATABASE_URL to .env.local

# 4. Push database schema
npm run db:push

# 5. Seed demo data
npm run db:seed

# 6. Run dev server
npm run dev
```

Visit `http://localhost:3000`

---

## 📊 Demo Data (After Seeding)

- **3 Workers:** Carlos Rodriguez, Juan Martinez, David Chen
- **1 Project:** #2011 - Jack Shippee ($3,953.25)
- **8 Tasks:** AC service, smoke detectors, plumbing, etc.

---

## 🆘 Troubleshooting

**Error: DATABASE_URL not found**
→ Make sure you added it in Vercel Environment Variables

**Error: Migration failed**
→ Run `npx drizzle-kit push --force`

**Database shows empty**
→ Run `npm run db:seed` to add demo data

---

**Need help?** Check `DEPLOYMENT_GUIDE.md` for detailed instructions.
