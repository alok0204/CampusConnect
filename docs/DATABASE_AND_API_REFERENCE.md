# Campus Connect — Database Schema & API Endpoint Reference

This document provides a verified, comprehensive technical reference for the MongoDB database models and RESTful API endpoints implemented in **Campus Connect**.

---

## 1. Database Specifications & Engine Compatibility

- **Primary Database Engine**: MongoDB 6.0+ (Tested against MongoDB 6.0.14 embedded binary and MongoDB Community Edition).
- **Object Data Modeling (ODM)**: Mongoose v8.24.3.
- **Connection Strategy**: Single shared connection pool initialized via `backend/src/config/db.js` with `serverSelectionTimeoutMS: 3000`.
- **Development Fallback**: In non-production environments (`NODE_ENV !== 'production'`), if the local MongoDB daemon at `mongodb://127.0.0.1:27017` is unreachable, the system automatically initializes an embedded in-memory MongoDB instance via `mongodb-memory-server`.
- **Migration Strategy**: Schema-less dynamic document validation enforced through Mongoose Schema definitions. No external migration files exist in the repository. New fields default cleanly without breaking backwards compatibility.

---

## 2. Complete Data Dictionary

### 2.1 Collection: `users` (Model: `User`)
Stores identities, credentials, institutional identifiers, and profile metadata for all campus actors.

| Field Name | BSON Type | Required | Default Value | Constraints / Enums / Validation | Indexing | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Auto | MongoDB Primary Key | Primary Key | Unique document identifier |
| `name` | String | Yes | None | Trimmed, non-empty | None | Full legal or display name |
| `email` | String | Yes | None | Lowercase, trimmed, valid email regex | Unique Index | Institutional or official email address |
| `passwordHash` | String | Yes | None | Min length 6, `select: false` | None | bcrypt-hashed password (10 salt rounds) |
| `collegeId` | String | Yes | None | Trimmed, unique | Unique Index | Roll number or faculty employee ID (e.g., `22CSE042`, `FAC_CSE_101`) |
| `rollNumber` | String | No | `""` | Trimmed | None | Student roll number |
| `branch` | String | No | `""` | Uppercase, trimmed (e.g. `CSE`, `ECE`) | None | Student academic branch / department |
| `year` | String | No | `""` | Trimmed (`1st Year`, `2nd Year`, etc.) | None | Academic year level |
| `section` | String | No | `""` | Uppercase, trimmed (`A`, `B`, `C`) | None | Classroom section identifier |
| `department` | String | No | `""` | Trimmed | None | Academic department for faculty staff |
| `role` | String | Yes | `'STUDENT'` | Enum: `['STUDENT', 'FACULTY', 'ADMIN']` | None | Role-Based Access Control tier |
| `profileImage` | String | No | `""` | URL or relative `/uploads/images/` path | None | User avatar picture |
| `isVerified` | Boolean | No | `true` | Boolean flag | None | Account verification status |
| `createdAt` | Date | Auto | `Date.now` | Managed by Mongoose `timestamps` | None | Document creation timestamp |
| `updatedAt` | Date | Auto | `Date.now` | Managed by Mongoose `timestamps` | None | Document update timestamp |

---

### 2.2 Collection: `events` (Model: `Event`)
Stores college-wide and departmental academic, technical, and cultural events.

| Field Name | BSON Type | Required | Default Value | Constraints / Enums / Validation | Indexing | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Auto | Primary Key | Primary Key | Unique event ID |
| `title` | String | Yes | None | Trimmed, max 120 chars | None | Title of event |
| `description` | String | Yes | None | Trimmed | None | Detailed event overview |
| `category` | String | Yes | `'Technical'` | Enum: `['Technical', 'Cultural', 'Academic', 'Sports', 'Workshop', 'Seminar', 'Hackathon', 'Fest', 'Other']` | Single Index | Categorical classification |
| `date` | Date | Yes | None | Valid Date object | Single Index | Calendar date of event |
| `startTime` | String | Yes | None | Trimmed (e.g. `"10:00 AM"`) | None | Scheduled start time |
| `endTime` | String | Yes | None | Trimmed (e.g. `"04:00 PM"`) | None | Scheduled end time |
| `venue` | String | Yes | None | Trimmed | None | Campus location or auditorium |
| `organizer` | String | Yes | None | Trimmed | None | Organizing department or committee |
| `club` | ObjectId | No | `null` | Ref: `Club` | Single Index | Associated student society |
| `creator` | ObjectId | Yes | None | Ref: `User` | Single Index | User who submitted the event |
| `targetAudience` | String | No | `'ALL'` | Enum: `['ALL', 'STUDENTS', 'FACULTY', 'BRANCH_ONLY']` | None | Target audience level |
| `branch` | String | No | `'ALL'` | Uppercase (e.g. `'CSE'`, `'ALL'`) | Single Index | Departmental access restriction |
| `image` | String | No | Unsplash default | URL or `/uploads/images/` path | None | Event banner image |
| `status` | String | Yes | `'pending'` | Enum: `['pending', 'approved', 'rejected', 'cancelled']` | Single Index | Administrative approval state |
| `rejectionReason` | String | No | `""` | Trimmed | None | Admin explanation if rejected |

