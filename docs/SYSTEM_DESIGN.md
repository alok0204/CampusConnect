# Campus Connect — System Design & Architecture Specification

## 1. High-Level System Context

Campus Connect is an institutional portal serving three primary user personas: **Students**, **Faculty Members**, and **Central Campus Administrators**. The system operates as a client-server web application communicating via RESTful JSON over HTTP/S.

```mermaid
flowchart TD
    subgraph Users ["Campus Stakeholders"]
        Student["Student User\n(Mobile & Desktop Web)"]
        Faculty["Faculty Member\n(Academic & Notices)"]
        Admin["Campus Administrator\n(Moderation & Governance)"]
    end

    subgraph CampusConnect ["Campus Connect System Boundary"]
        FrontendSPA["Frontend Web Application\n(React 18 + Vite SPA)"]
        BackendAPI["Backend Application Server\n(Express.js REST API)"]
        LocalDisk["Server File Storage\n(uploads/images/)"]
        Database[("Primary Database\n(MongoDB)")]
    end

    subgraph ExternalServices ["External Ecosystem (Optional/Planned)"]
        MailService["SMTP / Email Gateway\n(Planned for Password Reset)"]
        CloudStorage["S3 / Cloudinary\n(Production Asset Storage)"]
    end

    Student -->|Browse events, report items, join clubs| FrontendSPA
    Faculty -->|Post circulars, manage clubs| FrontendSPA
    Admin -->|Approve events, moderate items, govern charters| FrontendSPA

    FrontendSPA -->|HTTP / JSON with JWT Bearer Token| BackendAPI
    BackendAPI -->|Mongoose Queries & Aggregations| Database
    BackendAPI -->|Write static images| LocalDisk
    LocalDisk -->|Serve media assets| FrontendSPA
    BackendAPI -.->|Planned notification delivery| MailService
    BackendAPI -.->|Recommended media offload| CloudStorage
```

### Trust Boundaries & Network Segregation
- **Trust Boundary 1 (Public / Client Boundary)**: Between user web browsers and the Express API server. All incoming requests across this boundary are treated as untrusted and must pass through CORS validation, body parsing, and JWT authentication middleware.
- **Trust Boundary 2 (Application / Data Boundary)**: Between Express controllers and MongoDB. Controllers strictly enforce user ownership and role checks before issuing database write/delete queries.
- **Trust Boundary 3 (File Storage Boundary)**: Multipart upload files are validated for size (10 MB maximum) and MIME type (`image/jpeg`, `image/png`, `image/webp`) before writing to the filesystem.

---

## 2. Container & Component Architecture

```mermaid
flowchart LR
    subgraph Browser ["Client Browser Tier"]
        UI["React 18 UI Components"]
        Router["React Router v6"]
        AuthCtx["AuthContext & ThemeContext"]
        Axios["Axios Interceptor Client"]
    end

    subgraph Server ["Server Tier (Node.js & Express)"]
        CORS["CORS & Parser Middleware"]
        AuthMiddleware["JWT Protect & RBAC Authorize"]
        UploadMiddleware["Multer Storage Middleware"]
        
        subgraph Controllers ["Controllers & Services"]
            AuthC["Auth Controller"]
            UserC["User Controller"]
            EventC["Event Controller"]
            LFC["Lost & Found Controller"]
            AnnounceC["Announcement Controller"]
            ClubC["Club Controller"]
            NotifC["Notification Controller"]
            NotifSvc["Notification Service"]
        end
    end

    subgraph Data ["Data Persistence Tier"]
        Mongo["MongoDB Collections\n(Users, Events, LostFound, Claims, Announcements, Clubs, Notifications)"]
        Disk["Filesystem Storage\n(uploads/images/)"]
    end

    UI --> Router
    Router --> AuthCtx
    AuthCtx --> Axios
    Axios -->|REST API Calls| CORS
    CORS --> AuthMiddleware
    AuthMiddleware --> Controllers
    UploadMiddleware --> Disk
    Controllers --> NotifSvc
    NotifSvc --> NotifC
    Controllers -->|Mongoose ODM| Mongo
```

