# Campus Connect: A Role-Based Full-Stack Campus Management Portal
## B.Tech Computer Science and Engineering Major/Mini Project Report Draft

---

### **Project Metadata & Identification**
- **Project Title**: Campus Connect — Role-Based College Life & Academic Administration System
- **Academic Degree**: Bachelor of Technology (B.Tech) in Computer Science & Engineering
- **Academic Year / Term**: Spring Term 2026 `[Requires College/Author Verification: Adjust Term/Year as needed]`
- **Author / Student Name(s)**: `[Requires College/Author Verification: e.g., Anshul Sharma, Roll No: 22CSE042]`
- **Project Supervisor / Guide**: `[Requires College/Author Verification: e.g., Dr. Rajesh Sharma, Department of CSE]`
- **Institution / University**: `[Requires College/Author Verification: e.g., Department of Computer Science & Engineering, College of Engineering]`

---

## 1. Project Abstract

In higher educational institutions, communication and operational workflows are frequently fragmented across disparate platforms, including physical bulletin boards, unofficial instant messaging channels, and isolated departmental offices. This fragmentation leads to low participation in academic events, delayed dissemination of urgent administrative circulars, inefficient recovery of lost personal belongings, and cumbersome student club management.

**Campus Connect** is a full-stack, role-based campus life and academic management web application engineered to consolidate these institutional workflows into a unified digital portal. The system is built using a modern decoupled architecture comprising a **React 18** Single Page Application (SPA) styled with **Tailwind CSS**, a stateless **Express.js** RESTful API running on **Node.js**, and a **MongoDB** document database managed via the **Mongoose** Object Data Modeling (ODM) framework. 

Security and privacy are enforced through JSON Web Tokens (JWT) with HMAC-SHA256 signing, Blowfish password hashing (`bcryptjs`), and granular Role-Based Access Control (RBAC) across three distinct stakeholder tiers: `STUDENT`, `FACULTY`, and `ADMIN`. The application features strict backend branch isolation, multi-stage administrative event and club charter moderation, an ownership verification workflow for lost and found property, and targeted departmental notice dispatch with real-time in-app notification tracking.

---

## 2. Problem Statement

Modern college campuses experience operational inefficiencies due to the lack of an integrated digital platform:
1. **Uncoordinated Event Management**: Academic workshops, hackathons, and cultural fests are announced via informal posters or chat groups. This lacks central governance, resulting in venue booking conflicts, overlapping schedules, and missed attendance opportunities.
2. **Ad-Hoc Lost and Found Recovery**: Hundreds of physical items (identity cards, laboratory tools, scientific calculators, laptops, chargers) are misplaced every semester. Without a centralized digital registry with verification mechanisms, returned belongings rely on physical notice boards or remain unrecovered.
3. **Information Fatigue and Notification Flooding**: Circulars, exam timetables, and academic bulletins distributed through email blasts or global bulletin boards lack granular filtering. Students are inundated with notices meant for other branches or semesters, leading to missed academic deadlines.
4. **Opaque Student Guild Governance**: Student societies and technical clubs maintain ad-hoc membership lists and paper-based applications, lacking administrative charter oversight and transparent leadership rosters.

---

## 3. Project Objectives and Scope

### 3.1 Objectives
The primary objectives of the Campus Connect project are:
- To design and implement a responsive, accessible, role-based web portal unifying core student and administrative interactions.
- To establish a secure authentication and authorization pipeline using JSON Web Tokens and salted password hashing.
- To construct a moderated campus events system supporting chronological scheduling, branch filtering, and administrative approval queues.
- To formulate an item recovery registry with a two-party claim verification workflow between reporting finders and verified owners.
- To build a targeted official circulars distribution engine capable of isolating notices by branch (`CSE`, `ECE`), academic year, and role.
- To implement a student societies management module facilitating charter proposals, administrative sanctioning, and member applications.
- To provide a real-time notification subsystem that informs users of moderation outcomes, claims, and urgent alerts.

### 3.2 Scope
- **In Scope**:
  - Full-stack web application accessible via desktop and mobile evergreen web browsers.
  - Role-based capabilities for Students, Academic Faculty, and Central IT Administrators.
  - Secure profile management with image upload capabilities for user avatars and item photos.
  - Branch-restricted query enforcement executed on the backend database layer.
  - In-app notification center with read/unread receipt tracking.
