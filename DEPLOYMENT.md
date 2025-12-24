# Production Deployment Guide

This guide walks you through deploying the platform to production using:
- **Backend**: Render (Docker container)
- **Frontend**: Vercel
- **Database**: Render PostgreSQL

## Prerequisites

- GitHub repository with your code
- [Render account](https://render.com)
- [Vercel account](https://vercel.com)
- [UploadThing account](https://uploadthing.com) for file uploads

## Part 1: Database Setup (Render)

### 1.1 Create PostgreSQL Database

1. Log in to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "PostgreSQL"
3. Configure database:
   - **Name**: `platform-db`
   - **Database**: `platform`
   - **User**: `platform_user`
   - **Region**: Choose closest to your users (e.g., Frankfurt)
   - **Plan**: Free or Starter
4. Click "Create Database"
5. **Save the Internal Database URL** from the dashboard (starts with `postgresql://`)

### 1.2 Run Initial Migration

Once database is created:

```bash
# Set environment variable with your database URL from Render
export DATABASE_URL="postgresql://platform_user:password@hostname/platform"

# Run migration script
cd backend
./migrate.sh
```

Or run directly via Render's PostgreSQL shell:
1. Go to your database in Render dashboard
2. Click "PSQL Command" tab
3. Copy contents of `backend/internal/db/schema.sql`
4. Paste and execute

## Part 2: Backend Deployment (Render)

### 2.1 Create Web Service

1. In Render Dashboard, click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure service:
   - **Name**: `platform-backend`
   - **Region**: Same as database (Frankfurt)
   - **Branch**: `main`
   - **Root Directory**: (leave empty or `backend` if using monorepo)
   - **Environment**: `Docker`
   - **Dockerfile Path**: `./Dockerfile` (or `./backend/Dockerfile`)
   - **Plan**: Free or Starter

### 2.2 Configure Environment Variables

Add these in the "Environment" section:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | From your PostgreSQL instance (use internal URL) |
| `JWT_SECRET` | Generate a secure random string (use `openssl rand -hex 32`) |
| `PORT` | `8080` |
| `CORS_ALLOWED_ORIGINS` | Your Vercel frontend URL (add after frontend deployment) |

> **Note**: You can link `DATABASE_URL` directly from your database instance using Render's database linking feature.

### 2.3 Deploy Backend

1. Click "Create Web Service"
2. Render will build the Docker image and deploy
3. Wait for deployment to complete (check logs for any errors)
4. **Save your backend URL** (e.g., `https://platform-backend.onrender.com`)

### 2.4 Verify Backend Health

Visit `https://your-backend.onrender.com/health` - you should see a success response.

## Part 3: Frontend Deployment (Vercel)

### 3.1 Prepare Environment Variables

Create a `.env.production` file in the `frontend/` directory (do NOT commit):

```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
UPLOADTHING_SECRET=sk_live_xxxxx
UPLOADTHING_APP_ID=your_app_id
```

### 3.2 Deploy to Vercel

#### Option A: Via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Import your GitHub repository
3. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend` (if monorepo, otherwise leave empty)
   - **Build Command**: `pnpm run build` (or leave default)
   - **Install Command**: `pnpm install`

4. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL`: Your Render backend URL (MUST include `/api` at the end, e.g., `https://project.onrender.com/api`)
   - `UPLOADTHING_SECRET`: From UploadThing dashboard
   - `UPLOADTHING_APP_ID`: From UploadThing dashboard

5. Click "Deploy"

#### Option B: Via Vercel CLI

```bash
cd frontend
pnpm install -g vercel
vercel --prod
```

Follow the prompts and add environment variables when asked.

### 3.3 Update Backend CORS

After frontend deployment:

1. Go to Render backend service
2. Update `CORS_ALLOWED_ORIGINS` environment variable:
   ```
   https://your-app.vercel.app,https://your-app-git-main-yourname.vercel.app
   ```
3. Restart backend service for changes to take effect

## Part 4: UploadThing Configuration

### 4.1 Set Upload Thing Allowed Origins

1. Go to [UploadThing Dashboard](https://uploadthing.com/dashboard)
2. Navigate to your app settings
3. Add allowed origins:
   - `https://your-app.vercel.app`
   - `http://localhost:3000` (for local development)

## Part 5: Verification & Testing

### 5.1 Backend Health Check
```bash
curl https://your-backend.onrender.com/health
# Should return: {"status":"healthy"}
```

### 5.2 Database Connection
1. Go to Render PostgreSQL dashboard
2. Click "PSQL Command"
3. Run: `\dt` to list all tables
4. Verify all schema tables exist

### 5.3 Frontend-Backend Integration
1. Visit your Vercel frontend URL
2. Navigate to login page
3. Attempt to log in (create test user if needed)
4. Verify API calls work in browser dev tools Network tab

### 5.4 End-to-End Test
1. Log in to the platform
2. Create a test client
3. Upload a document
4. Verify data persists across page refreshes

## Troubleshooting

### Backend Issues

**Error: "Connection refused" or "Database connection failed"**
- Verify `DATABASE_URL` is correctly set in Render
- Ensure database is running and accessible
- Check database URL uses internal connection string (not external)

**Error: "Port already in use"**
- Render requires port 8080 - ensure `PORT=8080` is set
- Verify Dockerfile exposes port 8080

**CORS errors in browser console**
- Update `CORS_ALLOWED_ORIGINS` with exact Vercel URL
- Include both production URL and preview URLs
- Restart backend service after changing env vars

### Frontend Issues

**Error: "API calls failing" or "Network error"**
- Verify `NEXT_PUBLIC_API_URL` points to correct Render backend
- Check backend is running (`/health` endpoint)
- Ensure backend CORS allows your Vercel domain

**Error: "Environment variable not found"**
- Environment variables starting with `NEXT_PUBLIC_` must be set at build time
- Redeploy frontend after adding/changing env vars

**File uploads not working**
- Verify UploadThing credentials are correct
- Check allowed origins in UploadThing dashboard
- Ensure UploadThing app is active

### Database Issues

**Error: "Schema not found" or "Table doesn't exist"**
- Run migration script again: `./backend/migrate.sh`
- Or manually run SQL via Render PostgreSQL dashboard

**Error: "Too many connections"**
- Free tier PostgreSQL has connection limits
- Review connection pooling in application code
- Consider upgrading database plan

## Maintenance

### Updating Schema
1. Modify `backend/internal/db/schema.sql`
2. Run migration: `./backend/migrate.sh` (with production DATABASE_URL)
3. Or execute via Render PostgreSQL shell

### Viewing Logs
- **Backend**: Render Dashboard → Your service → Logs tab
- **Frontend**: Vercel Dashboard → Your project → Deployments → View logs
- **Database**: Render Dashboard → PostgreSQL → Logs tab

### Scaling
- **Backend**: Render Dashboard → Service → upgrade plan for more resources
- **Frontend**: Vercel automatically scales
- **Database**: Render PostgreSQL → upgrade for more connections/storage

## Security Checklist

- [ ] Change default JWT_SECRET to strong random value
- [ ] Use environment variables for all secrets (never commit `.env`)
- [ ] Enable HTTPS only (Render & Vercel do this by default)
- [ ] Restrict CORS to specific frontend domains
- [ ] Use internal database URL for backend (not external)
- [ ] Regularly update dependencies
- [ ] Monitor logs for suspicious activity

## Support

If you encounter issues:
1. Check Render/Vercel status pages
2. Review service logs in respective dashboards
3. Verify all environment variables are correctly set
4. Test locally first with production-like configuration

---

**Deployment completed successfully?** 🎉
Your platform should now be live and accessible via your Vercel URL!