---

### 2.3 Collection: `lostfounds` (Model: `LostFound`)
Stores reported lost or found belongings across campus.

| Field Name | BSON Type | Required | Default Value | Constraints / Enums / Validation | Indexing | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Auto | Primary Key | Primary Key | Unique item identifier |
| `title` | String | Yes | None | Trimmed, max 120 chars | None | Item name |
| `description` | String | Yes | None | Trimmed | None | General physical description |
| `type` | String | Yes | None | Enum: `['lost', 'found']` | Compound with `status` | Report category |
| `category` | String | Yes | `'Other'` | Enum: Electronics, ID Cards, Keys, Books, Clothing, Bags, Bottles, Jewelry, Sports, Other | Single Index | Item category |
| `location` | String | Yes | None | Trimmed | Single Index | Location where lost or found |
| `date` | Date | Yes | None | Valid Date | Single Index (desc) | Date of discovery/loss |
| `time` | String | No | `""` | Trimmed | None | Time of discovery/loss |
| `image` | String | No | Unsplash default | URL or `/uploads/images/` path | None | Photograph of item |
| `color` | String | No | `""` | Trimmed | None | Primary color |
| `brand` | String | No | `""` | Trimmed | None | Manufacturer or brand |
| `uniqueDetails` | String | No | `""` | Trimmed | None | Private distinguishing marks |
| `contactPreference` | String | No | `'portal'` | Enum: `['email', 'phone', 'in_person', 'portal']` | None | Contact method |
| `contactNumber` | String | No | `""` | Trimmed | None | Contact telephone number |
| `creator` | ObjectId | Yes | None | Ref: `User` | Single Index | Reporting user |
| `status` | String | Yes | `'active'` | Enum: `['active', 'claim_pending', 'claimed', 'resolved', 'rejected', 'closed']` | Compound with `type` | Current notice state |
| `claimedBy` | ObjectId | No | `null` | Ref: `User` | None | Verified owner |
| `claimStatus` | String | No | `'none'` | Enum: `['none', 'pending', 'approved', 'rejected']` | None | Ownership verification state |
| `resolvedAt` | Date | No | `null` | Valid Date | None | Timestamp of resolution |
| `rejectionReason`| String | No | `""` | Trimmed | None | Admin moderation reason |

---

### 2.4 Collection: `claims` (Model: `Claim`)
Stores ownership claims submitted against found belongings.

| Field Name | BSON Type | Required | Default Value | Constraints / Enums / Validation | Indexing | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Auto | Primary Key | Primary Key | Unique claim identifier |
| `itemId` | ObjectId | Yes | None | Ref: `LostFound` | Compound with `claimant` | Claimed item document |
| `claimant` | ObjectId | Yes | None | Ref: `User` | Compound Index | User asserting ownership |
| `finder` | ObjectId | Yes | None | Ref: `User` | Single Index | User who reported the item |
| `reason` | String | Yes | None | Trimmed, non-empty | None | Narrative of ownership |
| `identifyingDetails`| String | Yes | None | Trimmed, non-empty | None | Private proof (serial number, scratches) |
| `previousLocation`| String | No | `""` | Trimmed | None | Suspected location of loss |
| `contactNumber` | String | No | `""` | Trimmed | None | Claimant contact telephone |
| `status` | String | Yes | `'pending'` | Enum: `['pending', 'approved', 'rejected']` | Single Index | State: pending, approved, rejected |
| `reviewNote` | String | No | `""` | Trimmed | None | Finder or Admin verification note |
| `resolvedAt` | Date | No | `null` | Valid Date | None | Timestamp of approval/rejection |