- **Out of Scope (Current Release)**:
  - Native iOS and Android mobile applications (web interface is fully responsive).
  - Financial payment gateway integration for paid event ticketing or club dues.
  - Native SMS / WhatsApp gateway dispatch (notifications are handled in-app).
  - External SMTP server integration for live password reset emails (currently simulated).

---

## 4. Existing System and Its Limitations

| Operational Dimension | Conventional Campus System | Limitations & Deficiencies |
| :--- | :--- | :--- |
| **Notice Distribution** | Printed physical paper circulars on notice boards and broadcast emails | Ignored by students; high paper waste; lack of read tracking; no targeted filtering by semester/section. |
| **Event Planning** | Printed flyers and unmoderated social media posts | High risk of venue conflicts; unauthorized event hosting; absence of an integrated chronological calendar. |
| **Lost & Found** | Security guard desks, lost-property boxes in administrative offices | Low claim rate; no digital proof of ownership required; prone to unauthorized pickups. |
| **Club Operations** | Ad-hoc Google Forms and paper rosters | Lack of official charter approval by administration; no centralized directory of active campus societies. |

---

## 5. Proposed System

Campus Connect proposes a unified web architecture where all stakeholders access customized interfaces tailored to their institutional roles:
- **Centralized Administrative Console**: Campus administrators possess holistic governance tools to approve submitted events, sanction club charters, moderate lost and found listings, and monitor campus metrics.
- **Granular Branch & Role Isolation**: The backend queries enforce that academic circulars and branch events submitted for Computer Science (`CSE`) are invisible to Electronics (`ECE`) students unless flagged for all (`ALL`).
- **Two-Party Verification Engine**: Lost and found recovery requires claimants to provide private distinguishing details (serial numbers, specific markings) that the reporting finder or administrator reviews before authorizing physical handover.
- **Stateless & Scalable API**: The decoupled Express API operates statelessly with JWT tokens, allowing horizontal container scaling without sticky server sessions.

---

## 6. Functional Requirements

- **FR-1: User Identity & Role-Based Access Control**
  - FR-1.1: The system shall permit students to register with Name, College ID, Roll Number, Branch, Year, Section, and Password.
  - FR-1.2: The system shall permit faculty to register with Name, College ID, Official Email, Department, and Password.
  - FR-1.3: The system shall authenticate users via either registered Email or College ID using `bcryptjs` password verification.
  - FR-1.4: The system shall issue a signed JWT valid for 7 days upon successful authentication.
  - FR-1.5: The system shall guard administrative endpoints against unauthorized access, returning HTTP 401/403.
- **FR-2: Campus Events Management**
  - FR-2.1: Authenticated users shall submit events specifying title, category, date, venue, organizer, and target branch.
  - FR-2.2: Student event submissions shall default to `pending` status awaiting administrator approval.
  - FR-2.3: Administrators shall approve, reject (with mandatory reason), or cancel events.
  - FR-2.4: The events calendar shall group events chronologically and isolate branch-restricted listings on the backend.
- **FR-3: Lost & Found Registry and Claim System**
  - FR-3.1: Users shall report lost or found items with category, discovery location, date, photos, and private unique details.
  - FR-3.2: Claimants shall submit ownership claims detailing matching private proof and loss circumstances.
  - FR-3.3: The finder or administrator shall review submitted claims and approve or reject them with review notes.
  - FR-3.4: Approving a claim shall update item status to `resolved` and notify the claimant.
- **FR-4: Campus Circulars & Official Announcements**
  - FR-4.1: Faculty and Administrators shall compose and publish official circulars with category, priority, and audience targeting.
  - FR-4.2: Priority levels shall include `normal`, `important`, and `urgent` (which displays an urgent banner on the dashboard).
  - FR-4.3: Students shall receive read receipts and track unread notices via an integrated badge count.
- **FR-5: Student Societies & Clubs Governance**
  - FR-5.1: Users shall propose student club charters specifying name, mission, category, and department.
  - FR-5.2: Administrators shall approve or reject charter proposals.
  - FR-5.3: Students shall submit join applications with motivation statements to active clubs.
  - FR-5.4: Club leadership shall accept or reject pending applicants.
