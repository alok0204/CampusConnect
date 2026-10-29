# Campus Connect — Security Audit & Deployment Readiness Assessment

This document provides a rigorous architectural security review and a pre-flight deployment readiness audit of the **Campus Connect** codebase.

---

## 1. Security Audit & Vulnerability Assessment

### 1.1 Secret Management & Environment Variables
- **Finding 1.1.1 (High Severity)**: Fallback Hardcoded `JWT_SECRET`.
  - **Evidence**: In `backend/src/middleware/auth.js` (line 16) and `backend/src/utils/generateToken.js` (line 7), if `process.env.JWT_SECRET` is undefined, the code defaults to `'campus_connect_super_secret_jwt_key_2026'`.
  - **Impact**: If deployed without explicitly providing `JWT_SECRET` in environment variables, an attacker can forge administrative JWT tokens and gain complete system control.
  - **Remediation**: In production, throw a fatal process exit if `process.env.JWT_SECRET` is missing or shorter than 32 characters.
- **Finding 1.1.2 (Low Severity)**: Local `.env` committed or present in workspace.
  - **Evidence**: `backend/.env` exists locally. However, `.gitignore` correctly includes `.env` and `.env.*`.
  - **Remediation**: Ensure `.env` is never removed from `.gitignore`. Cloud hosting must supply environment variables via secure dashboard secrets.

---

### 1.2 Authentication & Authorization (RBAC) Controls
- **Finding 1.2.1 (Positive - Verified Defense)**: Role-Based Access Control Gates.
  - **Evidence**: Verified via `test-master-e2e.js`. All admin routes (`/api/events/admin/*`, `/api/lost-found/admin/*`, `/api/announcements/admin/*`, `/api/clubs/admin/*`) are protected by both `protect` and `authorize('ADMIN')`.
  - **Test Result**: Unauthenticated requests return `401 Unauthorized`. Non-admin requests (Students/Faculty) return `403 Forbidden`.
- **Finding 1.2.2 (Positive - Verified Defense)**: Password Hashing & Information Leakage.
  - **Evidence**: Passwords hashed using `bcryptjs` with 10 salt rounds (`User.hashPassword`). `passwordHash` field explicitly specifies `select: false` in `User.js`. User controllers and login endpoints strictly omit `passwordHash` from API outputs.
- **Finding 1.2.3 (Medium Severity)**: Missing Rate Limiting on Authentication Endpoints.
  - **Evidence**: `server.js` and `authRoutes.js` do not implement rate limiting middleware (such as `express-rate-limit`).
  - **Impact**: `POST /api/auth/login` is vulnerable to credential brute-force and dictionary attacks.
  - **Remediation**: Introduce `express-rate-limit` restricting login attempts to 5 per minute per IP address.

---

### 1.3 CORS & Network Exposure
- **Finding 1.3.1 (Medium Severity)**: Development CORS Dynamic Regex.
  - **Evidence**: `backend/src/server.js` (lines 48-56) permits connections from private subnets (`192.168.x.x`, `10.x.x.x`, `172.x.x.x`) and if `NODE_ENV !== 'production'`, returns `callback(null, true)` for all origins.
  - **Impact**: Safe in development, but in production, if `NODE_ENV` is not set to `'production'`, the server becomes an open CORS proxy.
  - **Remediation**: Require `NODE_ENV=production` in production deployment and explicitly set `CLIENT_URL` to the exact frontend domain.

---

### 1.4 File Upload Security & Storage
- **Finding 1.4.1 (Positive - Verified Defense)**: File MIME & Extension Verification.
  - **Evidence**: `backend/src/middleware/upload.js` verifies both `file.mimetype` (`image/jpeg`, `image/png`, `image/webp`) and file extension, and limits file sizes to 10 MB. Verified with `test-upload.js`.
- **Finding 1.4.2 (Critical Deployment Blocker)**: Ephemeral Filesystem Data Loss.
  - **Evidence**: Uploaded images are stored directly on local disk at `backend/uploads/images/`.
  - **Impact**: On modern PaaS and containerized platforms (Render, Railway, Heroku, AWS Fargate), containers have ephemeral filesystems. Any server restart or redeploy completely deletes all user profile pictures and uploaded event images.
  - **Remediation**: For production, either attach a persistent Docker volume or integrate an object storage service like AWS S3 or Cloudinary.