---

### 2.5 Collection: `announcements` (Model: `Announcement`)
Stores official circulars, academic notices, exam orders, and emergency bulletins.

| Field Name | BSON Type | Required | Default Value | Constraints / Enums / Validation | Indexing | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Auto | Primary Key | Primary Key | Unique announcement identifier |
| `title` | String | Yes | None | Trimmed, max 200 chars | None | Notice heading |
| `summary` | String | No | `""` | Trimmed, max 400 chars | None | Brief summary |
| `content` | String | Yes | None | Trimmed | None | Full markdown/text content |
| `category` | String | Yes | `'general'` | Enum: `['academic', 'exam', 'placement', 'event', 'administrative', 'scholarship', 'general', 'emergency']` | Single Index | Bulletin classification |
| `priority` | String | Yes | `'normal'` | Enum: `['normal', 'important', 'urgent']` | Compound with `createdAt` | Priority flag |
| `audience` | String | Yes | `'all'` | Enum: `['all', 'students', 'faculty', 'branch', 'department', 'year', 'section']` | Compound Index | Target audience category |
| `branch` | String | No | `'ALL'` | Trimmed | Compound Index | Targeted branch |
| `department` | String | No | `'ALL'` | Trimmed | None | Targeted faculty department |
| `year` | String | No | `'ALL'` | Trimmed | Compound Index | Targeted student year |
| `section` | String | No | `'ALL'` | Trimmed | Compound Index | Targeted student section |
| `club` | ObjectId | No | `null` | Ref: `Club` | Single Index | Associated society |
| `attachment` | Object | No | Defaults | Sub-fields: `name`, `url`, `fileType`, `fileSize` | None | Attached document URL |
| `image` | String | No | `""` | URL or `/uploads/images/` path | None | Optional header image |
| `createdBy` | ObjectId | Yes | None | Ref: `User` | Single Index | Author user (Admin or Faculty) |
| `status` | String | Yes | `'published'`| Enum: `['draft', 'published', 'scheduled', 'expired', 'archived']` | Compound with `publishAt` | Publication lifecycle status |
| `publishAt` | Date | No | `Date.now` | Valid Date | Compound Index | Scheduled publication time |
| `expiresAt` | Date | No | `null` | Valid Date | Single Index | Automatic expiry date |
| `readBy` | Array | No | `[]` | Array of `ObjectId` refs to `User` | None | Tracks user read receipts |
| `isPinned` | Boolean | No | `false` | Boolean | None | Pinned notice priority |

---

### 2.6 Collection: `clubs` (Model: `Club`)
Stores student society charters, leadership rosters, and memberships.

| Field Name | BSON Type | Required | Default Value | Constraints / Enums / Validation | Indexing | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Auto | Primary Key | Primary Key | Unique club identifier |
| `name` | String | Yes | None | Unique, trimmed, max 100 chars | Unique Index | Society name |
| `shortDescription`| String | Yes | None | Trimmed, max 250 chars | None | Tagline / brief description |
| `description` | String | Yes | None | Trimmed | None | Complete club charter |
| `category` | String | Yes | `'Technical'`| Enum: Technical, Cultural, Sports, Literary, Music, Dance, Photography, Entrepreneurship, Social Service, Academic, Other | Compound with `status` | Guild domain |
| `logo` | String | No | Default Unsplash | URL or path | None | Society logo image |
| `coverImage` | String | No | Default Unsplash | URL or path | None | Profile cover banner |
| `department` | String | No | `'College-Wide'`| Trimmed | Single Index | Sponsoring department |
| `branch` | String | No | `'ALL'` | Trimmed | Single Index | Branch restriction |
| `facultyCoordinator`| ObjectId | No | `null` | Ref: `User` | None | Appointed faculty mentor |
| `studentPresident`| ObjectId | No | `null` | Ref: `User` | None | Elected student president |
| `studentSecretary`| ObjectId | No | `null` | Ref: `User` | None | Elected student secretary |
| `contactEmail` | String | No | `""` | Trimmed, lowercase | None | Society official inbox |
| `socialLinks` | Object | No | Defaults | Sub-fields: `website`, `instagram`, `linkedin`, `github` | None | Social media URLs |
| `members` | Array | No | `[]` | Sub-schema: `{ user: Ref User, role: Enum, joinedAt: Date }` | None | Active member roster |
| `pendingMembers` | Array | No | `[]` | Sub-schema: `{ user: Ref User, statement: String, requestedAt: Date }` | None | Membership application queue |
| `status` | String | Yes | `'pending'` | Enum: `['active', 'pending', 'rejected', 'inactive']` | Single Index | Charter administrative status |
| `rejectionReason`| String | No | `""` | Trimmed | None | Admin charter rejection note |
| `createdBy` | ObjectId | Yes | None | Ref: `User` | Single Index | Proposal author |