- **FR-6: Notifications & Activity Stream**
  - FR-6.1: The system shall generate in-app notification records whenever an event is approved/rejected, an ownership claim is filed/reviewed, or a targeted circular is published.
  - FR-6.2: Users shall be able to mark notifications as read individually or in bulk.
- **FR-7: Media Asset Management**
  - FR-7.1: The system shall accept image uploads (`.jpg`, `.jpeg`, `.png`, `.webp`) up to 10 MB per file.
  - FR-7.2: Uploaded profile photos shall immediately synchronize across all created events, notices, and club leadership rosters.

---

## 7. Non-Functional Requirements

- **NFR-1: Security**
  - Passwords must be hashed using `bcrypt` with at least 10 salt rounds prior to persistence.
  - Sensitive password hashes must never be serialized or returned in API responses (`select: false`).
  - Bearer tokens must be verified on every protected HTTP request.
- **NFR-2: Performance and Response Latency**
  - Database queries must leverage compound indexes on heavily filtered fields (`status`, `date`, `category`, `branch`).
  - Production static bundle size must be optimized; current Vite build produces an 83 KB minified stylesheet and 668 KB JavaScript bundle.
- **NFR-3: Usability and Responsiveness**
  - The UI must adapt seamlessly across desktop monitors, tablets, and smartphones using Tailwind CSS flex and grid primitives.
  - Dark mode and light mode preferences must persist across sessions via `localStorage`.
- **NFR-4: Reliability and Fault Tolerance**
  - The development environment must gracefully handle the absence of a local MongoDB daemon by falling back to an embedded in-memory server without crashing.
  - Centralized error-handling middleware must intercept Mongoose `CastError`, duplicate key errors (code 11000), and validation errors, returning structured JSON error messages.

---

## 8. User Roles & Permission Matrix

| Module & Operation | Guest / Unregistered | Student | Faculty Member | Campus Administrator |
| :--- | :---: | :---: | :---: | :---: |
| **Register & Login** | Yes | Yes | Yes | Yes |
| **View Dashboard & Profile** | No | Yes | Yes | Yes |
| **Browse Approved Events** | No | Yes (Branch Restricted) | Yes (All) | Yes (All) |
| **Submit New Event** | No | Yes (Requires Approval) | Yes (Requires Approval) | Yes (Auto-Approved) |
| **Approve / Reject Events** | No | No | No | **Yes** |
| **Report Lost / Found Belonging** | No | Yes | Yes | Yes |
| **File Claim on Found Item** | No | Yes | Yes | Yes |
| **Review Claims on Reported Item** | No | Yes (Finder Only) | Yes (Finder Only) | **Yes (All Items)** |
| **View Official Circulars** | No | Yes (Audience Filtered) | Yes (All) | Yes (All) |
| **Publish Official Circular** | No | No | **Yes** | **Yes** |
| **Propose Student Club Charter** | No | Yes | Yes | Yes |
| **Approve / Reject Club Charter** | No | No | No | **Yes** |
| **Manage Club Member Applications**| No | Yes (If President) | Yes (If Coordinator) | **Yes** |
| **Access Admin Overview & Audit** | No | No | No | **Yes** |

---

## 9. Software & Hardware Specifications

### 9.1 Hardware Requirements
- **Development Workstation**:
  - Processor: Dual-Core 2.0 GHz or higher (Intel Core i3/i5/i7 or AMD Ryzen).
  - RAM: Minimum 4 GB (8 GB or 16 GB recommended).
  - Storage: Minimum 2 GB free disk space for Node modules, build artifacts, and database files.
- **Client Device**: Any desktop, laptop, or mobile smartphone with a modern evergreen web browser.

### 9.2 Software Requirements
- **Operating System**: Windows 10/11, macOS, or Linux (Ubuntu 20.04+).
- **Runtime Environment**: Node.js `v18.x` through `v24.x` (Verified on `v24.19.0`).
- **Package Manager**: npm `v9.x` through `v11.x` (Verified on `v11.17.0`).
- **Database Engine**: MongoDB Community Edition 6.0+ or MongoDB Atlas Cloud.
- **Client Web Browsers**: Google Chrome (v100+), Mozilla Firefox (v100+), Apple Safari (v15+), or Microsoft Edge.

