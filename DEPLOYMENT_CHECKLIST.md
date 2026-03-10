# SafeHelpHub Deployment Checklist

## Pre-Deployment Setup

### 1. Supabase Setup (5 minutes)
- [ ] Go to https://supabase.com/dashboard
- [ ] Click "New Project"
- [ ] Project name: `safehelpub-db`
- [ ] Generate strong database password (save it!)
- [ ] Choose region: Europe (Frankfurt) or closest to users
- [ ] Wait for project creation (~2 minutes)
- [ ] Go to Settings > Database > Connection string
- [ ] Copy URI format connection string
- [ ] Replace `[YOUR-PASSWORD]` with your database password
- [ ] Go to Settings > API
- [ ] Copy "Project URL" (SUPABASE_URL)
- [ ] Copy "anon public" key (SUPABASE_KEY)

**You'll need:**
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
SUPABASE_URL=https://[REF].supabase.co
SUPABASE_KEY=eyJhbG...
```

---

### 2. Resend Setup (3 minutes)
- [ ] Go to https://resend.com/signup
- [ ] Sign up with GitHub or email
- [ ] Verify your email
- [ ] Go to API Keys
- [ ] Click "Create API Key"
- [ ] Name: `safehelpub-production`
- [ ] Copy the key (starts with `re_`)

**You'll need:**
```
RESEND_API_KEY=re_...
```

---

### 3. OpenAI Setup (2 minutes)
- [ ] Go to https://platform.openai.com/api-keys
- [ ] Sign in or create account
- [ ] Click "Create new secret key"
- [ ] Name: `safehelpub`
- [ ] Copy the key (starts with `sk-`)
- [ ] Add $5-10 credit to your account

**You'll need:**
```
OPENAI_API_KEY=sk-...
```

---

## Backend Deployment (Render)

### 4. Deploy to Render (10 minutes)
- [ ] Go to https://render.com
- [ ] Sign up with GitHub
- [ ] Click "New +" > "Web Service"
- [ ] Connect GitHub repository: `SafeHelpHub`
- [ ] Configure:
  - **Name**: `safehelpub-api`
  - **Region**: Frankfurt (or closest)
  - **Branch**: `main`
  - **Runtime**: Node
  - **Build Command**: `npm install && npm run build`
  - **Start Command**: `npm run start:prod`
  - **Instance Type**: Free

- [ ] Add Environment Variables:
  ```
  NODE_ENV=production
  PORT=3000
  DATABASE_URL=<from-supabase>
  JWT_SECRET=<generate-with-script>
  JWT_KEY=<generate-with-script>
  SALT=10
  RESEND_API_KEY=<from-resend>
  EMAIL_FROM=onboarding@resend.dev
  OPENAI_API_KEY=<from-openai>
  SUPABASE_URL=<from-supabase>
  SUPABASE_KEY=<from-supabase>
  ```

- [ ] Click "Create Web Service"
- [ ] Wait for deployment (~5 minutes)
- [ ] Copy your Render URL: `https://safehelpub-api.onrender.com`
- [ ] Test: Open `https://safehelpub-api.onrender.com` in browser

---

## Frontend Deployment (Vercel)

### 5. Deploy to Vercel (5 minutes)
- [ ] Go to https://vercel.com/signup
- [ ] Sign up with GitHub
- [ ] Click "Add New..." > "Project"
- [ ] Import repository: `silent-report-app`
- [ ] Configure:
  - **Framework Preset**: Vite
  - **Build Command**: `npm run build`
  - **Output Directory**: `dist`
  - **Install Command**: `npm install`

- [ ] Add Environment Variable:
  ```
  VITE_API_URL=https://safehelpub-api.onrender.com
  ```

- [ ] Click "Deploy"
- [ ] Wait for deployment (~3 minutes)
- [ ] Copy your Vercel URL: `https://silent-report-app.vercel.app`
- [ ] Test: Open URL in browser

---

## Post-Deployment Testing

### 6. Test Application (10 minutes)
- [ ] Open frontend URL
- [ ] Test user registration
  - [ ] Check email received (verification code)
- [ ] Test login
- [ ] Test report submission
  - [ ] Text report
  - [ ] With image upload
  - [ ] With audio recording