---

## 3. Frontend-to-Backend Request Flow

Every authenticated request from the client follows a uniform lifecycle:

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant React as React UI Page
    participant Axios as Axios API Client
    participant Express as Express Router
    participant AuthMW as Protect Middleware
    participant Controller as Feature Controller
    participant DB as MongoDB Instance

    User->>React: Performs User Action (e.g. Host Event)
    React->>Axios: api.post('/events', payload)
    Axios->>Axios: Interceptor attaches Bearer <token> from localStorage
    Axios->>Express: POST /api/events (HTTP Header: Authorization)
    Express->>AuthMW: protect(req, res, next)
    AuthMW->>AuthMW: jwt.verify(token, JWT_SECRET)
    AuthMW->>DB: User.findById(decoded.id)
    DB-->>AuthMW: User record (passwordHash omitted)
    AuthMW->>Express: req.user = user; next()
    Express->>Controller: createEvent(req, res)
    Controller->>DB: Event.create({...payload, creator: req.user._id, status: 'pending'})
    DB-->>Controller: Saved Event Document
    Controller-->>Axios: 201 Created { success: true, event: {...} }
    Axios-->>React: Promise resolved with response.data
    React-->>User: Displays success toast and redirects to /events/my-events
```

---

## 4. Authentication & Authorization Lifecycle

Campus Connect implements stateless JWT authentication combined with local storage persistence.

```mermaid
sequenceDiagram
    autonumber
    actor User as Student / Faculty / Admin
    participant Login as Login.jsx
    participant AuthAPI as /api/auth/login
    participant DB as MongoDB (User Collection)
    participant JWT as Token Generator
    participant Storage as Browser localStorage
    participant Guard as ProtectedRoute.jsx

    User->>Login: Enter College ID/Email & Password
    Login->>AuthAPI: POST { identifier, password }
    AuthAPI->>DB: User.findOne({ $or: [{ email }, { collegeId }] }).select('+passwordHash')
    DB-->>AuthAPI: User document
    AuthAPI->>AuthAPI: bcrypt.compare(password, user.passwordHash)
    alt Password Invalid
        AuthAPI-->>Login: 401 Unauthorized { success: false, message: 'Invalid credentials' }
        Login-->>User: Display error message
    else Password Valid
        AuthAPI->>JWT: generateToken(user._id, user.role)
        JWT-->>AuthAPI: Signed JWT string (7-day validity)
        AuthAPI-->>Login: 200 OK { success: true, token, user }
        Login->>Storage: localStorage.setItem('token', token)
        Login->>Storage: localStorage.setItem('user', JSON.stringify(user))
        Login-->>User: Redirect to /dashboard
    end

    opt Route Navigation to Protected Resource
        User->>Guard: Access /admin/events
        Guard->>Guard: Check allowedRoles.includes(user.role)
        alt Role is STUDENT or FACULTY
            Guard-->>User: Navigate to /dashboard (Redirect)
        else Role is ADMIN
            Guard-->>User: Render AdminEvents component
        end
    end
```

---

## 5. Major Business Workflows

### 5.1 Event Submission and Admin Moderation Workflow
```mermaid
flowchart TD
    Start([User Initiates Event Creation]) --> RoleCheck{Is User ADMIN?}
    RoleCheck -- Yes --> AdminCreate[Status set to 'approved']
    RoleCheck -- No --> StudentCreate[Status set to 'pending']
    
    StudentCreate --> SavePending[(Saved in Event Collection)]
    AdminCreate --> SaveApproved[(Saved in Event Collection)]
    
    SavePending --> AdminQueue[Event appears in Admin Moderation Queue\nGET /api/events/admin/all]
    AdminQueue --> Decision{Admin Decision}
    
    Decision -- Approve --> ApproveAction[PUT /api/events/:id/approve]
    Decision -- Reject --> RejectAction[PUT /api/events/:id/reject with reason]
    
    ApproveAction --> UpdateApproved[Status = 'approved']
    RejectAction --> UpdateRejected[Status = 'rejected']
    
    UpdateApproved --> PublicFeed[Visible in Public Event Calendar & Dashboard]
    UpdateRejected --> CreatorNotif[Creator receives rejection reason in My Events]
