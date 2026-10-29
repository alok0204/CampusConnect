# Campus Connect — Technology Stack & Dependency Inventory

This document provides a verified, comprehensive inventory of all technologies, libraries, runtimes, and build tools utilized across the **Campus Connect** codebase. All version numbers and usage paths are verified directly from repository manifests (`package.json`, `package-lock.json`) and source code inspection.

---

## 1. Core Runtime & Infrastructure Overview

| Technology | Detected Version | Purpose / Role | Repository Location | Execution Stage | Compatibility & Deployment Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Node.js** | `v24.19.0` (Host Environment) | Server-side JavaScript runtime powering backend API and build tooling | System runtime | Runtime & Build | Compatible with Node.js 18.x, 20.x, 22.x, and 24.x LTS. In production, Node 20.x or 22.x LTS is standard. |
| **npm** | `11.17.0` (Host Environment) | Package manager for dependency resolution and execution scripts | System runtime | Development & Build | Uses `package-lock.json` format v3. |
| **MongoDB** | `6.0.14` (Embedded Dev) / Community 6.0+ | Primary NoSQL document database storing users, events, notices, clubs, claims | Database Service | Runtime | Requires a persistent MongoDB connection string (`MONGODB_URI`) in production (e.g. MongoDB Atlas). |
| **Operating System** | Windows 10/11 / POSIX Compatible | Host OS platform | Host system | All | Development uses standard cross-platform paths (`path.join()`), compatible with Linux/Docker containers. |

---

## 2. Backend Technology Inventory

All backend dependencies are defined in `backend/package.json` with exact versions locked in `backend/package-lock.json`.

| Dependency | Manifest Range | Locked Version | Purpose in Campus Connect | Key Repository Files | Stage | Deployment & Production Concerns |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Express.js** | `^4.19.2` | `4.22.2` | Web framework providing routing, HTTP pipeline, and middleware chaining | `backend/src/server.js`, `backend/src/routes/*` | Runtime | Highly stable. Must configure trust proxy in production if behind reverse proxies (Nginx/Cloudflare). |
| **Mongoose** | `^8.4.0` | `8.24.3` | Object Data Modeling (ODM) library for MongoDB schema validation and indexing | `backend/src/models/*`, `backend/src/config/db.js` | Runtime | Mongoose 8 enforces strict schema checking. `serverSelectionTimeoutMS` is configured to 3000ms. |
| **jsonwebtoken** | `^9.0.2` | `9.0.3` | Signs and verifies stateless HMAC-SHA256 JWT bearer authentication tokens | `backend/src/utils/generateToken.js`, `backend/src/middleware/auth.js` | Runtime | Secret currently defaults to fallback key if `JWT_SECRET` is unset. A cryptographically random secret must be supplied in production. |
| **bcryptjs** | `^2.4.3` | `2.4.3` | One-way password hashing using Blowfish cipher with 10 salt rounds | `backend/src/models/User.js`, `backend/src/controllers/authController.js` | Runtime | Pure JavaScript implementation of bcrypt; avoids native C++ build requirements, making containerization seamless. |
| **multer** | `^2.2.0` | `2.2.0` | Multipart/form-data handler for local disk image uploads | `backend/src/middleware/upload.js`, `backend/src/routes/uploadRoutes.js` | Runtime | Uses `diskStorage` pointing to local `backend/uploads/images/`. Ephemeral container platforms (Render, Heroku) require S3/Cloudinary storage. |
| **cors** | `^2.8.5` | `2.8.6` | Configures Cross-Origin Resource Sharing headers for frontend web clients | `backend/src/server.js` | Runtime | Configured with dynamic origin validation. In production, `CLIENT_URL` must match the production frontend domain. |
| **morgan** | `^1.10.0` | `1.11.0` | HTTP request logger middleware | `backend/src/server.js` | Runtime | Only active when `NODE_ENV !== 'production'`. Clean console in production. |
| **cookie-parser** | `^1.4.6` | `1.4.7` | Parses cookie headers and populates `req.cookies` | `backend/src/server.js` | Runtime | Present in pipeline for future cookie-based session extension; JWT currently transmitted via Bearer Authorization header. |
| **dotenv** | `^16.4.5` | `16.6.1` | Loads configuration from `.env` into `process.env` | `backend/src/server.js` | Runtime | Standard environment loader. Production platforms inject environment variables natively. |
| **nodemon** | `^3.1.0` | `3.1.14` | Hot-reloading development daemon monitoring file changes | `backend/package.json` (`npm run dev`) | Development | Used only in development. Production uses `npm start` (`node src/server.js`). |
| **mongodb-memory-server** | `^9.2.0` | `9.5.0` | In-memory MongoDB binaries for zero-config local development | `backend/src/config/db.js` | Development | Automatically downloads MongoDB binary if local connection fails. Must **never** be used in production. |

---