---

## 10. Technology Stack Rationale

```text
+--------------------------------------------------------------------------------+
| FRONTEND:  React 18.3 + Vite 5.4 + Tailwind CSS 3.4 + React Router v6          |
+--------------------------------------------------------------------------------+
| BACKEND:   Node.js 24 + Express 4.22 + Mongoose 8.24 + JWT + bcryptjs + Multer |
+--------------------------------------------------------------------------------+
| DATABASE:  MongoDB 6.0 / MongoDB Atlas / Embedded Fallback (Memory Server)     |
+--------------------------------------------------------------------------------+
```

### Technical Rationale:
1. **React 18 & Vite**: React provides a declarative component model ideal for building modular interfaces with instant UI updates. Vite was selected over Create React App due to its esbuild-powered instant hot module replacement (HMR) and optimized Rollup production chunking.
2. **Tailwind CSS**: Eliminates bloated custom CSS files by providing utility classes. It guarantees uniform spacing, responsive breakpoints, and straightforward dark/light mode toggling.
3. **Node.js & Express**: Provides an asynchronous, non-blocking I/O event loop capable of handling thousands of concurrent HTTP connections with minimal memory overhead.
4. **MongoDB & Mongoose**: Academic campus entities have evolving, heterogeneous schemas (e.g. lost items have different distinguishing attributes, circulars have variable audience parameters). A document-oriented NoSQL database accommodates polymorphic records natively.
5. **Stateless JWT Authentication**: Eliminates server-side session stores, enabling horizontal backend scaling across multiple server instances or cloud containers.

---

## 11. System Architecture & Workflows

### 11.1 Architectural Overview
The system follows a 3-tier client-server paradigm:
- **Presentation Tier**: React SPA rendered in the client's browser.
- **Application Logic Tier**: Express router and controllers executing validation, RBAC, and notification dispatch.
- **Data Persistence Tier**: MongoDB storing collections with compound indexes.

### 11.2 Key Workflow: Lost & Found Claim Verification
1. User A posts a found belonging (e.g., scientific calculator) with public location and date.
2. User B browses the feed, identifies their belonging, and submits an ownership claim detailing unique markings.
3. The backend sets the claim to `pending` and the item status to `claim_pending`.
4. User A receives an in-app alert, reviews User B's proof, and approves the claim.
5. The backend marks the item as `resolved` and stores a resolution timestamp.

---

## 12. Database Schema & Data Models

The system persists data across **7 MongoDB collections**:
1. `users`: Stores user identity, credentials, role, roll number, academic branch, year, section, and profile photo.
2. `events`: Stores title, description, category, date, time slots, venue, organizer, target audience, branch, and approval status (`pending`, `approved`, `rejected`, `cancelled`).
3. `lostfounds`: Stores item type (`lost` vs `found`), category, location, date, distinguishing characteristics, and lifecycle status (`active`, `claim_pending`, `resolved`, `closed`).
4. `claims`: Stores claim rationale, unique proof, claimant ID, finder ID, and approval status (`pending`, `approved`, `rejected`).
5. `announcements`: Stores circular heading, content, priority (`normal`, `important`, `urgent`), audience scope, branch target, read receipts (`readBy`), and attachment links.
6. `clubs`: Stores society charter, description, logo, leadership assignments, and embedded member/pending applicant sub-documents.
7. `notifications`: Stores personalized in-app notifications, domain type, read status, and action deep-links.

---

## 13. Security Considerations

1. **Password Encryption**: Implements `bcryptjs` with 10 salt rounds. Plaintext passwords never touch database storage.
2. **Token Security**: JWT tokens are signed using HMAC-SHA256. Secret keys are loaded from environment variables.
3. **SQL/NoSQL Injection Mitigation**: Mongoose schema sanitization ensures that user input is bound to defined schema types, preventing NoSQL operator injection.
4. **File Upload Hardening**: Multer storage middleware enforces strict MIME-type whitelisting (`image/jpeg`, `image/png`, `image/webp`) and restricts file size to 10 MB.
5. **Role-Based Guards**: Every sensitive route is intercepted by `protect` and `authorize` middlewares before executing controller logic.

