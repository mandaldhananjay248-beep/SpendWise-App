# SpendWise Deployment Guide

This guide covers deploying both the backend and frontend of your SpendWise expense tracker application.

## Prerequisites

- GitHub account (for version control)
- MongoDB Atlas account (free tier available)
- Backend hosting (Render, Heroku, Railway, or similar)
- Frontend hosting (Vercel, Netlify, GitHub Pages)

---

## Part 1: Database Setup (MongoDB Atlas)

### Step 1: Create MongoDB Atlas Account
1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for free account
3. Create a new project (name it "SpendWise")

### Step 2: Create a Database Cluster
1. Click "Create" → Choose **M0 Sandbox** (free tier)
2. Select your region (closest to your users)
3. Wait for cluster to deploy (~5-10 minutes)

### Step 3: Set Up Database Access
1. Go to **Database Access** in left sidebar
2. Click **Add New Database User**
3. Create username & strong password (save these!)
4. Click **Add User**

### Step 4: Set Up Network Access
1. Go to **Network Access** in left sidebar
2. Click **Add IP Address**
3. Select **Allow Access from Anywhere** (0.0.0.0/0) for development
   - For production: Add only your server's IP address
4. Click **Confirm**

### Step 5: Get Connection String
1. Go to **Databases** → Click **Connect**
2. Choose **Connect your application**
3. Copy the connection string
4. Replace `<username>`, `<password>` with your database credentials
5. Example: `mongodb+srv://username:password@cluster.mongodb.net/spendwise?retryWrites=true&w=majority`

---

## Part 2: Backend Deployment

### Option A: Deploy to Render (Recommended - Free)

#### Step 1: Prepare Backend for Deployment
1. Ensure `.gitignore` excludes `.env` file
2. Update `server/.env` with production variables:

```bash
# Production Environment Variables
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/spendwise
JWT_SECRET=your-super-secret-jwt-key-change-this
CLIENT_URL=https://your-frontend-url.com
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-backend-url.com/api/auth/google/callback
DEMO_AUTH=true
TWILIO_ACCOUNT_SID=your-twilio-sid (optional)
TWILIO_AUTH_TOKEN=your-twilio-token (optional)
TWILIO_PHONE_NUMBER=your-twilio-phone (optional)
```

#### Step 2: Push Code to GitHub
```bash
cd /Users/dhananjaymandal/Desktop/SpendWise
git init
git add .
git commit -m "Initial commit: SpendWise with Budget Alerts"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/spendwise.git
git push -u origin main
```