## 3. Frontend Technology Inventory

All frontend dependencies are defined in `frontend/package.json` with exact versions locked in `frontend/package-lock.json`.

| Dependency | Manifest Range | Locked Version | Purpose in Campus Connect | Key Repository Files | Stage | Deployment & Production Concerns |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **React** | `^18.3.1` | `18.3.1` | Declarative component UI library | `frontend/src/*` | Runtime | React 18 Concurrent Mode features. Fully compatible with modern evergreen browsers. |
| **React DOM** | `^18.3.1` | `18.3.1` | React renderer for the DOM | `frontend/src/main.jsx` | Runtime | StrictMode enabled in `main.jsx`. |
| **React Router DOM** | `^6.23.1` | `6.30.6` | Client-side declarative routing, nested routes, and route guards | `frontend/src/App.jsx`, `frontend/src/components/ProtectedRoute.jsx` | Runtime | Uses `BrowserRouter`. Production static hosting (Nginx/Vercel/Netlify) requires rewrite rules to `index.html` to prevent 404 on refresh. |
| **Vite** | `^5.2.11` | `5.4.21` | Frontend build tool and rapid development server | `frontend/vite.config.js` | Build & Dev | Produces optimized, minified production assets in `frontend/dist/`. Configured with reverse-proxy for local dev. |
| **@vitejs/plugin-react** | `^4.3.0` | `4.3.4` | Vite plugin providing Fast Refresh via Babel / React compiler | `frontend/vite.config.js` | Build & Dev | Fast HMR in development. |
| **Tailwind CSS** | `^3.4.3` | `3.4.19` | Utility-first CSS framework for modern responsive UI | `frontend/tailwind.config.js`, `frontend/src/index.css` | Build & Dev | Extends typography and palettes. JIT compilation strips unused classes, yielding an 83 KB production stylesheet. |
| **PostCSS** | `^8.4.38` | `8.5.26` | CSS transformation engine powering Tailwind and autoprefixing | `frontend/postcss.config.js` | Build | Build pipeline component. |
| **Autoprefixer** | `^10.4.19` | `10.5.4` | Automatically adds vendor prefixes to CSS rules | `frontend/postcss.config.js` | Build | Ensures cross-browser CSS grid and flexbox compatibility. |
| **Axios** | `^1.7.2` | `1.19.0` | Promise-based HTTP client with request and response interceptors | `frontend/src/services/api.js` | Runtime | Injects JWT Bearer token on outgoing requests; intercepts 401 Unauthorized to auto-logout expired sessions. |
| **Lucide React** | `^0.383.0` | `0.383.0` | Comprehensive icon library for dashboard, badges, and action buttons | `frontend/src/components/*`, `frontend/src/pages/*` | Runtime | Tree-shakeable SVG icons. Minimal production bundle impact. |
| **clsx** | `^2.1.1` | `2.1.1` | Utility for conditionally constructing `className` strings | `frontend/package.json` | Runtime | Helper for dynamic class combinations. |
| **tailwind-merge** | `^2.3.0` | `2.6.0` | Utility to merge Tailwind classes without style conflicts | `frontend/package.json` | Runtime | Resolves Tailwind precedence conflicts. |

---

## 4. Architectural Stack Categorization

```text
Authentication:           JSON Web Tokens (JWT) + bcryptjs (10 salt rounds)
Authorization:            Role-Based Access Control (STUDENT | FACULTY | ADMIN)
State Management:         React Context API (AuthContext, ThemeContext)
API Protocol:             RESTful JSON over HTTP/1.1 (Axios Client)
Media Uploads:            Multer diskStorage -> Static Express endpoint
Styling:                  Tailwind CSS v3 + CSS Variables (Dark/Light mode)
Database Engine:          MongoDB (Mongoose ODM v8)
Automated Testing:        Node.js Native Fetch Integration Test Suites
Build System:             Vite 5 (Rollup under the hood)
```

---

## 5. Security & Compatibility Matrix

| Aspect | Current Status in Repository | Assessment / Remediation for Deployment |
| :--- | :--- | :--- |
| **JWT Algorithm** | Default `HS256` symmetric signing | Standard for monolith web applications. Must ensure `JWT_SECRET` is >= 32 characters in production. |
| **Password Hashing** | `bcryptjs` with salt rounds = 10 | Cryptographically secure. Work factor balanced for reasonable server latency. |
| **CORS Policy** | Whitelists `CLIENT_URL`, localhost, and private LAN IP ranges | Production requires specifying exact production domains in `CLIENT_URL`. |
| **File Storage** | Local directory `backend/uploads/images` | Must transition to cloud object storage (S3/Cloudinary) if deployed to ephemeral serverless/containers. |
| **Database Migrations** | Schema-less Mongoose definitions | No formal migration tool (e.g. migrate-mongo). Field updates must be backwards-compatible. |