---

## 2. Deployment Readiness Assessment

| Deployment Dimension | Current State in Repository | Production Requirement | Readiness Status |
| :--- | :--- | :--- | :--- |
| **Frontend Static Bundle** | Builds clean via `npm run build` producing `dist/` (83 KB CSS, 668 KB JS) | Host on CDN (Vercel, Netlify, CloudFront) with SPA rewrite rule (`/* -> /index.html`) | **Ready** |
| **Backend API Service** | Node.js Express server running on port 5000 | Containerized Node.js service (Render, AWS ECS, Railway, Fly.io) | **Ready** (Requires Env Config) |
| **Database Instance** | Development MongoDB Memory Server / Local 27017 | Managed MongoDB Atlas M10+ Cluster | **Ready** (Needs Atlas URI) |
| **Asset Storage** | Local disk directory `backend/uploads/images` | Cloud Object Storage (S3, Cloudinary) or Persistent Volume | **Blocker** (Needs Storage Strategy) |
| **Containerization** | No `Dockerfile` or `docker-compose.yml` present | Create production `Dockerfile` for backend and frontend | **Recommended** |
| **Email Service** | Simulated dummy response in `forgotPassword` | Integrate Nodemailer, SendGrid, or AWS SES | **Optional Enhancement** |
| **Security Headers & Rate Limits** | Basic Express setup; no `helmet` or `express-rate-limit` | Add Helmet middleware and login rate limiting | **Pre-flight Improvement** |

---

## 3. Required Environment Variables Specification

### 3.1 Backend Environment Variables (`backend/.env`)

| Variable Name | Required | Default in Code | Purpose | Production Value Example |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | **Yes** | `'development'` | Controls logging, error stacks, and CORS enforcement | `production` |
| `PORT` | No | `5000` | Port for Express HTTP listener | `5000` (or provided by PaaS `$PORT`) |
| `MONGODB_URI` | **Yes** | `mongodb://127.0.0.1:27017/campusconnect` | Connection string to MongoDB cluster | `mongodb+srv://<user>:<pwd>@cluster.mongodb.net/campusconnect?retryWrites=true&w=majority` |
| `JWT_SECRET` | **Yes** | `'campus_connect_super_secret_jwt_key_2026'` | Symmetric encryption secret for token signing | Minimum 32-character random string (e.g. generated via `openssl rand -hex 32`) |
| `JWT_EXPIRES_IN`| No | `'7d'` | Expiration duration for user sessions | `'7d'` or `'24h'` |
| `CLIENT_URL` | **Yes** | `'http://localhost:5173'` | Allowed origin for CORS headers | `https://campusconnect.yourinstitution.edu` |

### 3.2 Frontend Environment Variables (`frontend/.env`)

| Variable Name | Required | Default in Code | Purpose | Production Value Example |
| :--- | :--- | :--- | :--- | :--- |
| `VITE_API_URL` | **Yes** | `'/api'` | Base URL prefix for backend API calls | `https://api.campusconnect.yourinstitution.edu/api` |

---

## 4. Pre-Flight Deployment Blockers Checklist

Before promoting Campus Connect to a public production environment, the following actions must be executed:

- [ ] **Blocker 1 (Data Persistence)**: Provision a production MongoDB Atlas cluster and replace `mongodb://127.0.0.1:27017` with the Atlas connection string. Disable `mongodb-memory-server` in production.
- [ ] **Blocker 2 (Cryptographic Security)**: Generate a unique, cryptographically random `JWT_SECRET` in production configuration. Never use the default fallback key.
- [ ] **Blocker 3 (Media Persistence)**: Implement persistent storage for uploaded files (either mount a persistent volume to `backend/uploads` or integrate an S3/Cloudinary storage adapter).
- [ ] **Blocker 4 (CORS Restriction)**: Set `CLIENT_URL` strictly to the production frontend domain and ensure `NODE_ENV=production`.
- [ ] **Blocker 5 (SPA Routing)**: Configure the frontend static host (e.g., `_redirects` for Netlify, `vercel.json` for Vercel, or Nginx `try_files $uri /index.html`) so refreshing deep links (`/events/:id`, `/lost-found/:id`) does not return HTTP 404.
- [ ] **Blocker 6 (Abuse Protection)**: Install `express-rate-limit` on `/api/auth/login` to prevent credential stuffing.
