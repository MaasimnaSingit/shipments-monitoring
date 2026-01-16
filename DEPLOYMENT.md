# 🚀 Deployment Guide - FREE Hosting

## Overview

Deploy your Parcel Monitor system to the internet for **FREE** using Vercel + Supabase.

---

## Prerequisites

- ✅ Supabase account set up (see `SUPABASE_SETUP.md`)
- ✅ GitHub account
- ✅ Your code pushed to GitHub repository

---

## Step 1: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Parcel monitoring system ready for deployment"

# Create a new repository on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/parcel-monitor.git
git push -u origin main
```

---

## Step 2: Deploy to Vercel (FREE)

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" → Use GitHub account
3. Click "Add New..." → "Project"
4. Import your `parcel-monitor` repository
5. Configure:
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (leave default)
   - Build Command: `npm run build` (auto-filled)

6. **Add Environment Variables** (CRITICAL!):
   Click "Environment Variables" and add:

   ```
   Name: NEXT_PUBLIC_SUPABASE_URL
   Value: https://your-project.supabase.co

   Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: your-anon-key-from-supabase
   ```

7. Click **"Deploy"**
8. Wait 2-3 minutes ☕

---

## Step 3: Get Your URLs

After deployment, Vercel gives you:

- Production URL: `https://parcel-monitor-xxx.vercel.app`

### Branch Entry URLs:

Share these with your branch admins:

```
FLORIDA:       https://parcel-monitor-xxx.vercel.app/entry/FLORIDA
TANDANG-SORA:  https://parcel-monitor-xxx.vercel.app/entry/TANDANG-SORA
LMYCC:         https://parcel-monitor-xxx.vercel.app/entry/LMYCC
```

### Main Dashboard (Admin Only):

```
Dashboard: https://parcel-monitor-xxx.vercel.app
```

---

## Step 4: Share with Branch Admins

Send each branch admin their URL via:

- Email
- Viber/Messenger
- WhatsApp

**Instructions for them:**

1. Bookmark the link
2. Open it daily
3. Fill in the counts
4. Click Submit
5. Done! ✅

---

## 📱 Custom Domain (Optional)

Want a custom domain like `monitor.yourcompany.com`?

1. In Vercel dashboard → Settings → Domains
2. Add domain
3. Update DNS records (Vercel shows you how)
4. **Still FREE!**

---

## 🔄 Update Your App

When you make changes:

```bash
git add .
git commit -m "Updated feature"
git push
```

**Vercel automatically redeploys!** Takes 1-2 minutes.

---

## 💰 Cost Breakdown

| Service           | Free Tier              | Cost |
| ----------------- | ---------------------- | ---- |
| Vercel Hosting    | Unlimited bandwidth    | ₱0   |
| Supabase Database | 500MB DB + 50K users   | ₱0   |
| Custom Domain     | 1 free, unlimited paid | ₱0\* |

**TOTAL: ₱0/month** 🎉

\*If you own a domain, it's free. Buying a new domain costs ~₱500-1000/year (optional).

---

## 🎯 Success Checklist

- [ ] Code pushed to GitHub
- [ ] Deployed on Vercel
- [ ] Environment variables added
- [ ] Main dashboard loads
- [ ] Branch entry pages work
- [ ] URLs shared with admins
- [ ] First data entry tested

---

**Questions?** Check [Vercel docs](https://vercel.com/docs) or ask me!