---

### 2.7 Collection: `notifications` (Model: `Notification`)
Stores personal alerts, system messages, and event tracking.

| Field Name | BSON Type | Required | Default Value | Constraints / Enums / Validation | Indexing | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Auto | Primary Key | Primary Key | Unique notification ID |
| `recipient` | ObjectId | Yes | None | Ref: `User` | Compound Indexes | Target recipient user |
| `type` | String | Yes | `'system'` | Enum: `['event', 'lost_found', 'announcement', 'club', 'system', 'admin']` | Compound with recipient | Alert domain |
| `title` | String | Yes | None | Trimmed, max 150 chars | None | Notification heading |
| `message` | String | Yes | None | Trimmed | None | Full text message |
| `entityType` | String | No | `'System'` | Enum: `['Event', 'LostFound', 'Claim', 'Announcement', 'Club', 'User', 'System']` | None | Associated entity class |
| `entityId` | ObjectId | No | `null` | Generic ObjectId | None | Target document ID |
| `priority` | String | No | `'normal'` | Enum: `['normal', 'important', 'urgent']` | None | Alert importance |
| `isRead` | Boolean | No | `false` | Boolean flag | Compound with recipient | Read status |
| `expiresAt` | Date | No | `null` | Valid Date | Compound Index | Automatic purge date |
| `metadata` | Object | No | Defaults | Sub-fields: `actionUrl`, `icon`, `status`, `extra` | None | Navigation action metadata |

---

## 3. Complete API Endpoint Inventory

The backend exposes **52 verified REST endpoints** mapped across 8 routers.

### 3.1 Authentication & User Management (`/api/auth`, `/api/users`)

| # | HTTP Method | Path | Controller Function | Auth Tier | Request Parameters / Body | Response Status & Structure | Database Model | Frontend Caller | Status |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `POST` | `/api/auth/register-student` | `registerStudent` | Public | Body: `{ name, email, collegeId, rollNumber, branch, year, section, password, confirmPassword }` | `201 Created`: `{ success: true, token, user }` | `User` | `StudentSignup.jsx`, `AuthContext.jsx` | Implemented |
| 2 | `POST` | `/api/auth/register-faculty` | `registerFaculty` | Public | Body: `{ name, email, collegeId, department, password, confirmPassword }` | `201 Created`: `{ success: true, token, user }` | `User` | `FacultySignup.jsx`, `AuthContext.jsx` | Implemented |
| 3 | `POST` | `/api/auth/login` | `login` | Public | Body: `{ identifier, password }` | `200 OK`: `{ success: true, token, user }` | `User` | `Login.jsx`, `AuthContext.jsx` | Implemented |
| 4 | `POST` | `/api/auth/forgot-password` | `forgotPassword` | Public | Body: `{ email }` | `200 OK`: `{ success: true, message }` | `User` | `Login.jsx` | Simulated (Mock Dispatch) |
| 5 | `GET` | `/api/auth/me` | `getMe` | Private (`protect`) | Headers: `Authorization: Bearer <token>` | `200 OK`: `{ success: true, user }` | `User` | `AuthContext.jsx` | Implemented |
| 6 | `GET` | `/api/users/profile` | `getUserProfile` | Private (`protect`) | Headers: `Authorization: Bearer <token>` | `200 OK`: `{ success: true, profile: { ..., joinedClubs: [] } }` | `User` | `Profile.jsx` | Implemented |
| 7 | `PUT` | `/api/users/profile` | `updateUserProfile` | Private (`protect`) | Body: `{ name, section, year, department, profileImage, newPassword }` | `200 OK`: `{ success: true, message, user }` | `User` | `Profile.jsx` | Implemented |
| 8 | `GET` | `/api/users` | `getAllUsers` | Admin (`authorize('ADMIN')`) | Query: `role, branch, department, search, limit, page` | `200 OK`: `{ success: true, count, users }` | `User` | Admin Console | Implemented |