```

---

### 5.2 Lost & Found Item Report & Claim Resolution Workflow
```mermaid
flowchart TD
    ReportItem([User Reports Found Item]) --> SaveItem[(Item Created: status = 'active')]
    SaveItem --> PublicListing[Visible on Lost & Found Board]
    
    Claimant([Owner Spots Belonging]) --> SubmitClaim[Submits Claim Form:\n- Distinguishing Marks\n- Previous Location]
    SubmitClaim --> CreateClaim[(Claim Created: status = 'pending')]
    CreateClaim --> UpdateItemStatus[(Item status = 'claim_pending')]
    
    UpdateItemStatus --> FinderNotif[Finder alerted: View Claims on Item Details]
    FinderNotif --> ReviewClaim{Finder Reviews Evidence}
    
    ReviewClaim -- Reject Claim --> RejectClaimAction[Claim status = 'rejected']
    RejectClaimAction --> RevertItem[(Item status reverts to 'active')]
    
    ReviewClaim -- Approve Claim --> ApproveClaimAction[Claim status = 'approved']
    ApproveClaimAction --> ResolveItem[(Item status = 'resolved')]
    ResolveItem --> Handover[Finder & Claimant exchange contact info for physical handover]
```

---

### 5.3 Campus Circulars & Strict Audience Targeting Workflow
```mermaid
flowchart TD
    StartNotice([Faculty/Admin Composes Notice]) --> SelectAudience{Select Target Audience}
    
    SelectAudience -- ALL --> TargetAll[audience = 'all']
    SelectAudience -- Branch --> TargetBranch[audience = 'branch', branch = 'CSE']
    SelectAudience -- Year --> TargetYear[audience = 'year', year = '3rd Year']
    SelectAudience -- Faculty Only --> TargetFaculty[audience = 'faculty']
    
    TargetAll & TargetBranch & TargetYear & TargetFaculty --> SaveNotice[(Save Announcement Document)]
    SaveNotice --> DispatchNotifications[Notification Service queries matching users]
    DispatchNotifications --> InsertAlerts[(Bulk Insert in Notification Collection)]
    
    SaveNotice --> StudentFetch[Student requests /api/announcements]
    StudentFetch --> BackendFilter{Backend Filters Matching Records}
    BackendFilter --> Feed[Student sees ONLY notices matching their branch/year/all]
```

---

### 5.4 Club Charter Proposal & Membership Lifecycle
```mermaid
flowchart TD
    ProposeClub([Student Proposes New Guild]) --> SaveProposal[(Club Saved: status = 'pending')]
    SaveProposal --> AdminCharters[Admin Governance Console: /admin/clubs]
    
    AdminCharters --> AdminSanction{Admin Approval}
    AdminSanction -- Reject --> RejectedClub[status = 'rejected']
    AdminSanction -- Approve --> ActiveClub[status = 'active']
    
    ActiveClub --> Directory[Club Listed in Campus Directory]
    
    StudentApp([Student Applies to Join]) --> SubmitStatement[POST /api/clubs/:id/join with Statement]
    SubmitStatement --> PendingList[(Added to pendingMembers array)]
    
    PendingList --> LeaderReview[Club President/Coordinator Reviews Applications]
    LeaderReview --> MemberDecision{Leadership Decision}
    
    MemberDecision -- Reject --> RemovePending[User removed from pendingMembers]
    MemberDecision -- Approve --> AddRoster[User moved from pendingMembers to members array]
    AddRoster --> ActiveMember[Student becomes official club member with Member role]