- [ ] Test AI chatbot
- [ ] Test admin dashboard
  - [ ] View reports
  - [ ] Update report status
- [ ] Test on mobile device
  - [ ] Open URL on phone
  - [ ] Test all features

---

## Optional: Custom Domain

### 7. Add Custom Domain (15 minutes)
- [ ] Buy domain from Porkbun or Cloudflare (~$9/year)
- [ ] In Vercel: Settings > Domains > Add domain
- [ ] Add DNS records provided by Vercel
- [ ] In Render: Settings > Custom Domain > Add `api.yourdomain.com`
- [ ] Add DNS records provided by Render
- [ ] Wait for DNS propagation (~5-30 minutes)
- [ ] Update VITE_API_URL in Vercel to use custom domain
- [ ] Redeploy frontend

---

## Monitoring Setup

### 8. Set Up Monitoring (5 minutes)
- [ ] Sentry is already configured in code
- [ ] Check Sentry dashboard for errors: https://sentry.io
- [ ] Set up Render email alerts:
  - [ ] Go to Render service > Settings > Notifications
  - [ ] Enable "Deploy failed" notifications
- [ ] Bookmark these dashboards:
  - [ ] Render: https://dashboard.render.com
  - [ ] Vercel: https://vercel.com/dashboard
  - [ ] Supabase: https://supabase.com/dashboard
  - [ ] Resend: https://resend.com/emails

---

## Cost Tracking

### 9. Monitor Usage (Weekly)
- [ ] Check Supabase usage: Database > Usage
- [ ] Check Resend usage: Emails sent
- [ ] Check OpenAI usage: https://platform.openai.com/usage
- [ ] Check Render status: Free tier spins down after 15 min inactivity

**Expected monthly costs:**
- Supabase: $0 (within free tier)
- Resend: $0 (within free tier)
- Render: $0 (free tier)
- Vercel: $0 (free tier)
- OpenAI: $5-10 (pay-as-you-go)
- **Total: ~$5-10/month**

---

## Troubleshooting

### Common Issues:

**Backend won't start:**
- Check Render logs for errors
- Verify all environment variables are set
- Check DATABASE_URL is correct

**Emails not sending:**
- Verify RESEND_API_KEY is correct
- Check Resend dashboard for errors
- Emails from `onboarding@resend.dev` work immediately
- Custom domain requires DNS verification

**Frontend can't connect to backend:**
- Verify VITE_API_URL is correct
- Check backend is running (visit URL)
- Check CORS is enabled in backend

**Database connection failed:**
- Verify DATABASE_URL format
- Check Supabase project is running
- Verify password is correct (no special chars in URL)

**File uploads failing:**
- Verify SUPABASE_URL and SUPABASE_KEY
- Check Supabase storage bucket exists
- Check file size < 10MB

---

## Quick Commands

### Generate JWT secrets:
```bash
cd ~/SafeHelpHub
./setup-production.sh
```

### Test backend locally with production DB:
```bash
cd ~/SafeHelpHub
# Update .env with production DATABASE_URL
npm run start:dev
```

### Test frontend locally with production API:
```bash
cd ~/silent-report-app
# Update .env with production VITE_API_URL
npm run dev
```

### View Render logs:
```bash
# In Render dashboard > Logs tab
# Or use Render CLI
```

---

## Success Criteria

✅ Backend deployed and accessible
✅ Frontend deployed and accessible
✅ User can register and receive email
✅ User can login
✅ User can submit report
✅ Admin can view reports
✅ AI chatbot responds
✅ No errors in Sentry
✅ Mobile app works on phone

---

## Next Steps After Launch

1. **Week 1**: Monitor daily for errors
2. **Week 2**: Gather user feedback
3. **Month 1**: Review usage and costs
4. **When needed**: Upgrade to paid tiers

**Upgrade triggers:**
- Render: Upgrade to $7/month for always-on (no spin down)
- Supabase: Upgrade at 500MB database or 1GB storage
- Resend: Upgrade at 3,000 emails/month

---

## Support Resources

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Resend Docs**: https://resend.com/docs
- **NestJS Docs**: https://docs.nestjs.com

---

**Estimated Total Setup Time: 45-60 minutes**

Good luck with your launch! 🚀
