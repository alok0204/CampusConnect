# Campus Connect — Campus Management System (Mini Project)

Campus Connect is a modern, responsive full-stack college management web application designed for students, faculty, and administrators.

---

## 🚀 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, React Router v6, Axios
- **Backend**: Node.js, Express.js, MongoDB / Mongoose, JWT, bcryptjs, CORS, Morgan
- **Security**: Password hashing (bcryptjs), JSON Web Tokens (JWT), Role-Based Access Control (RBAC), Backend branch-based & ownership access enforcement

---

## 📁 Project Structure

```text
campusconnect/
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB database connection
│   │   ├── controllers/     # Auth, User, and Event controllers
│   │   ├── middleware/      # JWT Protect, RBAC Authorize, Error handling
│   │   ├── models/          # Mongoose Models (User, Event)
│   │   ├── routes/          # REST API route endpoints (auth, users, events)
│   │   ├── utils/           # Token helper, seed script, smoke & regression tests
│   │   └── server.js        # Express app entry point
│   ├── .env.example
│   ├── .env
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/      # ProtectedRoute, UI widgets
    │   ├── context/         # AuthContext provider
    │   ├── layouts/         # DashboardLayout (Sidebar, Top Bar, Header badges)
    │   ├── pages/           # Login, Signup, Dashboard, Profile, Events, CreateEvent, MyEvents, EventDetails, AdminEvents
    │   ├── services/        # Axios API client with Bearer token interceptor
    │   ├── App.jsx          # Route configuration
    │   └── main.jsx         # App mounting
    ├── index.html
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`):
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/campusconnect
JWT_SECRET=campus_connect_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

> **Note on MongoDB**: If a local MongoDB instance is running, Campus Connect automatically connects to it. If not, a zero-configuration embedded MongoDB automatically starts in development mode.

---

## 🏃 How to Run the Project

### 1. Start Backend Server:
```bash
cd backend
npm install
npm run dev
# Server will run at http://localhost:5000
```

### 2. Start Frontend App:
```bash
cd frontend
npm install
npm run dev
# App will run at http://localhost:5173
```

---

## 🔑 Default Test Accounts

| Role | Name | Email / ID | Password | Department / Branch |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Campus Administrator | `admin@campus.edu` or `ADMIN001` | `Admin@123` | Campus IT / Central Admin |
| **Student A** | Anshul Sharma | `anshul.cse@campus.edu` or `22CSE042` | `Student@123` | CSE • 2nd Year • Section A |
| **Student B** | Rohit Verma | `rohit.ece@campus.edu` or `22ECE018` | `Student@123` | ECE • 2nd Year • Section B |
| **Student C** | Sneha Patel | `sneha.cse@campus.edu` or `21CSE089` | `Student@123` | CSE • 3rd Year • Section A |
| **Faculty** | Dr. Rajesh Sharma | `dr.sharma@campus.edu` or `FAC_CSE_101` | `Faculty@123` | Computer Science & Engineering |

*(The login screen also provides quick 1-click test fill buttons for instant evaluation!)*

---

## 📡 API Endpoints

### Events Module (`/api/events`) — Phase 2
- `GET /api/events` — Get all approved events (Branch-restricted on backend for non-admins)
- `GET /api/events/:id` — Get single event by ID (403 if unapproved and caller is not creator/admin)
- `POST /api/events` — Create event (status = `pending` for students/faculty)
- `GET /api/events/my-events` — Get events submitted by current user
- `PUT /api/events/:id` — Update event (Creator or Admin only)
- `DELETE /api/events/:id` — Delete event (Creator or Admin only)
- `PUT /api/events/:id/cancel` — Mark event as cancelled
- `GET /api/events/admin/all` — Admin view of all events with status filter (`pending`, `approved`, `rejected`, `cancelled`)
- `PUT /api/events/:id/approve` — Admin approves event
- `PUT /api/events/:id/reject` — Admin rejects event with rejection reason

### Authentication (`/api/auth`) — Phase 1
- `POST /api/auth/login` — Universal login for all roles
- `POST /api/auth/register-student` — Student signup with Branch, Year, Section, Roll Number
- `POST /api/auth/register-faculty` — Faculty signup with Official Email, Department, Employee ID
- `GET /api/auth/me` — Get current logged-in user profile
- `POST /api/auth/forgot-password` — Password reset assistance instructions

### User Profile (`/api/users`) — Phase 1
- `GET /api/users/profile` — Get full profile with joined clubs
- `PUT /api/users/profile` — Update student/faculty profile
- `GET /api/users` — Admin-only view of all registered campus users
