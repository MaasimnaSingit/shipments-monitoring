# 🚀 DEPLOY YOUR MONITORING SYSTEM - EASY MODE

**Total Time: 10 minutes | Your Effort: 5% | My Scripts: 95%**

---

## 📋 BEFORE YOU START

- [ ] You have a **GitHub account** (if not: sign up at github.com - it's free)
- [ ] You're logged into GitHub in your browser
- [ ] Your terminal is open in this folder

---

## STEP 1️⃣: CREATE SUPABASE DATABASE (4 minutes)

### 1.1 - Sign Up

1. Open this URL in your browser: **https://supabase.com**
2. Click the big **"Start your project"** button (top right)
3. Click **"Sign in with GitHub"**
4. Authorize Supabase to access your GitHub account

### 1.2 - Create Project

1. You'll see a dashboard. Click **"New Project"** (green button)
2. Fill in these fields:
   - **Organization**: Choose your GitHub username
   - **Name**: Type `shipments-monitoring`
   - **Database Password**: Type any strong password (V?uJN4$d88ai8/d)
   - **Region**: Select **"Southeast Asia (Singapore)"**
3. Click **"Create new project"**
4. ⏱️ **WAIT 2-3 MINUTES** (you'll see a loading screen - this is normal!)

### 1.3 - Create Database Table

1. On the left sidebar, click **"SQL Editor"** (icon looks like `</>`)
2. Click **"New query"** button (top right)
3. **COPY THIS ENTIRE SQL CODE** and paste it into the editor:

```sql
CREATE TABLE parcel_data (
  id BIGSERIAL PRIMARY KEY,
  branch TEXT NOT NULL,
  date DATE NOT NULL,
  vip_code TEXT NOT NULL,
  vip_name TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(branch, date, vip_code)
);

CREATE INDEX idx_parcel_data_branch_date ON parcel_data(branch, date);
CREATE INDEX idx_parcel_data_date ON parcel_data(date);
```

4. Click **"RUN"** button (bottom right of the SQL editor)
5. ✅ You should see **"Success. No rows returned"** - this is GOOD!

### 1.4 - Get Your API Keys

1. On the left sidebar, click **"Settings"** (gear icon at the bottom)
2. Click **"API"** in the Settings menu
3. You'll see two important things:

**🔴 STOP HERE! SCREENSHOT THIS PAGE!**

You need to copy TWO values:

- **Project URL** (looks like: `https://xxxxxx.supabase.co`)
- **anon / public key** (under "Project API keys" - it's a LONG string starting with `eyJ...`)

**📋 PASTE THEM IN A NOTEPAD FOR NOW - YOU'LL NEED THEM IN STEP 2!**

---

## STEP 2️⃣: CONFIGURE YOUR PROJECT (1 minute)

1. Open this file: `.env.local` (it's in your project folder)
2. You'll see two lines that look like this:

```
NEXT_PUBLIC_SUPABASE_URL=REPLACE_WITH_YOUR_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=REPLACE_WITH_YOUR_KEY
```

3. **Replace** `REPLACE_WITH_YOUR_URL` with your **Project URL** from Step 1.4
4. **Replace** `REPLACE_WITH_YOUR_KEY` with your **anon key** from Step 1.4
5. **SAVE THE FILE** (Ctrl+S)

**Example of what it should look like:**

```
NEXT_PUBLIC_SUPABASE_URL=https://abc123xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...
```

---

## STEP 3️⃣: PUSH TO GITHUB (2 minutes)

### 3.1 - Create GitHub Repository

1. Open this URL: **https://github.com/new**
2. Fill in:
   - **Repository name**: `parcel-monitor`
   - **Description**: `Branch parcel monitoring system`
   - **Visibility**: Choose **Private** (recommended) or Public
3. **DO NOT** check "Add a README file" or ".gitignore"
4. Click **"Create repository"**
5. You'll see a page with setup instructions - **IGNORE THEM FOR NOW**

### 3.2 - Run My Setup Script

1. Open your **terminal** in the project folder
2. Run this command:

```bash
npm run deploy-setup
```

3. It will ask you for your **GitHub repository URL**
4. Go back to the GitHub page from 3.1, and copy the **HTTPS URL** (looks like: `https://github.com/yourusername/parcel-monitor.git`)
5. Paste it into the terminal and press Enter
6. The script will automatically:
   - Initialize Git
   - Add all files
   - Commit everything
   - Connect to your GitHub repo
   - Push the code

**✅ If you see "Successfully pushed to GitHub!" - YOU'RE GOLDEN!**

---

## STEP 4️⃣: DEPLOY TO VERCEL (3 minutes)

### 4.1 - Sign Up for Vercel

1. Open this URL: **https://vercel.com/signup**
2. Click **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub account

### 4.2 - Import Your Project

1. You'll see the Vercel dashboard
2. Click **"Add New..."** → **"Project"**
3. You should see your `parcel-monitor` repository in the list
4. Click **"Import"** next to it

### 4.3 - Configure Deployment

1. **Framework Preset**: Should auto-detect as "Next.js" ✅
2. **Root Directory**: Leave as `./` ✅
3. **Build Settings**: Leave as default ✅

**🔴 MOST IMPORTANT STEP - DON'T SKIP!**

4. Click **"Environment Variables"** to expand it
5. Add TWO variables:

**First Variable:**

- **Name**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: (paste your Supabase Project URL from Step 1.4)

**Second Variable:**

- **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: (paste your Supabase anon key from Step 1.4)

6. Click **"Deploy"** button
7. ⏱️ **WAIT 2-3 MINUTES** (you'll see a build progress screen)

---

## ✅ STEP 5️⃣: YOU'RE LIVE!

When the deployment finishes, you'll see:

- 🎉 **Congratulations!** screen
- A **"Visit"** button
- Your production URL (like: `https://parcel-monitor-xxxx.vercel.app`)

### Get Your Branch URLs

Click the **Domains** section, and copy your main URL.

Then create these URLs for your branches:

- **FLORIDA**: `https://your-url.vercel.app/entry/FLORIDA`
- **TANDANG-SORA**: `https://your-url.vercel.app/entry/TANDANG-SORA`
- **LMYCC**: `https://your-url.vercel.app/entry/LMYCC`
- **Admin Dashboard (YOU)**: `https://your-url.vercel.app`

**📱 Send these links via Viber/Messenger to your branch admins!**

---

## 🆘 STUCK? SEND ME A SCREENSHOT!

If you get stuck at ANY step:

1. Take a screenshot
2. Draw a RED CIRCLE on what's confusing
3. Send it to me
4. I'll tell you EXACTLY what to do next!

---

## 🔄 HOW TO UPDATE IN THE FUTURE

Made changes to your code? Just run:

```bash
git add .
git commit -m "Updated features"
git push
```

Vercel will **automatically redeploy** in 1-2 minutes! 🚀

---

**READY? START WITH STEP 1!** 💪