---

### 3.2 Campus Events Module (`/api/events`)

| # | HTTP Method | Path | Controller Function | Auth Tier | Request Parameters / Body | Response Status & Structure | Database Model | Frontend Caller | Status |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 9 | `GET` | `/api/events` | `getApprovedEvents` | Private (`protect`) | Query: `category, branch, search, sort` | `200 OK`: `{ success: true, count, events }` | `Event` | `Events.jsx`, `Dashboard.jsx` | Implemented (Branch Isolated) |
| 10 | `GET` | `/api/events/my-events` | `getMyEvents` | Private (`protect`) | Headers: `Authorization` | `200 OK`: `{ success: true, count, events }` | `Event` | `MyEvents.jsx` | Implemented |
| 11 | `GET` | `/api/events/admin/all` | `getAdminAllEvents` | Admin (`authorize('ADMIN')`) | Query: `status, category, search, limit, page` | `200 OK`: `{ success: true, counts, events }` | `Event` | `AdminEvents.jsx`, `AdminOverview.jsx` | Implemented |
| 12 | `PUT` | `/api/events/:id/approve` | `approveEvent` | Admin (`authorize('ADMIN')`) | Params: `id` | `200 OK`: `{ success: true, message, event }` | `Event`, `Notification` | `AdminEvents.jsx`, `EventDetails.jsx` | Implemented |
| 13 | `PUT` | `/api/events/:id/reject` | `rejectEvent` | Admin (`authorize('ADMIN')`) | Params: `id`, Body: `{ rejectionReason }` | `200 OK`: `{ success: true, message, event }` | `Event`, `Notification` | `AdminEvents.jsx`, `EventDetails.jsx` | Implemented |
| 14 | `PUT` | `/api/events/:id/status` | `updateEventStatus` | Admin (`authorize('ADMIN')`) | Params: `id`, Body: `{ status, rejectionReason }` | `200 OK`: `{ success: true, event }` | `Event` | Admin API | Implemented |
| 15 | `GET` | `/api/events/:id` | `getEventById` | Private (`protect`) | Params: `id` | `200 OK`: `{ success: true, event }` | `Event` | `EventDetails.jsx` | Implemented |
| 16 | `POST` | `/api/events` | `createEvent` | Private (`protect`) | Body: `{ title, description, category, date, startTime, endTime, venue, organizer, targetAudience, branch, image }` | `201 Created`: `{ success: true, message, event }` | `Event` | `CreateEvent.jsx` | Implemented |
| 17 | `PUT` | `/api/events/:id` | `updateEvent` | Private (Owner/Admin) | Params: `id`, Body: Editable event fields | `200 OK`: `{ success: true, message, event }` | `Event` | Event Edit View | Implemented |
| 18 | `DELETE`| `/api/events/:id` | `deleteEvent` | Private (Owner/Admin) | Params: `id` | `200 OK`: `{ success: true, message }` | `Event` | `EventDetails.jsx`, `AdminEvents.jsx` | Implemented |
| 19 | `PUT` | `/api/events/:id/cancel` | `cancelEvent` | Private (Owner/Admin) | Params: `id` | `200 OK`: `{ success: true, message, event }` | `Event` | `EventDetails.jsx` | Implemented |

---

### 3.3 Lost & Found Hub (`/api/lost-found`)