```

---

## 6. Database Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USER ||--o{ EVENT : "creates"
    USER ||--o{ LOST_FOUND : "reports"
    USER ||--o{ CLAIM : "files as claimant"
    USER ||--o{ CLAIM : "receives as finder"
    USER ||--o{ ANNOUNCEMENT : "publishes"
    USER ||--o{ ANNOUNCEMENT : "reads (readBy)"
    USER ||--o{ CLUB : "founded (createdBy)"
    USER ||--o{ CLUB : "coordinates (faculty)"
    USER ||--o{ CLUB : "leads (president/secretary)"
    USER ||--o{ NOTIFICATION : "receives"
    
    CLUB ||--o{ EVENT : "hosts"
    CLUB ||--o{ ANNOUNCEMENT : "issues"
    
    LOST_FOUND ||--o{ CLAIM : "has claims"
    LOST_FOUND }o--|| USER : "claimedBy"

    USER {
        ObjectId _id PK
        string name
        string email UK
        string passwordHash
        string collegeId UK
        string rollNumber
        string branch
        string year
        string section
        string department
        string role "STUDENT | FACULTY | ADMIN"
        string profileImage
        boolean isVerified
        date createdAt
        date updatedAt
    }

    EVENT {
        ObjectId _id PK
        string title
        string description
        string category
        date date
        string startTime
        string endTime
        string venue
        string organizer
        ObjectId club FK "nullable"
        ObjectId creator FK
        string targetAudience
        string branch
        string image
        string status "pending | approved | rejected | cancelled"
        string rejectionReason
        date createdAt
    }

    LOST_FOUND {
        ObjectId _id PK
        string title
        string description
        string type "lost | found"
        string category
        string location
        date date
        string time
        string image
        string color
        string brand
        string uniqueDetails
        string contactPreference
        string contactNumber
        ObjectId creator FK
        string status "active | claim_pending | claimed | resolved | closed"
        ObjectId claimedBy FK "nullable"
        string claimStatus
        date resolvedAt
    }

    CLAIM {
        ObjectId _id PK
        ObjectId itemId FK
        ObjectId claimant FK
        ObjectId finder FK
        string reason
        string identifyingDetails
        string previousLocation
        string contactNumber
        string status "pending | approved | rejected"
        string reviewNote
        date resolvedAt
        date createdAt
    }

    ANNOUNCEMENT {
        ObjectId _id PK
        string title
        string summary
        string content
        string category
        string priority "normal | important | urgent"
        string audience "all | students | faculty | branch | year"
        string branch
        string department
        string year
        string section
        ObjectId club FK "nullable"
        object attachment "name, url, fileType, fileSize"
        string image
        ObjectId createdBy FK
        string status "draft | published | scheduled | expired | archived"
        date publishAt
        date expiresAt
        ObjectIdArray readBy FK
        boolean isPinned
    }

    CLUB {
        ObjectId _id PK
        string name UK
        string shortDescription
        string description
        string category
        string logo
        string coverImage
        string department
        string branch
        ObjectId facultyCoordinator FK "nullable"
        ObjectId studentPresident FK "nullable"
        ObjectId studentSecretary FK "nullable"
        string contactEmail
        string contactPhone
        object socialLinks "website, github, linkedin, instagram"
        array members "user FK, role, joinedAt"
        array pendingMembers "user FK, statement, requestedAt"
        string status "active | pending | rejected | inactive"
        string rejectionReason
        ObjectId createdBy FK
    }

    NOTIFICATION {
        ObjectId _id PK
        ObjectId recipient FK
        string type "event | lost_found | announcement | club | system | admin"
        string title
        string message
        string entityType
        ObjectId entityId
        string priority "normal | important | urgent"
        boolean isRead
        date expiresAt
        object metadata "actionUrl, icon, status, extra"
        date createdAt
    }
```

---

