# 📦 Parcel Monitoring System

A professional, **FREE**, multi-branch parcel tracking system with dedicated entry URLs per branch.

## 🌟 Features

- ✅ **Branch-Specific Entry URLs** - Each branch gets their own URL (no login needed)
- ✅ **FREE Database** - Supabase PostgreSQL (500MB free tier)
- ✅ **Real-Time Dashboard** - Heatmap visualization, stats, monthly targets
- ✅ **Mobile-Friendly** - Works on phones, tablets, desktop
- ✅ **FREE Hosting** - Deploy to Vercel with zero cost
- ✅ **Quick Add Backup** - Manual entry option from dashboard
- ✅ **VIP Management** - Add/edit/delete VIP clients dynamically

## 🚀 Quick Start

### 1. Set Up Database (5 minutes)

Follow instructions in **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy your Supabase credentials to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Locally

```bash
npm run dev
```

Visit:

- **Dashboard**: http://localhost:3000
- **FLORIDA Entry**: http://localhost:3000/entry/FLORIDA
- **TANDANG-SORA Entry**: http://localhost:3000/entry/TANDANG-SORA

### 5. Deploy to Production

Follow **[DEPLOYMENT.md](./DEPLOYMENT.md)** for Vercel deployment.

---

## 📱 Branch Entry URLs

Each branch admin gets their own URL to bookmark:

```
FLORIDA:       https://your-app.vercel.app/entry/FLORIDA
TANDANG-SORA:  https://your-app.vercel.app/entry/TANDANG-SORA
LMYCC:         https://your-app.vercel.app/entry/LMYCC
```

They simply:

1. Open their link
2. Fill in daily counts
3. Click Submit
4. Done! 🎉

---

## 🎯 Branch Admin Workflow

1. Bookmark their dedicated URL
2. Open daily (takes < 1 minute)
3. See form with:
   - Date (defaults to today)
   - Each VIP client
   - Walk-in count
4. Enter numbers
5. Submit → Data syncs instantly to dashboard

---

## 👀 Admin Dashboard View

Main dashboard shows:

- ALL branches in one view
- Real-time heatmap
- Monthly progress bars
- VIP/Walk-in totals
- Date navigation
- Search & filter

---

## 💰 Cost

**₱0 per month!**

- Supabase: FREE (500MB database)
- Vercel: FREE (unlimited bandwidth)
- Custom domain: FREE (if you own one)

---

## 📂 Project Structure

```
parcel-monitor/
├── app/
│   ├── entry/[branch]/page.tsx  # Branch entry pages
│   ├── api/
│   │   ├── submit-entry/        # Save data endpoint
│   │   ├── data/                # Fetch data endpoint
│   │   └── vip/                 # VIP management
│   ├── page.tsx                 # Main dashboard
│   └── globals.css
├── components/
│   └── Dashboard.tsx            # Dashboard component
├── lib/
│   ├── supabase.ts              # Database client
│   └── vip-structure.json       # VIP configuration
├── .env.local                   # Environment variables
├── SUPABASE_SETUP.md            # Database setup guide
├── DEPLOYMENT.md                # Deployment guide
└── README.md                    # This file
```

---

## 🔧 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **API**: Next.js API Routes

---

## 📖 Documentation

- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Database setup
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment
- **[walkthrough.md](./.gemini/...)** - Complete system walkthrough

---

## 🎨 Features in Detail

### Branch Entry Page

- Auto-detects branch from URL
- Loads branch-specific VIP clients
- Date picker (defaults to today)
- Input validation
- Success/error notifications
- Mobile-optimized

### Main Dashboard

- Automatic data loading from database
- Heatmap color coding
- Monthly target tracking
- Quick Add manual entry
- VIP client management
- Branch switching
- Date range navigation
- Search functionality

---

## 🔐 Security

- No authentication required (simplicity)
- Each branch URL acts as their access key
- Supabase handles data security
- Environment variables for sensitive data
- You control URL distribution

---

## 🆘 Support

Need help?

1. Check the setup guides
2. Verify environment variables
3. Check Supabase connection
4. Review browser console for errors

---

## 📝 License

MIT License - Free to use and modify

---

**Built with ❤️ for efficient parcel monitoring**
