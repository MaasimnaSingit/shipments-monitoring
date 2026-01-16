# 🚀 Supabase Setup Guide for Branch Entry System

## Step 1: Create FREE Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub/Google (FREE)
4. Create a new project:
   - Project name: `parcel-monitor`
   - Database password: (choose a strong password)
   - Region: Southeast Asia (Singapore) - closest to Philippines
   - Click "Create new project" (wait 2-3 minutes)

## Step 2: Create Database Tables

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click "New query"
3. Paste this SQL and click **RUN**:

```sql
-- Create parcel_data table
CREATE TABLE parcel_data (
  id BIGSERIAL PRIMARY KEY,
  branch TEXT NOT NULL,
  date DATE NOT NULL,
  vip_code TEXT NOT NULL,
  vip_name TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(branch, date, vip_code)
);

-- Create indexes for fast queries
CREATE INDEX idx_parcel_data_branch_date ON parcel_data(branch, date);
CREATE INDEX idx_parcel_data_date ON parcel_data(date);

-- Create branches table
CREATE TABLE branches (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  monthly_target INTEGER DEFAULT 10000,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert your branches
INSERT INTO branches (name, monthly_target) VALUES
  ('FLORIDA', 12000),
  ('TANDANG-SORA', 10000),
  ('LMYCC', 10000)
ON CONFLICT (name) DO NOTHING;
```

## Step 3: Get Your API Keys

1. Go to **Settings** → **API** (in left sidebar)
2. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string)

## Step 4: Update Your `.env.local` File

Open `.env.local` in your project and update:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-super-long-anon-key-here
```

## Step 5: Test It!

```bash
# Restart the dev server
npm run dev

# Open in browser:
# Main dashboard: http://localhost:3000
# FLORIDA entry: http://localhost:3000/entry/FLORIDA
```

## 🎯 Branch Entry URLs

Once deployed, share these URLs with branch admins:

- **FLORIDA**: `https://your-app.vercel.app/entry/FLORIDA`
- **TANDANG-SORA**: `https://your-app.vercel.app/entry/TANDANG-SORA`
- **LMYCC**: `https://your-app.vercel.app/entry/LMYCC`

They bookmark their link and use it daily!

## 💡 Tips

- **Free tier limits**: 500MB database (years of data!)
- **Real-time updates**: Data appears instantly on dashboard
- **Backup**: Supabase auto-backs up your data
- **No login needed**: Each branch URL is their "key"

## 🔒 Security Note

The `anon` key is safe to expose in client-side code. Supabase Row Level Security (RLS) protects your data. Since we're not using RLS for this simple system, anyone with a branch URL can submit data for that branch. This is intentional and keeps it simple!

---

**Need help?** Check the [Supabase docs](https://supabase.com/docs) or ask me!
