# SafeHelpHub Deployment Guide

## 1. Database Setup (Supabase)

### Steps:
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - Name: `safehelpub-db`
   - Database Password: (generate strong password)
   - Region: Choose closest to your users
4. Wait for project to be created
5. Go to Settings > Database
6. Copy the "Connection string" (URI format)
7. Replace `[YOUR-PASSWORD]` with your database password

### Get your credentials:
- **Database URL**: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
- **Storage URL**: `https://[PROJECT-REF].supabase.co/storage/v1`
- **Anon Key**: Settings > API > anon public key

---

## 2. Email Setup (Resend)

### Steps:
1. Go to https://resend.com/signup
2. Sign up with GitHub or email
3. Verify your email
4. Go to API Keys section
5. Click "Create API Key"
6. Name it: `safehelpub-production`
7. Copy the API key (starts with `re_`)

### Domain Setup (Optional - for production):
1. Go to Domains section
2. Add your domain
3. Add DNS records provided by Resend
4. Verify domain

**For now, use Resend's test domain**: You can send from `onboarding@resend.dev`

---

## 3. File Storage Setup (Cloudinary - Backup)

### Steps:
1. Go to https://cloudinary.com/users/register_free
2. Sign up
3. Go to Dashboard
4. Copy:
   - Cloud Name
   - API Key
   - API Secret

---

## 4. Backend Deployment (Render)

### Steps:
1. Go to https://render.com/
2. Sign up with GitHub
3. Click "New +" > "Web Service"
4. Connect your GitHub repository: `SafeHelpHub`
5. Configure:
   - **Name**: `safehelpub-api`
   - **Region**: Choose closest
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Instance Type**: `Free`

6. Add Environment Variables (see below)
7. Click "Create Web Service"

### Environment Variables for Render:
```
NODE_ENV=production
PORT=3000
DATABASE_URL=<your-supabase-connection-string>
JWT_SECRET=<generate-random-string-32-chars>
JWT_KEY=<generate-random-string-32-chars>
SALT=10
RESEND_API_KEY=<your-resend-api-key>
EMAIL_FROM=onboarding@resend.dev
OPENAI_API_KEY=<your-openai-key>
SUPABASE_URL=<your-supabase-url>
SUPABASE_KEY=<your-supabase-anon-key>
CLOUDINARY_CLOUD_NAME=<optional>
CLOUDINARY_API_KEY=<optional>
CLOUDINARY_API_SECRET=<optional>
```

**Your Render URL will be**: `https://safehelpub-api.onrender.com`

---

## 5. Frontend Deployment (Vercel)

### Steps:
1. Go to https://vercel.com/signup
2. Sign up with GitHub
3. Click "Add New..." > "Project"
4. Import `silent-report-app` repository
5. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

6. Add Environment Variable:
   ```
   VITE_API_URL=https://safehelpub-api.onrender.com
   ```

7. Click "Deploy"

**Your Vercel URL will be**: `https://silent-report-app.vercel.app`

---

## 6. Domain Setup (Optional)

### Buy Domain:
1. Go to https://porkbun.com or https://www.cloudflare.com/products/registrar/
2. Search for your domain (e.g., `safehelpub.com`)
3. Purchase (~$9/year)

### Connect to Vercel (Frontend):
1. In Vercel project settings > Domains
2. Add your domain
3. Add DNS records provided by Vercel

### Connect to Render (Backend):
1. In Render service settings > Custom Domain
2. Add `api.yourdomain.com`
3. Add DNS records provided by Render

---

## 7. Post-Deployment Checklist

- [ ] Test user registration
- [ ] Test report submission
- [ ] Test email notifications
- [ ] Test AI chatbot
- [ ] Test admin dashboard
- [ ] Set up Sentry error tracking (already configured)
- [ ] Monitor Render logs for errors
- [ ] Test on mobile device

---

## Cost Summary

| Service | Plan | Cost |
|---------|------|------|
| Supabase | Free | $0/month |
| Resend | Free | $0/month |
| Render | Free | $0/month |
| Vercel | Free | $0/month |
| OpenAI API | Pay-as-you-go | ~$5-10/month |
| Domain (optional) | Annual | ~$9/year |
| **Total** | | **~$5-10/month** |

---

## Upgrade Triggers

Upgrade when you hit these limits:

- **Supabase Free**: 500MB database, 1GB storage, 2GB bandwidth
- **Resend Free**: 3,000 emails/month, 100/day
- **Render Free**: Spins down after 15 min inactivity (upgrade to $7/month for always-on)
- **Vercel Free**: Unlimited bandwidth (very generous)

---

## Support & Monitoring

- **Error Tracking**: Sentry (already configured) - https://sentry.io
- **Backend Logs**: Render Dashboard > Logs
- **Frontend Logs**: Vercel Dashboard > Logs
- **Database Monitoring**: Supabase Dashboard > Database

---

## Quick Commands

### Generate secure secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Test backend locally with new DB:
```bash
cd ~/SafeHelpHub
# Update .env with Supabase URL
npm run start:dev
```

### Test frontend locally:
```bash
cd ~/silent-report-app
# Update .env with Render URL
npm run dev
```
