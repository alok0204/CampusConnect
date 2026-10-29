# Campus Connect — Complete Project Overview & Architecture Blueprint

## 1. Executive Summary

**Campus Connect** is a centralized, role-based campus life and academic administration platform developed as a full-stack web application. The platform unifies critical institutional workflows that are traditionally fragmented across physical notice boards, unofficial WhatsApp/Telegram groups, departmental bulletin boards, and disconnected spreadsheets.

The application serves three distinct user cohorts within an academic institution:
1. **Students**: Access campus events, claim lost belongings, read targeted departmental circulars, join student clubs/societies, receive instant in-app alerts, and manage academic profiles.
2. **Faculty Members**: Issue verified academic circulars targeted to specific departments, semesters, and sections; coordinate student societies; monitor departmental activities.
3. **Campus Administrators**: Exercise central governance, approve/reject public event submissions, moderate lost and found claims, sanction club charters, broadcast college-wide emergency notices, and manage campus user directories.

---

## 2. Problem Statement & Scope

### 2.1 The Existing Campus Challenge
In conventional college campus setups:
- **Event Awareness**: Student hackathons, technical symposiums, and cultural festivals rely on posters or social media, resulting in scheduling conflicts, unapproved venue bookings, and low student participation.
- **Lost & Found Recovery**: Lost physical items (ID cards, calculators, chargers, lab equipment) are dropped at security checkpoints or departmental offices with no tracking system, leading to unclaimed items or fraudulent claims.
- **Notice Dissemination**: Physical circulars and email blasts lack granular filtering. Students are flooded with notices irrelevant to their branch/year, causing critical academic deadlines and exam circulars to be missed.
- **Student Societies & Clubs**: Club registrations and leadership elections are tracked in ad-hoc forms with no transparent member rosters or event calendars.

### 2.2 Project Scope
Campus Connect addresses these challenges by implementing an integrated web portal featuring:
- Role-Based Access Control (RBAC) with three strict privilege tiers (`STUDENT`, `FACULTY`, `ADMIN`).
- Departmental & Branch Data Isolation: Academic notices and event feeds can be targeted globally (`ALL`), by academic branch (e.g., `CSE`, `ECE`), by year (`1st Year` through `4th Year`), or by section (`Sec A`, `Sec B`).
- Moderation Workflow: Student-submitted events and club charters require administrator verification before appearing in official feeds.
- Cryptographic Verification & Verification Mechanisms: Ownership verification for lost belongings via detailed distinguishing characteristics and claim review notes.

---

## 3. High-Level System Architecture

Campus Connect is structured as a decoupled client-server architecture:
- **Frontend Layer**: A Single Page Application (SPA) built with React 18, Vite, Tailwind CSS, Lucide React icons, and React Router v6.
- **Backend Layer**: A RESTful API built on Node.js and Express.js, implementing JWT stateless authentication, role middleware, and Multer file upload handling.
- **Database Layer**: MongoDB managed via Mongoose ODM schemas, featuring automated development fallback via `mongodb-memory-server` and automated seeding on first run.

```
+-------------------------------------------------------------------------+
|                              CLIENT TIER                                |
|         React 18 + Vite SPA | Tailwind CSS | React Router v6            |
+-------------------------------------------------------------------------+
                                    |
                        HTTP / HTTPS (RESTful JSON)
                                    |
+-------------------------------------------------------------------------+
|                             API GATEWAY                                 |
|            Express.js Server (Port 5000) | CORS | Morgan                |
|       JWT Protect Middleware  <--->  RBAC Authorize Middleware          |
+-------------------------------------------------------------------------+
                                    |
        +---------------------------+---------------------------+
        |                           |                           |
+-------------------+       +-------------------+       +-------------------+
|  Auth & Users     |       | Campus Events     |       | Lost & Found      |
|  Controllers      |       | Controllers       |       | & Claims Engine   |
+-------------------+       +-------------------+       +-------------------+
        |                           |                           |
+-------------------+       +-------------------+       +-------------------+
| Circulars &       |       | Clubs & Societies |       | Notifications &   |
| Announcements     |       | Governance        |       | Activity Stream   |
+-------------------+       +-------------------+       +-------------------+
        |                           |                           |
        +---------------------------+---------------------------+
                                    |
                    Mongoose ODM (7 Schema Models)
                                    |
+-------------------------------------------------------------------------+
|                            DATABASE TIER                                |
|        MongoDB (Local Instance / Atlas / In-Memory Fallback)            |
+-------------------------------------------------------------------------+
                                    |
+-------------------------------------------------------------------------+
|                            STORAGE TIER                                 |
|               Local Filesystem (`backend/uploads/images`)               |
+-------------------------------------------------------------------------+
```

---

## 4. Repository Structure & Directory Responsibilities