| # | HTTP Method | Path | Controller Function | Auth Tier | Request Parameters / Body | Response Status & Structure | Database Model | Frontend Caller | Status |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 20 | `GET` | `/api/lost-found` | `getLostFoundItems` | Private (`protect`) | Query: `type, category, location, search, sort` | `200 OK`: `{ success: true, count, items }` | `LostFound` | `LostFound.jsx`, `Dashboard.jsx` | Implemented |
| 21 | `GET` | `/api/lost-found/my-reports` | `getMyReports` | Private (`protect`) | Headers: `Authorization` | `200 OK`: `{ success: true, count, items }` | `LostFound` | `MyLostFound.jsx` | Implemented |
| 22 | `GET` | `/api/lost-found/my-claims` | `getMyClaims` | Private (`protect`) | Headers: `Authorization` | `200 OK`: `{ success: true, count, claims }` | `Claim` | `MyLostFound.jsx` | Implemented |
| 23 | `GET` | `/api/lost-found/admin/all` | `getAdminAllLostFound` | Admin (`authorize('ADMIN')`) | Query: `type, status, search, limit, page` | `200 OK`: `{ success: true, counts, items }` | `LostFound` | `AdminLostFound.jsx`, `AdminOverview.jsx` | Implemented |
| 24 | `PUT` | `/api/lost-found/admin/:id/moderate` | `moderateLostFound` | Admin (`authorize('ADMIN')`) | Params: `id`, Body: `{ status, rejectionReason }` | `200 OK`: `{ success: true, message, item }` | `LostFound`, `Notification` | `AdminLostFound.jsx` | Implemented |
| 25 | `PUT` | `/api/lost-found/claims/:claimId/approve`| `approveClaim` | Private (Finder/Admin) | Params: `claimId`, Body: `{ reviewNote }` | `200 OK`: `{ success: true, message, claim }` | `Claim`, `LostFound`, `Notification` | `LostFoundDetails.jsx` | Implemented |
| 26 | `PUT` | `/api/lost-found/claims/:claimId/reject` | `rejectClaim` | Private (Finder/Admin) | Params: `claimId`, Body: `{ reviewNote }` | `200 OK`: `{ success: true, message, claim }` | `Claim`, `LostFound`, `Notification` | `LostFoundDetails.jsx` | Implemented |
| 27 | `GET` | `/api/lost-found/:id` | `getLostFoundById` | Private (`protect`) | Params: `id` | `200 OK`: `{ success: true, item, isCreator, hasClaimed }` | `LostFound` | `LostFoundDetails.jsx` | Implemented |
| 28 | `POST` | `/api/lost-found` | `createLostFound` | Private (`protect`) | Body: Item fields (title, desc, type, category, location, date, time, color, brand, uniqueDetails, contact) | `201 Created`: `{ success: true, message, item }` | `LostFound` | `CreateLostFound.jsx` | Implemented |
| 29 | `PUT` | `/api/lost-found/:id` | `updateLostFound` | Private (Owner/Admin) | Params: `id`, Body: Item fields | `200 OK`: `{ success: true, message, item }` | `LostFound` | Edit View | Implemented |
| 30 | `PUT` | `/api/lost-found/:id/close` | `closeLostFound` | Private (Owner/Admin) | Params: `id`, Body: `{ action: 'resolved' \| 'closed' }` | `200 OK`: `{ success: true, message, item }` | `LostFound` | `LostFoundDetails.jsx` | Implemented |
| 31 | `DELETE`| `/api/lost-found/:id` | `deleteLostFound` | Private (Owner/Admin) | Params: `id` | `200 OK`: `{ success: true, message }` | `LostFound`, `Claim` | `LostFoundDetails.jsx` | Implemented |
| 32 | `POST` | `/api/lost-found/:id/claim` | `submitClaim` | Private (`protect`) | Params: `id`, Body: `{ reason, identifyingDetails, previousLocation, contactNumber }` | `201 Created`: `{ success: true, message, claim }` | `Claim`, `LostFound`, `Notification` | `LostFoundDetails.jsx` | Implemented |
| 33 | `GET` | `/api/lost-found/:id/claims`| `getItemClaims` | Private (Finder/Admin) | Params: `id` | `200 OK`: `{ success: true, count, claims }` | `Claim` | `LostFoundDetails.jsx` | Implemented |

---

### 3.4 Campus Announcements & Official Circulars (`/api/announcements`)