#### Step 3: Deploy to Render
1. Go to [https://render.com](https://render.com)
2. Sign up with GitHub
3. Click **New** → **Web Service**
4. Connect your GitHub repository
5. Configure:
   - **Name**: `spendwise-api`
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Instance Type**: Free (or Starter for production)

6. Click **Advanced** and add Environment Variables:
   ```
   MONGO_URI = mongodb+srv://username:password@...
   JWT_SECRET = your-secret-key
   CLIENT_URL = https://your-frontend-url.com
   GOOGLE_CLIENT_ID = your-id
   GOOGLE_CLIENT_SECRET = your-secret
   GOOGLE_CALLBACK_URL = https://your-backend-url/api/auth/google/callback
   ```

7. Click **Deploy**
8. Wait for deployment to complete (~2-5 minutes)
9. Note your backend URL: `https://spendwise-api.onrender.com`

### Option B: Deploy to Heroku

```bash
# Install Heroku CLI
brew tap heroku/brew && brew install heroku

# Login to Heroku
heroku login

# Create app
heroku create spendwise-api

# Set environment variables
heroku config:set MONGO_URI="mongodb+srv://..." --app spendwise-api
heroku config:set JWT_SECRET="your-secret" --app spendwise-api
heroku config:set CLIENT_URL="https://your-frontend-url.com" --app spendwise-api
# ... add other variables

# Deploy
git push heroku main
```

### Option C: Deploy to Railway

1. Go to [https://railway.app](https://railway.app)
2. Sign up with GitHub
3. Click **Create** → **Deploy from GitHub repo**
4. Select your repository
5. Select `server` directory in settings
6. Add environment variables in Dashboard
7. Railway auto-deploys on push!

---

## Part 3: Frontend Deployment

### Option A: Deploy to Vercel (Recommended - Free)

#### Step 1: Create Vercel Account
1. Go to [https://vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Install Vercel CLI: `npm install -g vercel`

#### Step 2: Configure Frontend
1. Update `client/.env`:
```bash
VITE_API_URL=https://spendwise-api.onrender.com/api
```

2. Build the project:
```bash
cd client
npm run build
npm run lint
```

#### Step 3: Deploy to Vercel
```bash
cd client
vercel --prod
```

Or deploy through Vercel Dashboard:
1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Select your GitHub repository
4. Configure:
   - **Framework**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variables:
   ```
   VITE_API_URL = https://spendwise-api.onrender.com/api
   ```

6. Click **Deploy**
7. Your frontend is live at: `https://your-project.vercel.app`

### Option B: Deploy to Netlify

1. Go to [https://netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click **Add new site** → **Import an existing project**
4. Select GitHub repository
5. Configure:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

6. Add environment variables in **Site settings** → **Build & deploy** → **Environment**:
   ```
   VITE_API_URL = https://spendwise-api.onrender.com/api
   ```

7. Deploy!

### Option C: GitHub Pages

```bash
cd client

# Update vite.config.js
# Add: base: '/spendwise/'

# Build
npm run build

# Deploy to gh-pages branch
npm install --save-dev gh-pages

# Add to package.json:
# "predeploy": "npm run build",
# "deploy": "gh-pages -d dist"

npm run deploy
```

---

## Part 4: Google OAuth Setup (Optional but Recommended)

For the Netlify + Render setup, configure these production values in the hosting dashboards:

- Render: `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `DEMO_AUTH`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL`
- Netlify: `VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com/api`
- Set `CLIENT_URL` to the exact Netlify site URL, without a trailing slash.
- Set `GOOGLE_CALLBACK_URL` to `https://YOUR-RENDER-SERVICE.onrender.com/api/auth/google/callback`.
- In Google Cloud Console, add the Render callback URL under **Authorized redirect URIs**.

### Step 1: Create Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project: "SpendWise"
3. Enable **Google+ API**
4. Go to **Credentials** → **Create OAuth 2.0 Client ID**
5. Choose **Web application**
6. Add Authorized Redirect URIs:
   ```
   http://localhost:5173/auth/callback (for local dev)
   https://your-frontend-url.com/auth/callback (production)
   ```

7. Copy:
   - **Client ID**
   - **Client Secret**

### Step 2: Add to Environment Variables
- Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to both backend and frontend `.env` files
- Add `GOOGLE_CALLBACK_URL` to backend

---

## Part 5: Final Deployment Checklist

### Backend
- [ ] Environment variables configured correctly
- [ ] Database connection tested
- [ ] CORS set to production URL
- [ ] Error logging enabled
- [ ] Rate limiting configured
- [ ] All API endpoints tested
- [ ] Database backups configured

### Frontend
- [ ] API URL points to production backend
- [ ] All environment variables set
- [ ] Production build created successfully
- [ ] No console errors
- [ ] Responsive design tested
- [ ] Performance optimized
- [ ] Meta tags updated

### Testing
- [ ] Sign up/login works
- [ ] Add expense works
- [ ] Create budget works
- [ ] View budget alerts works
- [ ] Download PDF works
- [ ] Mobile responsiveness works

---

## Part 6: Post-Deployment

### Monitor Your App
1. **Backend**: Check logs on Render/Heroku dashboard
2. **Frontend**: Check Vercel/Netlify analytics
3. **Database**: Monitor MongoDB Atlas metrics

### Update Environment Variables
If you need to update variables later:

**Render:**
- Dashboard → Service → Environment

**Vercel:**
- Project Settings → Environment Variables

**Netlify:**
- Site Settings → Build & deploy → Environment

### Continuous Deployment
Both platforms auto-deploy on GitHub push! 🚀

### Custom Domain (Optional)
1. Render: Settings → Custom Domain
2. Vercel: Settings → Domains
3. Netlify: Domain Management

Add your domain DNS records as instructed.

---

## Common Issues & Solutions

### "Cannot find module" errors
```bash
# On server deployment platform:
npm install
```

### CORS errors
Update `CLIENT_URL` in backend `.env` to match your frontend URL

### Database connection timeout
- Check MongoDB Atlas network access (allow your server IP)
- Verify `MONGO_URI` is correct

### Build fails
```bash
# Clear cache and rebuild
npm cache clean --force
npm install
npm run build
```

### Environment variables not working
- Restart the deployment after adding variables
- Double-check variable names (case-sensitive)

---

## Quick Deploy Summary

```bash
# 1. Push to GitHub
git push origin main

# 2. Connect backend to Render/Heroku (auto-deploys on push)

# 3. Connect frontend to Vercel/Netlify (auto-deploys on push)

# 4. Test at production URLs

# That's it! 🎉
```

---

## Support & Monitoring

- **Error Logs**: Check your hosting platform dashboard
- **Performance**: Use Vercel Analytics / Netlify Analytics
- **Database**: MongoDB Atlas Metrics
- **Status Page**: Set up with Statuspage.io (optional)

---

## Next Steps

After deployment:
1. Test all features on production
2. Set up email notifications
3. Implement analytics
4. Plan for scalability
5. Set up automated backups

**Your app is now live! 🚀**