```text
campusconnect/
├── .gitignore                      # Git exclusion rules for node_modules, .env, dist, and uploads
├── README.md                       # Quickstart documentation, tech stack overview, test accounts
├── package.json                    # Workspace level metadata (if configured)
│
├── backend/                        # Node.js + Express REST API
│   ├── .env                        # Local development environment configuration
│   ├── .env.example                # Template configuration with placeholder keys
│   ├── package.json                # Backend dependency manifest and scripts
│   ├── package-lock.json           # Locked dependency tree for deterministic builds
│   ├── uploads/                    # Local storage directory for media assets
│   │   ├── documents/              # Storage directory for document attachments (reserved)
│   │   └── images/                 # Active storage directory for uploaded avatars and banners
│   └── src/                        # Backend application source code
│       ├── server.js               # Application entry point, Express app initialization, CORS, static routes
│       ├── config/
│       │   └── db.js               # MongoDB Mongoose connection with embedded in-memory fallback
│       ├── controllers/            # Controller layer containing business logic
│       │   ├── announcementController.js # Circular publishing, filtering, read tracking
│       │   ├── authController.js         # Student/Faculty signup, universal login, session info
│       │   ├── clubController.js         # Club charter submission, membership lifecycle
│       │   ├── eventController.js        # Event CRUD, admin approvals, branch-restricted queries
│       │   ├── lostFoundController.js    # Item reporting, ownership claim verification
│       │   ├── notificationController.js # User notifications and activity streams
│       │   ├── uploadController.js       # Image upload controller, URL generation
│       │   └── userController.js         # User profile retrieval, profile picture updates
│       ├── middleware/             # Express middlewares
│       │   ├── auth.js             # JWT verification (`protect`) and role-checking (`authorize`)
│       │   ├── errorHandler.js     # Centralized error mapping (CastError, 11000 duplicate, ValidationError)
│       │   └── upload.js           # Multer storage configuration, 10MB limit, file type filtering
│       ├── models/                 # Mongoose data models
│       │   ├── Announcement.js     # Circulars schema with target audience fields
│       │   ├── Claim.js            # Lost & Found ownership claim verification schema
│       │   ├── Club.js             # Student club charter, leadership, and member rosters
│       │   ├── Event.js            # Campus events schema with approval status
│       │   ├── LostFound.js        # Lost and found item listing schema
│       │   ├── Notification.js     # User alert notifications and activity feed entries
│       │   └── User.js             # User identity, hashed passwords, college IDs, branch info
│       ├── routes/                 # Express router mapping routes to controllers
│       │   ├── announcementRoutes.js
│       │   ├── authRoutes.js
│       │   ├── clubRoutes.js
│       │   ├── eventRoutes.js
│       │   ├── lostFoundRoutes.js
│       │   ├── notificationRoutes.js
│       │   ├── uploadRoutes.js
│       │   └── userRoutes.js
│       ├── services/
│       │   └── notificationService.js # Internal service for event/claim/circular notification dispatch
│       └── utils/                  # Utility scripts, seeds, and test suites
│           ├── diagnose-auth.js    # JWT generation and role token diagnostic
│           ├── generateToken.js    # Helper to sign JWT tokens with expiry
│           ├── seed.js             # Automated database seed generator for 5 users and sample modules
│           ├── test-announcements-api.js # Integration test for circulars
│           ├── test-api.js               # Basic connectivity smoke test
│           ├── test-avatar-sync.js       # Cross-module avatar synchronization test
│           ├── test-clubs-api.js         # Clubs lifecycle test
│           ├── test-events-api.js        # Events approval and filtering test
│           ├── test-events-timeline.js   # Chronological sorting and layout verification test
│           ├── test-lostfound-api.js     # Lost & Found claims flow test
│           ├── test-master-e2e.js        # Complete 7-phase master production test suite
│           ├── test-notifications-api.js # Notification center test
│           └── test-upload.js            # Multer upload validation and persistence test
│
└── frontend/                       # React 18 + Vite Single Page Application
    ├── index.html                  # HTML entry template with fonts and root DOM node
    ├── package.json                # Frontend dependencies and Vite build scripts
    ├── package-lock.json           # Locked frontend dependency tree
    ├── postcss.config.js           # PostCSS configuration for Tailwind CSS
    ├── tailwind.config.js          # Tailwind CSS theme extension, color palettes, typography
    ├── vite.config.js              # Vite bundler configuration, dev server proxy for /api and /uploads
    ├── .env.example                # Example frontend environment variables (`VITE_API_URL`)
    └── src/                        # Frontend source code
        ├── main.jsx                # Application DOM mounting with StrictMode
        ├── App.jsx                 # Top-level route definitions and router layout nesting
        ├── index.css               # Global CSS styling and Tailwind directives
        ├── components/             # Reusable UI widgets
        │   ├── Avatar.jsx          # Dynamic avatar renderer with image fallbacks and initial badges
        │   ├── ImageUpload.jsx     # Drag-and-drop image upload widget with progress indicator
        │   ├── ImageViewerModal.jsx# Fullscreen lightbox modal for viewing item and event images
        │   └── ProtectedRoute.jsx  # Role-guard routing component redirecting unauthorized users
        ├── context/                # React Context state management
        │   ├── AuthContext.jsx     # Authentication state, login, registration, session persistence
        │   └── ThemeContext.jsx    # Dark/light mode theme toggle persisted to localStorage
        ├── layouts/                # Structural layout wrappers
        │   └── DashboardLayout.jsx # Collapsible sidebar, header bar, notification dropdown, search breadcrumb
        ├── pages/                  # Route view components
        │   ├── AdminAnnouncements.jsx # Administrative moderation console for circulars
        │   ├── AdminClubs.jsx         # Administrative approval and governance of club charters
        │   ├── AdminEvents.jsx        # Administrative approval/rejection panel for submitted events
        │   ├── AdminLostFound.jsx     # Administrative moderation console for lost & found notices
        │   ├── AdminOverview.jsx      # Master Administrative KPI dashboard
        │   ├── AnnouncementDetails.jsx# Detailed circular view with attachment link
        │   ├── Announcements.jsx      # Filterable gazette of official campus circulars
        │   ├── ClubDetails.jsx        # Society page with roster, leadership, and events
        │   ├── Clubs.jsx              # Directory of active campus societies and guilds
        │   ├── CreateAnnouncement.jsx # Circular composer with audience targeting
        │   ├── CreateClub.jsx         # Club charter proposal form
        │   ├── CreateEvent.jsx        # Event host submission form
        │   ├── CreateLostFound.jsx    # Lost or found item report form
        │   ├── Dashboard.jsx          # Primary overview hub with colored section accents
        │   ├── EventDetails.jsx       # Event view with venue info and cancel action
        │   ├── Events.jsx             # Filterable chronological calendar of campus events
        │   ├── FacultySignup.jsx      # Official registration for academic staff
        │   ├── Login.jsx              # Universal login screen with 1-click test credentials
        │   ├── LostFound.jsx          # Public feed of lost and found listings
        │   ├── LostFoundDetails.jsx   # Item details, claim submission form, and finder review
        │   ├── ManageAnnouncements.jsx# Author management panel for published notices
        │   ├── ModulePlaceholder.jsx  # Deprecated prototype placeholder component
        │   ├── MyClubs.jsx            # Joined clubs and leadership positions
        │   ├── MyEvents.jsx           # Events submitted by current user
        │   ├── MyLostFound.jsx        # User reported items and active ownership claims
        │   ├── Notifications.jsx      # Full-page notification center and activity stream
        │   ├── Profile.jsx            # Academic profile editor and avatar uploader
        │   └── StudentSignup.jsx      # Student registration form (branch, year, section)
        ├── services/
        │   └── api.js                 # Axios instance with request/response interceptors
        └── utils/
            └── imageUrl.js            # Helper to normalize remote, uploaded, and local image paths
```