| # | HTTP Method | Path | Controller Function | Auth Tier | Request Parameters / Body | Response Status & Structure | Database Model | Frontend Caller | Status |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 34 | `GET` | `/api/announcements` | `getAnnouncements` | Private (`protect`) | Query: `category, priority, search, sort` | `200 OK`: `{ success: true, count, unreadCount, announcements }` | `Announcement` | `Announcements.jsx`, `Dashboard.jsx` | Implemented (Strict Branch Filter) |
| 35 | `PUT` | `/api/announcements/mark-all-read` | `markAllAsRead` | Private (`protect`) | Headers: `Authorization` | `200 OK`: `{ success: true, message }` | `Announcement` | `Announcements.jsx` | Implemented |
| 36 | `GET` | `/api/announcements/my-announcements`| `getMyAnnouncements` | Admin / Faculty | Query: `status, category, search` | `200 OK`: `{ success: true, count, announcements }` | `Announcement` | `ManageAnnouncements.jsx` | Implemented |
| 37 | `GET` | `/api/announcements/admin/all` | `getAdminAllAnnouncements` | Admin (`authorize('ADMIN')`)| Query: `category, priority, search, limit, page` | `200 OK`: `{ success: true, counts, announcements }` | `Announcement` | `AdminAnnouncements.jsx`, `AdminOverview.jsx` | Implemented |
| 38 | `GET` | `/api/announcements/:id` | `getAnnouncementById` | Private (`protect`) | Params: `id` | `200 OK`: `{ success: true, announcement, isAuthor }` | `Announcement` | `AnnouncementDetails.jsx` | Implemented |
| 39 | `POST` | `/api/announcements` | `createAnnouncement` | Admin / Faculty | Body: `{ title, summary, content, category, priority, audience, branch, year, section, attachment, image, isPinned }` | `201 Created`: `{ success: true, message, announcement }` | `Announcement`, `Notification` | `CreateAnnouncement.jsx` | Implemented |
| 40 | `PUT` | `/api/announcements/:id` | `updateAnnouncement` | Admin / Faculty (Author) | Params: `id`, Body: Announcement fields | `200 OK`: `{ success: true, message, announcement }` | `Announcement` | Edit View | Implemented |
| 41 | `PUT` | `/api/announcements/:id/read` | `markAsRead` | Private (`protect`) | Params: `id` | `200 OK`: `{ success: true, message }` | `Announcement` | `AnnouncementDetails.jsx` | Implemented |
| 42 | `DELETE`| `/api/announcements/:id` | `deleteAnnouncement` | Admin / Faculty (Author) | Params: `id` | `200 OK`: `{ success: true, message }` | `Announcement` | `AnnouncementDetails.jsx`, `AdminAnnouncements.jsx` | Implemented |

---

### 3.5 Clubs & Societies Governance (`/api/clubs`)

| # | HTTP Method | Path | Controller Function | Auth Tier | Request Parameters / Body | Response Status & Structure | Database Model | Frontend Caller | Status |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 43 | `GET` | `/api/clubs` | `getClubs` | Private (`protect`) | Query: `category, branch, department, search, sort` | `200 OK`: `{ success: true, count, clubs }` | `Club` | `Clubs.jsx`, `Dashboard.jsx` | Implemented |
| 44 | `GET` | `/api/clubs/my-clubs` | `getMyClubs` | Private (`protect`) | Headers: `Authorization` | `200 OK`: `{ success: true, joinedClubs, coordinatedClubs, pendingClubs }` | `Club` | `MyClubs.jsx`, `Dashboard.jsx` | Implemented |
| 45 | `GET` | `/api/clubs/admin/all` | `getAdminAllClubs` | Admin (`authorize('ADMIN')`) | Query: `status, category, search, limit, page` | `200 OK`: `{ success: true, counts, clubs }` | `Club` | `AdminClubs.jsx`, `AdminOverview.jsx` | Implemented |
| 46 | `PUT` | `/api/clubs/:id/approve` | `approveClub` | Admin (`authorize('ADMIN')`) | Params: `id` | `200 OK`: `{ success: true, message, club }` | `Club`, `Notification` | `AdminClubs.jsx` | Implemented |
| 47 | `PUT` | `/api/clubs/:id/reject` | `rejectClub` | Admin (`authorize('ADMIN')`) | Params: `id`, Body: `{ rejectionReason }` | `200 OK`: `{ success: true, message, club }` | `Club`, `Notification` | `AdminClubs.jsx` | Implemented |
| 48 | `POST` | `/api/clubs/:id/join` | `joinClub` | Private (`protect`) | Params: `id`, Body: `{ statement }` | `200 OK`: `{ success: true, message, club }` | `Club`, `Notification` | `ClubDetails.jsx` | Implemented |
| 49 | `POST` | `/api/clubs/:id/leave` | `leaveClub` | Private (`protect`) | Params: `id` | `200 OK`: `{ success: true, message, club }` | `Club` | `ClubDetails.jsx`, `MyClubs.jsx` | Implemented |
| 50 | `GET` | `/api/clubs/:id/pending-members` | `getPendingMembers` | Club Leadership / Admin | Params: `id` | `200 OK`: `{ success: true, count, pendingMembers }` | `Club` | `ClubDetails.jsx` | Implemented |
| 51 | `GET` | `/api/clubs/:id/members` | `getClubMembers` | Private (`protect`) | Params: `id` | `200 OK`: `{ success: true, count, members }` | `Club` | `ClubDetails.jsx` | Implemented |
| 52 | `PUT` | `/api/clubs/:id/approve-member/:userId` | `approveMember` | Club Leadership / Admin | Params: `id, userId`, Body: `{ role }` | `200 OK`: `{ success: true, message, club }` | `Club`, `Notification` | `ClubDetails.jsx` | Implemented |
| 53 | `PUT` | `/api/clubs/:id/reject-member/:userId` | `rejectMember` | Club Leadership / Admin | Params: `id, userId` | `200 OK`: `{ success: true, message, club }` | `Club`, `Notification` | `ClubDetails.jsx` | Implemented |
| 54 | `DELETE`| `/api/clubs/:id/members/:userId` | `removeMember` | Club Leadership / Admin | Params: `id, userId` | `200 OK`: `{ success: true, message, club }` | `Club` | `ClubDetails.jsx` | Implemented |
| 55 | `GET` | `/api/clubs/:id` | `getClubById` | Private (`protect`) | Params: `id` | `200 OK`: `{ success: true, club, isMember, isPending, isLeader }` | `Club`, `Event`, `Announcement` | `ClubDetails.jsx` | Implemented |
| 56 | `POST` | `/api/clubs` | `createClub` | Private (`protect`) | Body: `{ name, shortDescription, description, category, department, branch, logo, coverImage, socialLinks }` | `201 Created`: `{ success: true, message, club }` | `Club` | `CreateClub.jsx` | Implemented |
| 57 | `PUT` | `/api/clubs/:id` | `updateClub` | Club Leadership / Admin | Params: `id`, Body: Editable club fields | `200 OK`: `{ success: true, message, club }` | `Club` | Edit View | Implemented |
| 58 | `DELETE`| `/api/clubs/:id` | `deleteClub` | Admin (`authorize('ADMIN')`) | Params: `id` | `200 OK`: `{ success: true, message }` | `Club` | `AdminClubs.jsx` | Implemented |

