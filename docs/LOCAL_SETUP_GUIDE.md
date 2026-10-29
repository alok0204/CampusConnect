# Campus Connect — Verified Local Development & Troubleshooting Guide

This guide provides the exact, verified steps required to install, configure, run, and test **Campus Connect** on a local developer workstation.

---

## 1. Prerequisites & System Requirements

| Requirement | Minimum Supported Version | Recommended Version | Verification Command |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v18.17.0` | `v20.x` or `v22.x LTS` (Tested on `v24.19.0`) | `node -v` |
| **npm** | `9.0.0` | `10.x` or `11.x` (Tested on `11.17.0`) | `npm -v` |
| **Git** | `2.30.0` | `2.40+` | `git --version` |
| **MongoDB** | Optional | MongoDB Community 6.0+ | `mongod --version` |

> [!NOTE]
> **Zero-Configuration MongoDB**: You do **not** need to install or run MongoDB locally to develop or evaluate Campus Connect. If a local MongoDB instance is not detected at `mongodb://127.0.0.1:27017`, the backend automatically starts an embedded, in-memory MongoDB server via `mongodb-memory-server` and seeds it with demo accounts.

---

## 2. Step-by-Step Installation

### Step 1: Clone Repository
```bash
git clone https://github.com/your-username/campusconnect.git
cd campusconnect
```

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 3: Install Frontend Dependencies
```bash
cd ../frontend
npm install
cd ..
```

---

## 3. Environment Variable Configuration

### 3.1 Backend Configuration (`backend/.env`)
Create a `.env` file in the `backend/` directory:
```bash
# In backend/.env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/campusconnect
JWT_SECRET=campus_connect_dev_secret_key_change_in_production_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 3.2 Frontend Configuration (`frontend/.env` - Optional in Dev)
In development, the Vite server automatically reverse-proxies `/api` and `/uploads` to `http://localhost:5000`. If you wish to specify an explicit endpoint:
```bash
# In frontend/.env (Optional for local dev)
VITE_API_URL=http://localhost:5000/api
```

---

## 4. Starting the Services

Open two terminal windows:

### Terminal 1: Launch Backend API Server
```bash
cd backend
npm run dev
```
**Expected Terminal Output:**
```
[nodemon] starting `node src/server.js`
✅ MongoDB Connected (or Fallback in-memory MongoDB connected)
🚀 Campus Connect Server running on http://localhost:5000
```

### Terminal 2: Launch Frontend Development Server
```bash
cd frontend
npm run dev
```
**Expected Terminal Output:**
```
  VITE v5.4.21 ready in 1200 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

---

## 5. Verification & Health Check

1. **Verify Backend Health**:
   Open a browser or terminal and request:
   ```bash
   curl http://localhost:5000/api/health
   ```
   **Expected JSON Response:**
   ```json
   {
     "status": "OK",
     "app": "Campus Connect API",
     "version": "1.0.0"
   }
   ```

2. **Verify Frontend Interface**:
   Navigate to [http://localhost:5173](http://localhost:5173). You will be greeted by the Campus Connect login portal.

---

## 6. Pre-Seeded Demo Test Accounts

The system automatically initializes 5 demo users with distinct roles, departments, and semesters. The login screen also features **1-click credential fill buttons**.

| Role | Name | Email / ID | Password | Department / Academic Details |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Campus Administrator | `admin@campus.edu` or `ADMIN001` | `Admin@123` | Campus IT / Central Administration |
| **Student A** | Anshul Sharma | `anshul.cse@campus.edu` or `22CSE042` | `Student@123` | Computer Science • 2nd Year • Section A |
| **Student B** | Rohit Verma | `rohit.ece@campus.edu` or `22ECE018` | `Student@123` | Electronics & Comm • 2nd Year • Section B |
| **Student C** | Sneha Patel | `sneha.cse@campus.edu` or `21CSE089` | `Student@123` | Computer Science • 3rd Year • Section A |
| **Faculty** | Dr. Rajesh Sharma | `dr.sharma@campus.edu` or `FAC_CSE_101` | `Faculty@123` | Computer Science & Engineering |

---

## 7. Running Built-In Integration Test Suites

Campus Connect includes verified, automated integration test suites located in `backend/src/utils/`. Ensure the backend server is running on port 5000 before executing these tests:

### 1. Run Master End-to-End Simulation (Phases 1 - 7)
Tests authentication, event moderation, claim workflows, audience targeting, club charters, notifications, and attack defenses:
```bash
node backend/src/utils/test-master-e2e.js
```
*(Expected Result: `🎉 ALL MASTER END-TO-END VERIFICATION CHECKS PASSED 100%! 🎉`)*

### 2. Run Image Upload & Validation Test
Verifies MIME type validation, 10MB limits, and static asset serving:
```bash
node backend/src/utils/test-upload.js
```

### 3. Run Global Avatar Synchronization Test
Verifies profile photo updates propagate across all entities:
```bash
node backend/src/utils/test-avatar-sync.js
```

### 4. Run Event Chronological Timeline Layout Test
Verifies date grouping, horizon filters, and same-time vertical stacking:
```bash
node backend/src/utils/test-events-timeline.js
```

---

## 8. Troubleshooting & Common Issues

### Issue 1: Port 5000 or 5173 is already in use (`EADDRINUSE`)
- **Cause**: A previous Node or Vite process was not cleanly terminated.
- **Resolution (Windows PowerShell)**:
  ```powershell
  # Find process occupying port 5000
  Get-NetTCPConnection -LocalPort 5000 | Select-Object OwningProcess
  # Terminate process by PID
  Stop-Process -Id <PID> -Force
  ```
- **Resolution (macOS / Linux)**:
  ```bash
  lsof -ti:5000 | xargs kill -9
  ```

### Issue 2: `connect ECONNREFUSED 127.0.0.1:27017`
- **Cause**: No local MongoDB service running.
- **Resolution**: This is normal in development. Campus Connect automatically catches this error, prints a friendly warning, and boots an embedded MongoDB memory server within seconds.

### Issue 3: "Network Error: Cannot connect to backend server"
- **Cause**: The frontend is running, but the backend Express server was not started or crashed.
- **Resolution**: Check the backend terminal for syntax or database errors. Ensure `npm run dev` in the `backend/` directory is running and displaying `Campus Connect Server running on http://localhost:5000`.

### Issue 4: Profile or event images do not display
- **Cause**: Uploaded image file was deleted from `backend/uploads/images/` or backend was restarted under in-memory MongoDB without persisting uploaded files.
- **Resolution**: Re-upload the image via the frontend profile or event creation form.