---

## 5. Core Functional Modules Summary

| Module | Core Purpose | Key Actors | Primary Backend Route |
| :--- | :--- | :--- | :--- |
| **Authentication & Profile** | User onboarding, secure login, role issuance, session persistence, and avatar management. | All Users | `/api/auth`, `/api/users` |
| **Campus Events Hub** | Submission, moderation, chronological display, and branch filtering of campus events. | Students, Faculty, Admin | `/api/events` |
| **Lost & Found Hub** | Posting lost/found belongings, submitting ownership claims with evidence, and claim resolution. | Students, Faculty, Admin | `/api/lost-found` |
| **Campus Circulars** | Publishing administrative, academic, and emergency notices with granular audience targeting. | Faculty, Admin | `/api/announcements` |
| **Clubs & Societies** | Proposing student guilds, admin charter sanctioning, and member application management. | Students, Faculty, Admin | `/api/clubs` |
| **Notification Center** | In-app alerts for event approvals, claim filings, circular alerts, and activity feed tracking. | All Users | `/api/notifications` |
| **Administrative Console** | Centralized governance dashboard providing approval queues and listing metrics across all modules. | Admin | `/api/events/admin`, `/api/clubs/admin`, etc. |

---

## 6. Git Repository & Version Control Status

- **Current Git Branch**: `redesign-campus-connect`
- **Tracked Upstream Branch**: `origin/redesign-campus-connect`
- **Recent Commit History**:
  1. `9c8d74f` — *Redesign Campus Connect UI*
  2. `5920a9e` — *Initial commit - CampusConnect*
- **Working Tree Status**: Clean (0 uncommitted changes).