---

## 14. Testing Strategy & Verified Results

The application includes automated integration test suites executed against the running backend server.

### 14.1 Executed Test Suites & Observed Results
1. **Master Production E2E Suite (`test-master-e2e.js`)**:
   - Section 1 (Auth & RBAC): Verified student/faculty/admin logins and verified that `passwordHash` is strictly omitted from responses.
   - Section 2 (Events Moderation): Student event created in `pending` status, approved by admin, and verified live in public calendar.
   - Section 3 (Lost & Found Claims): Found item posted, claim filed by owner, approved by finder, status transitioned to `resolved`.
   - Section 4 (Audience Isolation): CSE circular published; verified that CSE student receives notice while ECE student is strictly isolated.
   - Section 5 (Club Charters & Memberships): Membership application submitted, approved by leadership, member added to roster.
   - Section 6 (Notifications): Verified notification generation, unread counter decrements, and activity stream generation.
   - Section 7 (Attack Defenses): 5 penetration attempts simulated (students attempting admin routes); all 5 blocked with HTTP 401/403.
   - **Result**: `🎉 ALL MASTER END-TO-END VERIFICATION CHECKS PASSED 100%! 🎉`
2. **Image Upload & Security Suite (`test-upload.js`)**:
   - Verified valid upload, static file serving, profile picture persistence, rejection of invalid extensions, and rejection of files exceeding 10 MB.
   - **Result**: `🎉 ALL IMAGE UPLOAD & SECURITY CHECKS PASSED 100%! 🎉`
3. **Profile Avatar Sync Suite (`test-avatar-sync.js`)**:
   - Verified that updating an avatar dynamically propagates across Events, Lost & Found items, and Club leadership cards.
   - **Result**: `🎉 ALL PROFILE PICTURE SYNCHRONIZATION TESTS PASSED 100%! 🎉`
4. **Event Timeline Suite (`test-events-timeline.js`)**:
   - Verified date grouping, chronological sorting, and same-time vertical stacking collision avoidance.
   - **Result**: `🎉 ALL EVENT TIMELINE CHRONOLOGICAL TESTS PASSED 100%! 🎉`

---

## 15. Limitations & Known Constraints

1. **Ephemeral Local File Storage**: Uploaded images are currently stored in `backend/uploads/images/` on local disk. Deploying to container platforms with ephemeral filesystems (e.g. Render, Railway) requires configuring an object storage bucket (AWS S3 or Cloudinary).
2. **Simulated Password Reset**: The `/api/auth/forgot-password` endpoint simulates the dispatch of password reset instructions. Live deployment requires configuring an external SMTP provider (SendGrid, Mailgun, or Nodemailer).
3. **Circular Attachments via URL**: Circular attachments accept document URLs and sample presets; direct binary PDF upload is not yet implemented on the backend.
4. **Rate Limiting**: Rate limiting middleware (e.g. `express-rate-limit`) is not yet mounted on authentication routes.

---

## 16. Future Enhancements

1. **Cloud Object Storage Adapter**: Implement an AWS S3 / Cloudinary storage engine for uploaded avatars, event banners, and PDF circulars.
2. **WebSocket / Push Notifications**: Integrate Socket.io or Web Push API for instantaneous real-time alerts without client polling.
3. **SMS / Email Gateway**: Integrate Twilio or SendGrid for critical college emergency broadcasts and password recovery tokens.
4. **Campus Map & Indoor Navigation**: Embed an interactive SVG campus map indicating physical event venues and lost-property drop-off counters.
5. **QR Code Attendance System**: Generate unique dynamic QR codes for approved campus events allowing organizers to scan student attendance.

---

## 17. Conclusion

Campus Connect successfully demonstrates the design and implementation of a modern, full-stack campus management portal. By consolidating academic circulars, campus events, lost property recovery, and student club governance into a secure, role-based platform, the system addresses critical communication breakdowns prevalent in higher educational institutions. Verified automated testing across all functional modules confirms that the system enforces rigorous role separation, reliable data persistence, and responsive usability suitable for academic deployment.