## 7. File Upload & Media Storage Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant Component as ImageUpload.jsx
    participant API as POST /api/uploads/image
    participant Multer as Multer diskStorage
    participant FS as Local Filesystem (/uploads/images/)
    participant Static as Express static route (/uploads)

    User->>Component: Selects image file (.jpg, .png, .webp)
    Component->>Component: Client-side file type & size check (< 10MB)
    Component->>API: multipart/form-data upload (field: 'image')
    API->>Multer: uploadImageMiddleware.single('image')
    Multer->>Multer: MIME type validation & unique filename generation
    Multer->>FS: Writes file `img-${timestamp}-${randomHex}.ext`
    Multer-->>API: File descriptor populated (req.file)
    API-->>Component: 200 OK { success: true, url: '/uploads/images/filename.jpg' }
    Component->>User: Renders uploaded preview; stores relative URL in form state

    opt Later Asset Retrieval
        User->>Static: GET /uploads/images/filename.jpg
        Static-->>User: 200 OK with binary image stream
    end
```

---

## 8. Current vs. Production Deployment Architecture

### 8.1 Current Local Development Architecture
- Single Node.js host machine executing Vite dev server (port 5173) and Express API server (port 5000).
- Reverse proxy built into Vite (`vite.config.js`) routing `/api` and `/uploads` requests directly to `localhost:5000`.
- MongoDB running either as a local service on port 27017 or seamlessly booting via `mongodb-memory-server`.
- Uploads stored directly on local hard drive in `backend/uploads/images`.

```mermaid
flowchart LR
    subgraph Host ["Developer Machine (Windows / POSIX)"]
        Browser["Web Browser\n(http://localhost:5173)"]
        
        subgraph DevServers ["Development Daemons"]
            Vite["Vite Dev Server\n(Port 5173)\nProxy /api -> 5000"]
            Express["Express Server\n(Port 5000)"]
            MemMongo["In-Memory MongoDB\n(Auto Fallback)"]
            UploadsFolder["backend/uploads/images"]
        end
    end

    Browser <--> Vite
    Vite <--> Express
    Express <--> MemMongo
    Express <--> UploadsFolder
```

### 8.2 Recommended Production Cloud Architecture
- **Frontend SPA**: Static build deployed to Global CDN edge (Vercel, Netlify, or AWS CloudFront + S3).
- **Backend API**: Containerized Node.js application running on managed container infrastructure (AWS ECS, Render Web Service, or Railway) with horizontal autoscaling.
- **Database**: Managed MongoDB Atlas Replica Set (M10+ recommended for automated backups, continuous snapshots, and multi-region failover).
- **Asset Storage**: AWS S3 Bucket or Cloudinary with CloudFront CDN distribution for uploaded images and circular PDF attachments.

```mermaid
flowchart TD
    subgraph Clients ["End Users"]
        WebUsers["Campus Students, Faculty, Admins\n(HTTPS Web & Mobile)"]
    end

    subgraph CDN ["Edge / CDN Layer"]
        Cloudflare["Cloudflare / Route53 DNS & WAF\nSSL/TLS Termination"]
        StaticCDN["Edge CDN (Vercel / CloudFront)\nServes React Static Bundle"]
    end

    subgraph Compute ["Application Compute (PaaS / Containers)"]
        LoadBalancer["Application Load Balancer"]
        AppInstances["Node.js / Express Instances\n(Render / AWS ECS / Railway)\nNODE_ENV=production"]
    end

    subgraph DataServices ["Managed Cloud Services"]
        Atlas[("MongoDB Atlas\nPrimary + Secondary Replica Set\nEncrypted at rest & transit")]
        S3Bucket["Object Storage (AWS S3 / Cloudinary)\nProfile Avatars & Notice Documents"]
    end

    WebUsers --> Cloudflare
    Cloudflare -->|Static HTML/JS/CSS| StaticCDN
    Cloudflare -->|API Requests /api/*| LoadBalancer
    LoadBalancer --> AppInstances
    AppInstances --> Atlas
    AppInstances --> S3Bucket
    WebUsers -->|Direct media download| S3Bucket
```
