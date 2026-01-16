# Quick Reference - After Deployment

## 🔗 Your Live URLs

Once deployed, your URLs will look like:

**Main Dashboard (Admin):**

```
https://your-project-name.vercel.app
```

**Branch Entry Pages:**

```
FLORIDA:       https://your-project-name.vercel.app/entry/FLORIDA
TANDANG-SORA:  https://your-project-name.vercel.app/entry/TANDANG-SORA
LMYCC:         https://your-project-name.vercel.app/entry/LMYCC
```

And for ALL your warehouses:

```
PANDAN:        https://your-project-name.vercel.app/entry/PANDAN
SAPALIBUTAD:   https://your-project-name.vercel.app/entry/SAPALIBUTAD
PAMPANG:       https://your-project-name.vercel.app/entry/PAMPANG
SAN JOSE:      https://your-project-name.vercel.app/entry/SAN-JOSE
CONCEPCION:    https://your-project-name.vercel.app/entry/CONCEPCION
CITY CENTER:   https://your-project-name.vercel.app/entry/CITY-CENTER
```

---

## 📱 How to Share with Branch Admins

**Option 1: Viber/Messenger**

```
Hi! Here's your Branch Entry page:
[paste URL here]

Just:
1. Bookmark this link
2. Open it every day
3. Fill in the counts
4. Click Submit
Done! 🚀
```

**Option 2: Create QR Codes**

- Go to https://qr-code-generator.com
- Paste each branch URL
- Print the QR code
- Post it in the branch office

---

## 🔄 How to Update Your System

Made changes to the code? Just run:

```bash
git add .
git commit -m "Updated features"
git push
```

Vercel will automatically redeploy in 1-2 minutes!

---

## 🆘 Troubleshooting

**Problem: Branch says "Error loading data"**

- Check if your Supabase is still running (go to supabase.com)
- Verify environment variables in Vercel

**Problem: Can't push to GitHub**

- Run: `gh auth login` (if you have GitHub CLI)
- Or use: `git config --global credential.helper store`

**Problem: Deployment failed on Vercel**

- Check build logs
- Make sure environment variables are set
- Send me a screenshot and I'll help!

---

## 💰 Costs

**FREE FOREVER** as long as you stay within:

- Vercel: 100GB bandwidth/month (more than enough!)
- Supabase: 500MB database (= years of data!)

If you somehow exceed these (very unlikely), they'll email you first.

---

## 📧 Support

Stuck? Send me:

1. A screenshot
2. Red circle on what's confusing
3. I'll help immediately!

---

🎉 **Congratulations on deploying your monitoring system!**
