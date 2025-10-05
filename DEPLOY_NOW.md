# 🚀 Deploy Now - Step by Step

## What You Need to Do (10 minutes total)

### ✅ Step 1: Create GitHub Repo (2 min)

Since I can't create GitHub repos directly, you need to:

1. Go to [github.com/new](https://github.com/new)
2. Login with: `ayalamanuliber`
3. Repository name: `digital-pm`
4. Set to **Public** or **Private** (your choice)
5. **Don't** initialize with README (we already have code)
6. Click **"Create repository"**

### ✅ Step 2: Push Code to GitHub (1 min)

Copy the commands GitHub shows you, or run these:

```bash
cd "/Users/manuayala/PM Build"

# Add GitHub remote (replace YOUR-USERNAME with ayalamanuliber)
git remote add origin https://github.com/ayalamanuliber/digital-pm.git

# Push to GitHub
git push -u origin main
```

### ✅ Step 3: Create Neon Database (3 min)

1. Go to [neon.tech](https://neon.tech)
2. Sign up/login (use GitHub or email)
3. Click **"New Project"**
4. Settings:
   - Name: `digital-pm`
   - Region: **US East (Ohio)** or **US West (Oregon)**
   - Postgres version: Latest (default)
5. Click **"Create Project"**
6. **COPY THIS:** Connection string (looks like `postgresql://user:pass@ep-xxx.neon.tech/dbname`)
   - Save it somewhere, you'll need it in next step

### ✅ Step 4: Deploy to Vercel (4 min)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Login with: `canoes.aprons.0k@icloud.com` (you have Pro account)
3. Click **"Import Git Repository"**
4. Select: `ayalamanuliber/digital-pm`
5. **IMPORTANT:** Before clicking Deploy:
   - Click **"Environment Variables"**
   - Add variable:
     - Name: `DATABASE_URL`
     - Value: (paste your Neon connection string from Step 3)
   - Click **"Add"**
6. Click **"Deploy"**

Wait 2-3 minutes for deployment...

### ✅ Step 5: Initialize Database (via Vercel CLI)

```bash
# Install Vercel CLI (if you don't have it)
npm i -g vercel

# Login to Vercel
vercel login
# (use canoes.aprons.0k@icloud.com)

# Link to your project
cd "/Users/manuayala/PM Build"
vercel link
# Select your deployed project

# Pull environment variables locally
vercel env pull .env.local

# Push database schema to Neon
npm run db:push

# Seed demo data (optional but recommended)
npm run db:seed
```

---

## 🎉 You're Done!

Your app is now live at: `https://digital-pm-xxx.vercel.app` (Vercel will show you the URL)

**What's Working:**
- ✅ Full dashboard
- ✅ Projects CRUD
- ✅ Workers CRUD
- ✅ Tasks CRUD
- ✅ Calendar view
- ✅ Real database (data persists)

**Share with Robert & Erick:**
Just send them the Vercel URL!

---

## 🔍 Test It

Visit your URL and you should see:
- Demo project (#2011 - Jack Shippee)
- 3 workers (Carlos, Juan, David)
- 8 tasks ready to assign

---

## 🆘 If Something Goes Wrong

**"DATABASE_URL not found" error:**
→ Go to Vercel dashboard → Your project → Settings → Environment Variables → Add `DATABASE_URL`

**Database is empty:**
→ Run `npm run db:seed` locally (after doing Step 5)

**GitHub push fails:**
→ Make sure you created the repo first (Step 1)

**Need to redeploy after changes:**
```bash
git add .
git commit -m "Your change description"
git push
```
Vercel auto-deploys on every push!

---

## 📊 What Happens Next

1. You visit the URL → See the dashboard
2. Robert/Erick visit the URL → Can add workers
3. They create projects → Tasks get created
4. Workers get assigned → SMS comes later (Phase 2)

For now, everything except SMS/WhatsApp works perfectly!