---

### 3.6 Notifications, Uploads & Health (`/api/notifications`, `/api/uploads`, `/api/health`)

| # | HTTP Method | Path | Controller Function | Auth Tier | Request Parameters / Body | Response Status & Structure | Database Model | Frontend Caller | Status |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 59 | `GET` | `/api/notifications` | `getNotifications` | Private (`protect`) | Query: `unreadOnly, priority, limit, page` | `200 OK`: `{ success: true, count, unreadCount, notifications }` | `Notification` | `Notifications.jsx`, `DashboardLayout.jsx` | Implemented |
| 60 | `GET` | `/api/notifications/unread-count`| `getUnreadCount` | Private (`protect`) | Headers: `Authorization` | `200 OK`: `{ success: true, unreadCount }` | `Notification` | `DashboardLayout.jsx` (Poller) | Implemented |
| 61 | `GET` | `/api/notifications/activity` | `getActivityStream` | Private (`protect`) | Query: `limit, page` | `200 OK`: `{ success: true, count, activities }` | `Notification` | `Notifications.jsx` | Implemented |
| 62 | `PUT` | `/api/notifications/mark-all-read` | `markAllAsRead` | Private (`protect`) | Headers: `Authorization` | `200 OK`: `{ success: true, message }` | `Notification` | `Notifications.jsx`, `DashboardLayout.jsx` | Implemented |
| 63 | `PUT` | `/api/notifications/:id/read` | `markAsRead` | Private (`protect`) | Params: `id` | `200 OK`: `{ success: true, message }` | `Notification` | `Notifications.jsx`, `DashboardLayout.jsx` | Implemented |
| 64 | `DELETE`| `/api/notifications/:id` | `deleteNotification` | Private (`protect`) | Params: `id` | `200 OK`: `{ success: true, message }` | `Notification` | `Notifications.jsx` | Implemented |
| 65 | `POST` | `/api/uploads/image` | `uploadImage` | Private (`protect`) | Multipart `FormData`: `image` file (< 10MB) | `200 OK`: `{ success: true, url, file: {...} }` | Filesystem | `ImageUpload.jsx`, `Profile.jsx` | Implemented |
| 66 | `GET` | `/api/health` | Inline handler in `server.js` | Public | None | `200 OK`: `{ status: 'OK', app: 'Campus Connect API', version: '1.0.0', time }` | None | Monitoring / Health Check | Implemented |
