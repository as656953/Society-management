# Society Management Application - Project Roadmap

> A comprehensive guide for developing a complete Society Management System that includes property management, amenity bookings, security logging, and resident services.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Current State](#current-state)
3. [Target State](#target-state)
4. [Phase 1A: Google Authentication](#phase-1a-google-authentication)
5. [Phase 1B: Foundation & User-Apartment Linking](#phase-1b-foundation--user-apartment-linking)
6. [Phase 2: Security & Visitor Management](#phase-2-security--visitor-management)
7. [Phase 3: Complaints & Maintenance System](#phase-3-complaints--maintenance-system)
8. [Phase 4: Enhanced Features](#phase-4-enhanced-features)
9. [Phase 5: Reports & Analytics](#phase-5-reports--analytics)
10. [Phase 6: Notifications & Communication](#phase-6-notifications--communication)
11. [Database Schema Evolution](#database-schema-evolution)
12. [API Endpoints Reference](#api-endpoints-reference)
13. [Testing Checklist](#testing-checklist)
14. [Deployment Considerations](#deployment-considerations)

---

## Project Overview

### Purpose
A unified platform for managing all aspects of a residential society including:
- Property management (towers, apartments, residents)
- Amenity bookings (gym, clubhouse, guest house)
- Security and visitor logging
- Complaints and maintenance requests
- Notices and announcements
- Resident communication

### User Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| **Admin** | Society office staff / Manager | Full access to all features |
| **Resident** | Apartment owners/tenants | Personal dashboard, bookings, complaints, pre-approve visitors |
| **Guard** | Security personnel at gate | Visitor entry/exit logging only |

### Tech Stack
- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Express.js + TypeScript
- **Database:** PostgreSQL (Supabase)
- **ORM:** Drizzle ORM
- **UI:** shadcn/ui + Tailwind CSS
- **State Management:** TanStack React Query
- **Authentication:** Passport.js (Local Strategy + Google OAuth 2.0)

---

## Current State

### What's Working (As of December 2024)

#### Authentication & Users
- [x] User registration and login (username/password)
- [x] Password hashing with scrypt
- [x] Session management with PostgreSQL store
- [x] Admin and Resident roles
- [x] Admin can toggle user roles
- [x] Admin can delete users

#### Property Management
- [x] Create/Edit/Delete towers
- [x] Create/Edit/Delete apartments
- [x] Apartment details (number, floor, type, status)
- [x] Apartment status tracking (Occupied/For Rent/For Sale)

#### Amenities & Bookings
- [x] View all amenities
- [x] Book amenities with date selection
- [x] Booking approval workflow (Pending -> Approved/Rejected)
- [x] View personal bookings
- [x] Admin booking management

#### Notices
- [x] Create notices with priority (High/Normal/Low)
- [x] Notice expiration dates
- [x] Auto-archive of expired notices (soft delete)
- [x] Display notices on dashboard
- [x] Admin can view archived notices

### What's Missing / Needs Improvement
- [ ] Google OAuth login/registration
- [ ] Password reset / Forgot password
- [ ] User-Apartment assignment by admin
- [ ] Multiple users per apartment (family members)
- [ ] Block features for users without apartment
- [ ] Guard role for security
- [ ] Visitor entry/exit logging
- [ ] Pre-approved visitors system
- [ ] Complaints/Maintenance system
- [ ] User profile management
- [ ] Password change functionality
- [ ] Amenity CRUD for admin
- [ ] Email notifications
- [ ] Reports and analytics
- [ ] Vehicle management
- [ ] Data retention/cleanup policies
- [ ] Payment/Dues tracking

---

## Target State

### Final Application Structure

```
Society Management App
|-- Authentication
|   |-- Login (Email/Password OR Google)
|   |-- Register (Email/Password OR Google)
|   |-- Password Reset
|   +-- Profile Management
|
|-- Dashboard (Role-based)
|   |-- Admin Dashboard
|   |-- Resident Dashboard
|   +-- Guard Dashboard
|
|-- Property Management (Admin)
|   |-- Towers CRUD
|   |-- Apartments CRUD
|   +-- User-Apartment Assignment
|
|-- User Management (Admin)
|   |-- View all users
|   |-- Assign roles (Admin/Resident/Guard)
|   |-- Assign apartments
|   +-- Delete users
|
|-- Amenity Bookings (Resident)
|   |-- Browse amenities
|   |-- Book with date/time
|   |-- View my bookings
|   +-- Cancel bookings
|
|-- Booking Management (Admin)
|   |-- View all bookings
|   |-- Approve/Reject
|   +-- Booking calendar view
|
|-- Security Module
|   |-- Visitor Entry (Guard)
|   |-- Visitor Exit/Checkout (Guard)
|   |-- Pre-Approved Visitors (Resident)
|   |-- Visitor Logs (Admin)
|   +-- Security Dashboard (Guard)
|
|-- Complaints System
|   |-- File Complaint (Resident)
|   |-- Track Status (Resident)
|   |-- Manage Complaints (Admin)
|   +-- Resolution Updates
|
|-- Notices (Admin -> All)
|   |-- Create/Edit/Delete
|   |-- Priority levels
|   +-- Expiration management
|
+-- Reports (Admin)
    |-- Visitor Reports
    |-- Booking Reports
    |-- Complaint Reports
    +-- Occupancy Reports
```

---

## Phase 1A: Google Authentication

### Objective
Allow users to register and login using their Google account. This provides a seamless onboarding experience and automatically populates user information (name, email, profile picture) from Google.

### Duration: 1-2 days

### Why Google Auth First?
1. Easier onboarding for new residents
2. Auto-fills name and email from Google profile
3. More secure (no password to store for Google users)
4. Users can link Google account to existing account later
5. Foundation for future OAuth providers (if needed)

### Tasks

#### 1A.1 Backend Setup - Google OAuth Strategy
- [ ] Install required packages: `passport-google-oauth20`
- [ ] Create Google Cloud Console project
- [ ] Configure OAuth 2.0 credentials (Client ID, Client Secret)
- [ ] Add Google OAuth strategy to Passport.js
- [ ] Create callback route for Google OAuth

#### 1A.2 Schema Updates
```sql
-- Add new fields to users table for OAuth support
ALTER TABLE users ADD COLUMN email TEXT UNIQUE;
ALTER TABLE users ADD COLUMN google_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN profile_picture TEXT;
ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'local'; -- 'local' or 'google'
ALTER TABLE users ALTER COLUMN password DROP NOT NULL; -- Password nullable for Google users
```

#### 1A.3 Backend Authentication Routes
- [ ] `GET /api/auth/google` - Initiate Google OAuth flow
- [ ] `GET /api/auth/google/callback` - Handle Google callback
- [ ] Update `/api/register` to accept email field
- [ ] Update `/api/user` to return new fields
- [ ] Handle account linking (Google to existing local account)

#### 1A.4 Password Reset (Forgot Password)
- [ ] Create `POST /api/auth/forgot-password` - Send reset email
- [ ] Create `POST /api/auth/reset-password` - Reset with token
- [ ] Create password reset email template
- [ ] Create "Forgot Password" page in frontend
- [ ] Create "Reset Password" page with token validation
- [ ] Token expiration (1 hour)
- [ ] Rate limit reset requests (max 3 per hour per email)

**Note:** Password reset requires email configuration. If email is not set up yet, this can be deferred to Phase 6. For now, admin can manually reset passwords by updating the database.

#### 1A.5 Frontend - Auth Page Updates
- [ ] Add "Continue with Google" button on login page
- [ ] Add "Sign up with Google" button on register page
- [ ] Add "Forgot Password?" link on login page
- [ ] Style Google button according to Google branding guidelines
- [ ] Handle OAuth redirect flow
- [ ] Show profile picture in navigation (if available)

#### 1A.6 User Experience Flow

**New User with Google:**
```
1. User clicks "Continue with Google"
2. Redirected to Google sign-in
3. User grants permission
4. Callback creates new user with:
   - name: from Google profile
   - email: from Google profile
   - google_id: Google's unique ID
   - profile_picture: from Google profile
   - auth_provider: 'google'
   - password: NULL
   - apartmentId: NULL (admin assigns later)
5. User logged in and redirected to dashboard
6. Dashboard shows "No apartment assigned" message
```

**Existing User with Google:**
```
1. User clicks "Continue with Google"
2. System finds user by google_id
3. Updates profile_picture if changed
4. User logged in
```

**Link Google to Existing Local Account:**
```
1. User logs in with username/password
2. Goes to Profile settings
3. Clicks "Link Google Account"
4. Authenticates with Google
5. google_id and email added to existing account
6. User can now login with either method
```

**Password Reset Flow:**
```
1. User clicks "Forgot Password?" on login page
2. Enters email address
3. System sends reset link to email (valid for 1 hour)
4. User clicks link in email
5. Redirected to "Reset Password" page
6. Enters new password (with confirmation)
7. Password updated, redirected to login
8. User logs in with new password
```

#### 1A.7 Environment Variables
```env
# Add to .env file
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

#### 1A.8 Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "Society Management"
3. Enable Google+ API
4. Go to Credentials -> Create OAuth 2.0 Client ID
5. Application type: Web application
6. Authorized redirect URIs:
   - Development: `http://localhost:5000/api/auth/google/callback`
   - Production: `https://yourdomain.com/api/auth/google/callback`
7. Copy Client ID and Client Secret to `.env`

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/google` | Start Google OAuth flow |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| POST | `/api/auth/link-google` | Link Google to existing account |
| POST | `/api/auth/unlink-google` | Remove Google from account |
| POST | `/api/auth/forgot-password` | Send password reset email |
| POST | `/api/auth/reset-password` | Reset password with token |

### Frontend Components to Update

| Component | Changes |
|-----------|---------|
| `auth-page.tsx` | Add Google sign-in/up buttons, "Forgot Password?" link |
| `Navigation.tsx` | Show profile picture if available |
| `use-auth.tsx` | Handle OAuth redirect response |
| `forgot-password.tsx` | New page for entering email |
| `reset-password.tsx` | New page for setting new password |

### Security Considerations
- [ ] Validate Google token on callback
- [ ] Store only necessary Google data
- [ ] Handle case where Google email already exists as local account
- [ ] Secure callback URL validation
- [ ] Rate limit OAuth endpoints
- [ ] Rate limit password reset requests
- [ ] Use secure random tokens for password reset (crypto.randomBytes)
- [ ] Hash reset tokens before storing in database
- [ ] Invalidate reset token after use

### Testing Checklist
- [ ] New user can register with Google
- [ ] Existing Google user can login
- [ ] User info (name, email, picture) populated from Google
- [ ] Local login still works
- [ ] User can link Google to existing local account
- [ ] User can unlink Google (if has password set)
- [ ] Profile picture displays in navigation
- [ ] OAuth errors handled gracefully
- [ ] Callback URL validation works
- [ ] Forgot password sends email (if email configured)
- [ ] Reset link works and expires after 1 hour
- [ ] Password successfully reset
- [ ] Old reset tokens don't work after password change
- [ ] Rate limiting prevents abuse

### Completion Criteria
- Google OAuth fully integrated
- Both local and Google auth work
- User profile populated from Google
- Account linking/unlinking functional
- Password reset functional (or documented as deferred to Phase 6)
- All tests passing

### UI Mockup - Auth Page

```
+------------------------------------------+
|          Society Management              |
|                                          |
|  +------------------------------------+  |
|  |     [Google Icon] Continue with   |  |
|  |            Google                  |  |
|  +------------------------------------+  |
|                                          |
|  ──────────── OR ────────────           |
|                                          |
|  Username/Email: [________________]      |
|  Password:       [________________]      |
|                                          |
|  [        Login        ]                 |
|                                          |
|  Forgot Password?                        |
|                                          |
|  Don't have an account? Register         |
+------------------------------------------+
```

### Schema Addition for Password Reset

```sql
-- Password reset tokens table
CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,  -- Store hashed token, not plain
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,  -- NULL if not used
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
```

---

## Phase 1B: Foundation & User-Apartment Linking

### Objective
Establish the core relationship between users and apartments. This is foundational because all future features (complaints, pre-approved visitors, etc.) depend on knowing which apartment a user belongs to.

### Duration: 1-2 days

### Prerequisites
- Phase 1A completed (Google Auth working)

### Tasks

#### 1B.1 Schema Updates
- [ ] Keep `apartmentId` on users table (nullable for new users)
- [ ] Add validation schema for apartment assignment
- [ ] Ensure multiple users can have same `apartmentId` (family members)

#### 1B.2 Backend Changes
- [ ] Create `PATCH /api/users/:id/apartment` endpoint
- [ ] Add `assignApartment(userId, apartmentId)` to storage layer
- [ ] Add `getUsersByApartment(apartmentId)` to get all residents of an apartment
- [ ] Add `getApartmentWithResidents(apartmentId)` for detailed view
- [ ] Add `removeApartmentAssignment(userId)` to unassign user

#### 1B.3 User Management UI Updates
- [ ] Add "Assign Apartment" button/dropdown to each user card
- [ ] Show apartment details (Tower + Number) instead of just ID
- [ ] Add filter: "Users without apartment"
- [ ] Show count of residents per apartment
- [ ] Add "Remove Assignment" option

#### 1B.4 Validation & Restrictions
- [ ] Block amenity booking if user has no apartment assigned
- [ ] Show appropriate message: "Please contact admin to get your apartment assigned"
- [ ] Admin users can optionally have apartment (for resident-admins)
- [ ] Guard users don't need apartment assignment

#### 1B.5 Dashboard Updates
- [ ] Show proper apartment info (Tower name + Apartment number)
- [ ] Show other family members in same apartment
- [ ] For admin: Show count of unassigned users as alert
- [ ] Quick link to User Management for admin

#### 1B.6 Apartment Details Enhancement
- [ ] Show list of residents in apartment details
- [ ] Show resident count badge on apartment cards
- [ ] Admin can see all residents per apartment

### Database Changes

```sql
-- No new tables needed, utilizing existing apartmentId field
-- Add index for better query performance
CREATE INDEX idx_users_apartment_id ON users(apartment_id);

-- Add index for email lookups (for Google auth)
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
```

### API Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| PATCH | `/api/users/:id/apartment` | Assign apartment to user | Admin |
| DELETE | `/api/users/:id/apartment` | Remove apartment assignment | Admin |
| GET | `/api/apartments/:id/residents` | Get all users in an apartment | Admin |
| GET | `/api/users/unassigned` | Get users without apartment | Admin |

### Testing Checklist
- [ ] Admin can assign apartment to a user
- [ ] Admin can remove apartment assignment
- [ ] Multiple users can be assigned to same apartment
- [ ] User without apartment sees "No apartment assigned" message
- [ ] User without apartment cannot book amenities
- [ ] User without apartment sees appropriate error when trying to book
- [ ] Dashboard shows correct apartment details (Tower + Number)
- [ ] Dashboard shows other family members
- [ ] User Management shows apartment info correctly
- [ ] User Management filter for unassigned users works
- [ ] Changing apartment assignment works correctly
- [ ] Admin dashboard shows unassigned users count

### Completion Criteria
- All tasks checked off
- All tests passing
- No console errors
- Admin can successfully assign/unassign apartments to users
- Multiple family members can be in one apartment
- Unassigned users properly restricted

---

## Phase 2: Security & Visitor Management

### Objective
Integrate the Security LogBook functionality into the main application. Add Guard role and complete visitor management system.

### Duration: 3-4 days

### Prerequisites
- Phase 1A completed (Google Auth)
- Phase 1B completed (User-Apartment linking)

### Tasks

#### 2.1 Schema Updates
- [ ] Add `role` field to users: `'admin' | 'resident' | 'guard'`
- [ ] Create `visitors` table
- [ ] Create `pre_approved_visitors` table
- [ ] Migrate existing `isAdmin` to new role system

#### 2.2 New Database Tables

```sql
-- Visitors table (entry/exit log)
CREATE TABLE visitors (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    mobile_number VARCHAR(15) NOT NULL,
    purpose TEXT NOT NULL,  -- 'personal', 'delivery', 'service', 'maintenance', 'family', 'other'
    apartment_id INTEGER NOT NULL REFERENCES apartments(id),
    vehicle_number TEXT,
    photo_url TEXT,
    entry_time TIMESTAMP NOT NULL DEFAULT NOW(),
    exit_time TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'inside',  -- 'inside', 'checked_out'
    created_by INTEGER NOT NULL REFERENCES users(id),
    notes TEXT
);

-- Pre-approved visitors table
CREATE TABLE pre_approved_visitors (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    mobile_number VARCHAR(15),
    purpose TEXT NOT NULL,
    apartment_id INTEGER NOT NULL REFERENCES apartments(id),
    expected_date DATE NOT NULL,
    expected_time_from TIME,
    expected_time_to TIME,
    number_of_persons INTEGER DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'arrived', 'expired', 'cancelled'
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    notes TEXT
);

-- Indexes for performance
CREATE INDEX idx_visitors_apartment_id ON visitors(apartment_id);
CREATE INDEX idx_visitors_entry_time ON visitors(entry_time);
CREATE INDEX idx_visitors_status ON visitors(status);
CREATE INDEX idx_pre_approved_apartment_id ON pre_approved_visitors(apartment_id);
CREATE INDEX idx_pre_approved_expected_date ON pre_approved_visitors(expected_date);
```

#### 2.3 Role System Migration
- [ ] Add `role` column to users table
- [ ] Migrate: `isAdmin = true` -> `role = 'admin'`
- [ ] Migrate: `isAdmin = false` -> `role = 'resident'`
- [ ] Update authentication to use `role` instead of `isAdmin`
- [ ] Update all admin checks in backend middleware
- [ ] Update all admin checks in frontend
- [ ] Create `isGuard` middleware for guard-only routes
- [ ] Create `isResident` middleware for resident-only routes

#### 2.4 Guard Features
- [ ] Create Guard Dashboard page (`/guard`)
- [ ] Create Visitor Entry form (`/guard/entry`)
- [ ] Create Visitor Checkout functionality
- [ ] Show today's visitors count
- [ ] Show currently inside visitors count
- [ ] Show pending pre-approved visitors list
- [ ] Search visitors by name/mobile/apartment
- [ ] Quick checkout from visitor list

#### 2.5 Resident Features
- [ ] Create "Pre-Approve Visitor" dialog/page
- [ ] List my pre-approved visitors
- [ ] Cancel pre-approval before arrival
- [ ] View visitor history for my apartment
- [ ] Get notified when visitor arrives (Phase 6)

#### 2.6 Admin Features
- [ ] View all visitor logs
- [ ] Filter by date range, apartment, tower, purpose
- [ ] Export visitor logs (CSV)
- [ ] Manage guard accounts
- [ ] View security statistics
- [ ] Create/delete guard users

#### 2.7 Navigation Updates
- [ ] Add Guard-specific sidebar/navigation
- [ ] Conditionally show menu items based on role
- [ ] Create role-based route protection HOC
- [ ] Redirect users to appropriate dashboard based on role

#### 2.8 Visitor Entry Form Fields
```
- Visitor Name (required)
- Mobile Number (required, validated)
- Purpose (dropdown: personal, delivery, service, maintenance, family, other)
- Apartment (searchable dropdown with Tower + Number)
- Vehicle Number (optional)
- Photo (optional, camera capture)
- Notes (optional)
```

#### 2.9 Pre-Approval Form Fields
```
- Visitor Name (required)
- Mobile Number (optional)
- Purpose (dropdown)
- Expected Date (required, date picker)
- Expected Time Range (optional)
- Number of Persons (default: 1)
- Notes (optional)
```

### API Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/visitors` | Log visitor entry | Guard |
| GET | `/api/visitors` | Get all visitors (with filters) | Guard, Admin |
| GET | `/api/visitors/today` | Get today's visitors | Guard, Admin |
| GET | `/api/visitors/inside` | Get visitors currently inside | Guard, Admin |
| PATCH | `/api/visitors/:id/checkout` | Mark visitor exit | Guard |
| GET | `/api/visitors/stats` | Get visitor statistics | Guard, Admin |
| POST | `/api/pre-approved` | Create pre-approval | Resident |
| GET | `/api/pre-approved` | Get all pre-approved (pending) | Guard, Admin |
| GET | `/api/pre-approved/my` | Get my pre-approvals | Resident |
| GET | `/api/pre-approved/today` | Get today's expected visitors | Guard |
| PATCH | `/api/pre-approved/:id/status` | Update status (arrived/cancelled) | Guard, Resident |
| DELETE | `/api/pre-approved/:id` | Cancel pre-approval | Resident (own), Admin |
| GET | `/api/apartments/:id/visitors` | Visitor history for apartment | Resident (own), Admin |

### New Pages

| Page | Route | Access | Description |
|------|-------|--------|-------------|
| Guard Dashboard | `/guard` | Guard | Security overview with stats |
| Visitor Entry | `/guard/entry` | Guard | Log new visitor form |
| Visitor Logs | `/guard/logs` | Guard, Admin | Search/view all visitors |
| Current Visitors | `/guard/current` | Guard | Visitors currently inside |
| Pre-Approve Visitor | `/visitors/pre-approve` | Resident | Create pre-approval |
| My Pre-Approvals | `/visitors/my-approvals` | Resident | View my pre-approvals |
| My Visitor History | `/visitors/history` | Resident | View apartment visitor history |
| Visitor Reports | `/admin/visitor-reports` | Admin | Visitor analytics |

### Guard Dashboard Layout

```
+--------------------------------------------------+
|  Security Dashboard           [Current Time]     |
+--------------------------------------------------+
|                                                  |
|  +----------+  +----------+  +----------+        |
|  | Today's  |  | Currently|  | Expected |        |
|  | Visitors |  | Inside   |  | Today    |        |
|  |    24    |  |    8     |  |    5     |        |
|  +----------+  +----------+  +----------+        |
|                                                  |
|  [+ Log New Visitor Entry]                       |
|                                                  |
|  Pre-Approved for Today:                         |
|  +--------------------------------------------+  |
|  | Name      | Apartment | Time    | Action  |  |
|  | John Doe  | A-101     | 2:00 PM | [Arrived]|  |
|  | Jane Doe  | B-205     | 4:00 PM | [Arrived]|  |
|  +--------------------------------------------+  |
|                                                  |
|  Currently Inside:                               |
|  +--------------------------------------------+  |
|  | Name      | Apartment | Entry   | Action  |  |
|  | Delivery  | C-302     | 10:30 AM| [Checkout]|  |
|  | Plumber   | A-101     | 11:00 AM| [Checkout]|  |
|  +--------------------------------------------+  |
|                                                  |
+--------------------------------------------------+
```

### Testing Checklist
- [ ] Guard can login and see Guard Dashboard
- [ ] Guard cannot access admin or resident pages
- [ ] Resident cannot access guard pages
- [ ] Guard can log visitor entry with all required fields
- [ ] Visitor entry auto-sets entry time
- [ ] Guard can checkout visitor (sets exit time)
- [ ] Checkout updates status to 'checked_out'
- [ ] Resident can pre-approve a visitor
- [ ] Pre-approval tied to resident's apartment
- [ ] Guard can see pre-approved visitors for today
- [ ] Guard can mark pre-approved visitor as arrived
- [ ] Resident can cancel pending pre-approval
- [ ] Expired pre-approvals auto-update status
- [ ] Admin can view all visitor logs
- [ ] Visitor logs can be filtered by date range
- [ ] Visitor logs can be filtered by apartment/tower
- [ ] Export to CSV works
- [ ] Statistics show correct counts
- [ ] Role-based navigation works correctly
- [ ] Search visitors by name/mobile works

### Completion Criteria
- Guard role fully functional with dedicated dashboard
- Visitor entry/exit workflow complete
- Pre-approval system working for residents
- All role-based access controls in place
- Statistics and reporting functional
- All tests passing

---

## Phase 3: Complaints & Maintenance System

### Objective
Allow residents to file complaints and track their resolution. Admin can manage and update complaint status.

### Duration: 2-3 days

### Prerequisites
- Phase 1A & 1B completed (user-apartment linking required)
- Phase 2 completed (role system in place)

### Tasks

#### 3.1 Schema Updates

```sql
-- Complaints table
CREATE TABLE complaints (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,  -- 'plumbing', 'electrical', 'civil', 'housekeeping', 'security', 'parking', 'noise', 'other'
    priority TEXT NOT NULL DEFAULT 'medium',  -- 'low', 'medium', 'high', 'urgent'
    status TEXT NOT NULL DEFAULT 'open',  -- 'open', 'in_progress', 'resolved', 'closed', 'rejected'
    apartment_id INTEGER NOT NULL REFERENCES apartments(id),
    created_by INTEGER NOT NULL REFERENCES users(id),
    assigned_to INTEGER REFERENCES users(id),  -- Admin who's handling it
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    images TEXT[]  -- Array of image URLs (optional)
);

-- Complaint comments/updates
CREATE TABLE complaint_comments (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,  -- Internal notes visible only to admin
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_complaints_apartment_id ON complaints(apartment_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_created_by ON complaints(created_by);
CREATE INDEX idx_complaint_comments_complaint_id ON complaint_comments(complaint_id);
```

#### 3.2 Resident Features
- [ ] "File Complaint" button on dashboard
- [ ] Complaint form with category selection
- [ ] Set priority level (low/medium/high/urgent)
- [ ] Add description (rich text or plain)
- [ ] Attach images (optional)
- [ ] View "My Complaints" list
- [ ] Track complaint status with timeline
- [ ] Add comments to existing complaints
- [ ] Filter complaints by status

#### 3.3 Admin Features
- [ ] View all complaints dashboard
- [ ] Filter by status, category, priority, apartment, tower
- [ ] Sort by date, priority, status
- [ ] Update complaint status
- [ ] Assign complaint to self or other admin
- [ ] Add resolution notes
- [ ] Add internal comments (not visible to resident)
- [ ] Dashboard widget showing open complaints count
- [ ] Bulk status update

#### 3.4 UI Components
- [ ] Complaint card component with status badge
- [ ] Status badge with colors (open=blue, in_progress=yellow, resolved=green, rejected=red)
- [ ] Category icons
- [ ] Priority indicators (urgent=red, high=orange, medium=yellow, low=gray)
- [ ] Comment thread component
- [ ] Complaint detail page/modal
- [ ] Status timeline component
- [ ] Image gallery for attachments

#### 3.5 Complaint Categories
```
- Plumbing (water leaks, drainage, pipes)
- Electrical (power issues, wiring, lights)
- Civil (structural, walls, floors, doors)
- Housekeeping (cleaning, garbage, common areas)
- Security (safety concerns, unauthorized access)
- Parking (vehicle issues, space disputes)
- Noise (disturbances, construction)
- Other (miscellaneous)
```

### API Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/complaints` | File new complaint | Resident |
| GET | `/api/complaints` | Get all complaints | Admin |
| GET | `/api/complaints/my` | Get my complaints | Resident |
| GET | `/api/complaints/:id` | Get complaint details | Owner, Admin |
| PATCH | `/api/complaints/:id` | Update complaint (status, assignment, notes) | Admin |
| POST | `/api/complaints/:id/comments` | Add comment | Owner, Admin |
| GET | `/api/complaints/:id/comments` | Get comments | Owner, Admin |
| GET | `/api/complaints/stats` | Get complaint statistics | Admin |

### Complaint Status Flow

```
                    +---> [REJECTED]
                    |
[OPEN] ---> [IN_PROGRESS] ---> [RESOLVED] ---> [CLOSED]
   |                               |
   +-------------------------------+
         (can reopen if needed)

Status Transitions:
- OPEN: Initial state when resident files complaint
- IN_PROGRESS: Admin acknowledges and starts working on it
- RESOLVED: Issue has been fixed, awaiting resident confirmation
- CLOSED: Resident confirms resolution OR auto-closed after 7 days
- REJECTED: Invalid complaint (with reason)
```

### New Pages

| Page | Route | Access | Description |
|------|-------|--------|-------------|
| File Complaint | `/complaints/new` | Resident | Create new complaint |
| My Complaints | `/complaints/my` | Resident | View my complaints |
| Complaint Detail | `/complaints/:id` | Owner, Admin | Full complaint view |
| All Complaints | `/admin/complaints` | Admin | Manage all complaints |

### Testing Checklist
- [ ] Resident can file a complaint
- [ ] Complaint requires apartment assignment (blocked otherwise)
- [ ] All required fields validated
- [ ] Image upload works (if implemented)
- [ ] Complaint appears in "My Complaints"
- [ ] Admin can see all complaints
- [ ] Admin can filter and sort complaints
- [ ] Admin can update status
- [ ] Admin can assign to self
- [ ] Admin can add resolution notes
- [ ] Comments can be added by both parties
- [ ] Internal comments only visible to admin
- [ ] Status transitions work correctly
- [ ] Email notification sent on status change (Phase 6)
- [ ] Dashboard shows complaint counts
- [ ] Priority affects sorting/display

### Completion Criteria
- Complete complaint lifecycle implemented
- Both resident and admin workflows tested
- All status transitions working
- Comments system functional
- Statistics accurate

---

## Phase 4: Enhanced Features

### Objective
Add quality-of-life improvements and additional features to enhance user experience.

### Duration: 3-4 days

### Prerequisites
- Phases 1-3 completed

### Tasks

#### 4.1 User Profile Management
- [ ] Profile page for all users
- [ ] Edit name, email (if not Google-linked)
- [ ] Add/edit phone number
- [ ] Change password (for local auth users)
- [ ] View/update profile picture
- [ ] View assigned apartment details
- [ ] Link/unlink Google account

#### 4.2 Vehicle Management
```sql
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    apartment_id INTEGER NOT NULL REFERENCES apartments(id),
    vehicle_type TEXT NOT NULL,  -- 'car', 'bike', 'scooter', 'other'
    vehicle_number TEXT NOT NULL UNIQUE,
    make_model TEXT,
    color TEXT,
    parking_slot TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    registered_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicles_apartment_id ON vehicles(apartment_id);
CREATE INDEX idx_vehicles_vehicle_number ON vehicles(vehicle_number);
```
- [ ] Add vehicles to apartment
- [ ] View registered vehicles
- [ ] Edit/delete vehicles
- [ ] Admin can manage all vehicles
- [ ] Link visitor vehicles to visitor entry
- [ ] Search by vehicle number

#### 4.3 Amenity Management (Admin)
- [ ] Create `POST /api/amenities` - Add new amenity
- [ ] Create `PATCH /api/amenities/:id` - Update amenity
- [ ] Create `DELETE /api/amenities/:id` - Delete amenity (soft delete if has bookings)
- [ ] Admin UI page for managing amenities
- [ ] Add amenity form (name, type, description, max capacity, image)
- [ ] Edit amenity inline or modal
- [ ] Deactivate amenity (hide from booking but keep history)

#### 4.4 Enhanced Amenity Booking
- [ ] Time slot selection (not just dates)
- [ ] View availability calendar
- [ ] Recurring bookings (weekly gym slot)
- [ ] Booking cancellation by user
- [ ] Cancellation policy (24 hours before)
- [ ] Waitlist for popular slots
- [ ] Booking reminders

#### 4.5 Notice Improvements
- [ ] Notice categories (Maintenance, Event, Emergency, General)
- [ ] Target specific towers/apartments
- [ ] Attach documents to notices (PDF)
- [ ] Mark notice as read
- [ ] Unread notice count in header
- [ ] Push notification for emergency notices

#### 4.6 Search & Filters
- [ ] Global search across entities
- [ ] Advanced filters on all list pages
- [ ] Save filter preferences
- [ ] Pagination for large lists
- [ ] Sort options on all tables

#### 4.7 UI/UX Improvements
- [ ] Dark mode toggle (persist preference)
- [ ] Loading skeletons everywhere
- [ ] Empty states for all lists
- [ ] Better error messages
- [ ] Confirmation dialogs for destructive actions
- [ ] Keyboard shortcuts (Cmd+K for search)
- [ ] Mobile-responsive improvements
- [ ] Touch-friendly interactions

### API Endpoints (New)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/profile` | Get current user profile | Authenticated |
| PATCH | `/api/profile` | Update profile | Authenticated |
| PATCH | `/api/profile/password` | Change password | Authenticated (local) |
| POST | `/api/vehicles` | Register vehicle | Resident |
| GET | `/api/vehicles` | Get all vehicles | Admin |
| GET | `/api/vehicles/my` | Get my apartment vehicles | Resident |
| PATCH | `/api/vehicles/:id` | Update vehicle | Owner, Admin |
| DELETE | `/api/vehicles/:id` | Delete vehicle | Owner, Admin |
| POST | `/api/amenities` | Create amenity | Admin |
| PATCH | `/api/amenities/:id` | Update amenity | Admin |
| DELETE | `/api/amenities/:id` | Delete/deactivate amenity | Admin |
| GET | `/api/search` | Global search | Authenticated |

### Testing Checklist
- [ ] Profile can be updated
- [ ] Password change works (local users)
- [ ] Google link/unlink works
- [ ] Vehicles can be added/edited/removed
- [ ] Vehicle search works
- [ ] Admin can create/edit/delete amenities
- [ ] Deactivated amenities don't show in booking
- [ ] Amenity time slots work
- [ ] Booking cancellation works
- [ ] Notice categories filter correctly
- [ ] Notice targeting works (specific towers)
- [ ] Dark mode persists across sessions
- [ ] Global search returns relevant results
- [ ] Pagination works correctly
- [ ] All empty states display correctly
- [ ] Mobile layout is usable

---

## Phase 5: Reports & Analytics

### Objective
Provide admin with insights through reports and analytics dashboards.

### Duration: 2-3 days

### Prerequisites
- Phases 1-4 completed (data exists to report on)

### Tasks

#### 5.1 Admin Dashboard Analytics
- [ ] Total residents count (with trend)
- [ ] Occupancy rate (occupied vs available apartments)
- [ ] Pending bookings count
- [ ] Open complaints count
- [ ] Visitors today/this week/this month
- [ ] Recent activity feed (last 10 actions)
- [ ] Quick stats cards with sparklines

#### 5.2 Visitor Reports
- [ ] Visitors by date range
- [ ] Visitors by purpose (pie chart)
- [ ] Visitors by apartment/tower
- [ ] Peak visiting hours (bar chart)
- [ ] Average visit duration
- [ ] Export to CSV/Excel
- [ ] Print-friendly report view

#### 5.3 Booking Reports
- [ ] Bookings by amenity (bar chart)
- [ ] Most booked time slots
- [ ] Approval rate percentage
- [ ] Cancellation rate
- [ ] Popular amenities ranking
- [ ] Booking trends over time

#### 5.4 Complaint Reports
- [ ] Complaints by category (pie chart)
- [ ] Average resolution time
- [ ] Complaints by status
- [ ] Complaints trend over time (line chart)
- [ ] Most common issues
- [ ] Resolution rate percentage
- [ ] Pending complaints aging report

#### 5.5 Occupancy Reports
- [ ] Apartments by status (occupied/rent/sale)
- [ ] Tower-wise occupancy breakdown
- [ ] Vacancy trend over time
- [ ] For rent/sale listings summary
- [ ] Resident count per apartment

#### 5.6 Report Features
- [ ] Date range picker for all reports
- [ ] Compare periods (this month vs last month)
- [ ] Export all reports to PDF
- [ ] Export data to Excel/CSV
- [ ] Scheduled report emails (Phase 6)

### API Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/reports/dashboard` | Dashboard statistics | Admin |
| GET | `/api/reports/visitors` | Visitor statistics | Admin |
| GET | `/api/reports/bookings` | Booking statistics | Admin |
| GET | `/api/reports/complaints` | Complaint statistics | Admin |
| GET | `/api/reports/occupancy` | Occupancy statistics | Admin |
| GET | `/api/reports/export/:type` | Export report as CSV/PDF | Admin |

### Charts Library
Use **Recharts** (already compatible with shadcn/ui):
- Line charts for trends
- Bar charts for comparisons
- Pie charts for distributions
- Area charts for cumulative data

### Testing Checklist
- [ ] Dashboard loads all statistics correctly
- [ ] Charts render without errors
- [ ] Date range filters work on all reports
- [ ] Export generates valid CSV
- [ ] Export generates valid PDF
- [ ] Reports show accurate data
- [ ] Empty state for no data scenarios
- [ ] Loading states for chart components
- [ ] Responsive charts on mobile

---

## Phase 6: Notifications & Communication

### Objective
Keep users informed through in-app and external notifications.

### Duration: 3-4 days

### Prerequisites
- All previous phases completed

### Tasks

#### 6.1 In-App Notifications
```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type TEXT NOT NULL,  -- 'booking', 'complaint', 'notice', 'visitor', 'system'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,  -- URL to navigate to
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```
- [ ] Notification bell icon in header
- [ ] Unread count badge (red dot with number)
- [ ] Notification dropdown panel
- [ ] Mark individual as read
- [ ] Mark all as read
- [ ] Clear all notifications
- [ ] Notification preferences page
- [ ] Sound for new notifications (optional)

#### 6.2 Notification Triggers
| Event | Notify | Message |
|-------|--------|---------|
| Booking approved | Resident | "Your booking for {amenity} has been approved" |
| Booking rejected | Resident | "Your booking for {amenity} has been rejected" |
| New complaint | Admin(s) | "New complaint from {apartment}: {title}" |
| Complaint status update | Resident | "Your complaint status changed to {status}" |
| Complaint comment | Resident/Admin | "New comment on complaint: {title}" |
| Visitor arrived | Resident | "Visitor {name} has arrived at gate" |
| Pre-approval used | Resident | "Your pre-approved visitor {name} has checked in" |
| Pre-approval expiring | Resident | "Pre-approval for {name} expires today" |
| New notice | All Residents | "New notice: {title}" |
| Emergency notice | All Users | "EMERGENCY: {title}" |

#### 6.3 Email Notifications
- [ ] Set up email service (Nodemailer + Gmail/SendGrid)
- [ ] Email templates for each notification type
- [ ] HTML email templates with branding
- [ ] Email preferences per user (on/off per type)
- [ ] Daily digest option (summary of all notifications)
- [ ] Unsubscribe link in emails

#### 6.4 Environment Variables for Email
```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Society Management <noreply@society.com>"
```

#### 6.5 Notification Preferences UI
```
Notification Settings
+----------------------------------------+
| Notification Type    | In-App | Email  |
+----------------------------------------+
| Booking Updates      |  [x]   |  [x]   |
| Complaint Updates    |  [x]   |  [x]   |
| Visitor Arrivals     |  [x]   |  [ ]   |
| New Notices          |  [x]   |  [x]   |
| Emergency Alerts     |  [x]   |  [x]   |
+----------------------------------------+
| Email Digest: [ ] Daily at 9:00 AM     |
+----------------------------------------+
```

#### 6.6 Data Retention & Cleanup
- [ ] Create scheduled cleanup job (daily cron)
- [ ] Delete notifications older than 90 days
- [ ] Delete expired password reset tokens
- [ ] Archive visitor logs older than 1 year (move to archive table or export)
- [ ] Clean up cancelled pre-approvals older than 30 days
- [ ] Auto-close resolved complaints after 7 days of inactivity
- [ ] Configuration for retention periods (environment variables)

```sql
-- Example: Notifications cleanup
DELETE FROM notifications
WHERE created_at < NOW() - INTERVAL '90 days';

-- Example: Password reset tokens cleanup
DELETE FROM password_reset_tokens
WHERE expires_at < NOW() - INTERVAL '7 days';

-- Example: Old pre-approvals cleanup
DELETE FROM pre_approved_visitors
WHERE status IN ('expired', 'cancelled')
AND created_at < NOW() - INTERVAL '30 days';
```

#### 6.7 Real-time Updates (Optional/Advanced)
- [ ] WebSocket integration (Socket.io)
- [ ] Live notification delivery
- [ ] Real-time visitor entry alerts
- [ ] Live booking status updates
- [ ] Online user presence

### API Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/notifications` | Get user notifications | Authenticated |
| GET | `/api/notifications/unread-count` | Get unread count | Authenticated |
| PATCH | `/api/notifications/:id/read` | Mark as read | Authenticated |
| PATCH | `/api/notifications/read-all` | Mark all as read | Authenticated |
| DELETE | `/api/notifications/:id` | Delete notification | Authenticated |
| GET | `/api/notifications/preferences` | Get preferences | Authenticated |
| PATCH | `/api/notifications/preferences` | Update preferences | Authenticated |

### Testing Checklist
- [ ] Notifications created on all trigger events
- [ ] Notification bell shows correct unread count
- [ ] Notification dropdown displays correctly
- [ ] Mark as read works (individual and all)
- [ ] Notification links navigate correctly
- [ ] Email delivery works
- [ ] Email templates render correctly
- [ ] Unsubscribe link works
- [ ] Preferences are respected
- [ ] Daily digest sends correctly (if enabled)
- [ ] WebSocket connection stable (if implemented)
- [ ] Real-time notifications work (if implemented)
- [ ] Data cleanup job runs without errors
- [ ] Old notifications properly deleted
- [ ] Retention periods configurable

---

## Database Schema Evolution

### Summary of All Schema Changes

#### Phase 1A (Google Auth + Password Reset)
```sql
-- Google OAuth fields
ALTER TABLE users ADD COLUMN email TEXT UNIQUE;
ALTER TABLE users ADD COLUMN google_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN profile_picture TEXT;
ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'local';
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
```

#### Phase 1B (User-Apartment)
```sql
CREATE INDEX idx_users_apartment_id ON users(apartment_id);
```

#### Phase 2 (Security)
```sql
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'resident';
UPDATE users SET role = 'admin' WHERE is_admin = true;
UPDATE users SET role = 'resident' WHERE is_admin = false;
ALTER TABLE users DROP COLUMN is_admin;

CREATE TABLE visitors (...);
CREATE TABLE pre_approved_visitors (...);
```

#### Phase 3 (Complaints)
```sql
CREATE TABLE complaints (...);
CREATE TABLE complaint_comments (...);
```

#### Phase 4 (Enhanced)
```sql
CREATE TABLE vehicles (...);
ALTER TABLE notices ADD COLUMN category TEXT DEFAULT 'general';
ALTER TABLE notices ADD COLUMN target_towers INTEGER[];
ALTER TABLE users ADD COLUMN phone TEXT;

-- Amenity management
ALTER TABLE amenities ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE amenities ADD COLUMN image_url TEXT;
ALTER TABLE amenities ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE amenities ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
```

#### Phase 6 (Notifications)
```sql
CREATE TABLE notifications (...);
CREATE TABLE notification_preferences (...);
```

---

## API Endpoints Reference

### Complete Endpoint List

#### Authentication
| Method | Endpoint | Description | Phase |
|--------|----------|-------------|-------|
| POST | `/api/register` | Register new user | Existing |
| POST | `/api/login` | Login with credentials | Existing |
| POST | `/api/logout` | Logout | Existing |
| GET | `/api/user` | Get current user | Existing |
| GET | `/api/auth/google` | Start Google OAuth | 1A |
| GET | `/api/auth/google/callback` | Google OAuth callback | 1A |
| POST | `/api/auth/link-google` | Link Google account | 1A |
| POST | `/api/auth/forgot-password` | Send reset email | 1A |
| POST | `/api/auth/reset-password` | Reset password with token | 1A |

#### Users
| Method | Endpoint | Description | Phase |
|--------|----------|-------------|-------|
| GET | `/api/users` | List all users | Existing |
| PATCH | `/api/users/:id` | Update user role | Existing |
| PATCH | `/api/users/:id/apartment` | Assign apartment | 1B |
| DELETE | `/api/users/:id/apartment` | Remove apartment | 1B |
| DELETE | `/api/users/:id` | Delete user | Existing |
| GET | `/api/users/unassigned` | Users without apartment | 1B |

#### Profile
| Method | Endpoint | Description | Phase |
|--------|----------|-------------|-------|
| GET | `/api/profile` | Get profile | 4 |
| PATCH | `/api/profile` | Update profile | 4 |
| PATCH | `/api/profile/password` | Change password | 4 |

#### Properties
| Method | Endpoint | Description | Phase |
|--------|----------|-------------|-------|
| GET | `/api/towers` | List towers | Existing |
| POST | `/api/towers` | Create tower | Existing |
| PATCH | `/api/towers/:id` | Update tower | Existing |
| DELETE | `/api/towers/:id` | Delete tower | Existing |
| GET | `/api/apartments` | List apartments | Existing |
| POST | `/api/apartments` | Create apartment | Existing |
| PATCH | `/api/apartments/:id` | Update apartment | Existing |
| DELETE | `/api/apartments/:id` | Delete apartment | Existing |
| GET | `/api/apartments/:id/residents` | Get apartment residents | 1B |

#### Amenities & Bookings
| Method | Endpoint | Description | Phase |
|--------|----------|-------------|-------|
| GET | `/api/amenities` | List amenities | Existing |
| POST | `/api/bookings` | Create booking | Existing |
| GET | `/api/bookings/user` | My bookings | Existing |
| GET | `/api/bookings` | All bookings | Existing |
| PATCH | `/api/bookings/:id/status` | Update status | Existing |
| DELETE | `/api/bookings/:id` | Cancel booking | 4 |

#### Notices
| Method | Endpoint | Description | Phase |
|--------|----------|-------------|-------|
| GET | `/api/notices` | List notices | Existing |
| POST | `/api/notices` | Create notice | Existing |
| DELETE | `/api/notices/:id` | Delete notice | Existing |

#### Visitors (Phase 2)
| Method | Endpoint | Description | Phase |
|--------|----------|-------------|-------|
| POST | `/api/visitors` | Log visitor entry | 2 |
| GET | `/api/visitors` | List visitors | 2 |
| GET | `/api/visitors/today` | Today's visitors | 2 |
| GET | `/api/visitors/inside` | Currently inside | 2 |
| PATCH | `/api/visitors/:id/checkout` | Mark exit | 2 |
| POST | `/api/pre-approved` | Create pre-approval | 2 |
| GET | `/api/pre-approved` | List pre-approved | 2 |
| GET | `/api/pre-approved/my` | My pre-approvals | 2 |
| PATCH | `/api/pre-approved/:id/status` | Update status | 2 |

#### Complaints (Phase 3)
| Method | Endpoint | Description | Phase |
|--------|----------|-------------|-------|
| POST | `/api/complaints` | File complaint | 3 |
| GET | `/api/complaints` | All complaints | 3 |
| GET | `/api/complaints/my` | My complaints | 3 |
| GET | `/api/complaints/:id` | Complaint details | 3 |
| PATCH | `/api/complaints/:id` | Update complaint | 3 |
| POST | `/api/complaints/:id/comments` | Add comment | 3 |

#### Vehicles (Phase 4)
| Method | Endpoint | Description | Phase |
|--------|----------|-------------|-------|
| POST | `/api/vehicles` | Register vehicle | 4 |
| GET | `/api/vehicles` | All vehicles | 4 |
| GET | `/api/vehicles/my` | My vehicles | 4 |
| PATCH | `/api/vehicles/:id` | Update vehicle | 4 |
| DELETE | `/api/vehicles/:id` | Delete vehicle | 4 |

#### Reports (Phase 5)
| Method | Endpoint | Description | Phase |
|--------|----------|-------------|-------|
| GET | `/api/reports/dashboard` | Dashboard stats | 5 |
| GET | `/api/reports/visitors` | Visitor stats | 5 |
| GET | `/api/reports/bookings` | Booking stats | 5 |
| GET | `/api/reports/complaints` | Complaint stats | 5 |
| GET | `/api/reports/occupancy` | Occupancy stats | 5 |
| GET | `/api/reports/export/:type` | Export report | 5 |

#### Notifications (Phase 6)
| Method | Endpoint | Description | Phase |
|--------|----------|-------------|-------|
| GET | `/api/notifications` | My notifications | 6 |
| PATCH | `/api/notifications/:id/read` | Mark read | 6 |
| PATCH | `/api/notifications/read-all` | Mark all read | 6 |
| GET | `/api/notifications/preferences` | Get prefs | 6 |
| PATCH | `/api/notifications/preferences` | Update prefs | 6 |

---

## Testing Checklist

### Manual Testing Per Phase
Each phase should be manually tested with these scenarios:

1. **Happy Path:** Normal user flow works
2. **Edge Cases:** Empty states, max limits, special characters
3. **Error Handling:** Invalid inputs, network errors, server errors
4. **Authorization:** Correct access restrictions per role
5. **Mobile:** Responsive design works on phone/tablet
6. **Cross-browser:** Chrome, Firefox, Safari, Edge

### Test Users
Create these test accounts for each environment:
- `admin` / `admin123` - Administrator
- `resident1` / `password123` - Resident with apartment
- `resident2` / `password123` - Resident without apartment
- `guard1` / `password123` - Security guard (Phase 2+)
- Google test account - For OAuth testing

### Automated Testing (Future)
- Unit tests for utility functions
- Integration tests for API endpoints
- E2E tests for critical user flows

---

## Deployment Considerations

### Environment Variables (Complete)
```env
# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Session
SESSION_SECRET=your_very_secure_random_secret_at_least_32_chars

# Google OAuth (Phase 1A)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback

# Email (Phase 6)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Society Management <noreply@society.com>"

# App
NODE_ENV=production
CLIENT_URL=https://yourdomain.com
```

### Pre-Deployment Checklist
- [ ] All migrations applied to production DB
- [ ] Environment variables configured in hosting platform
- [ ] Session secret is unique and secure (not shared with dev)
- [ ] Google OAuth callback URL updated for production
- [ ] CORS configured for production domain
- [ ] HTTPS enforced
- [ ] Error logging configured (Sentry, LogRocket, etc.)
- [ ] Database backups enabled
- [ ] Rate limiting configured
- [ ] Security headers set (helmet.js)

### Post-Deployment
- [ ] Smoke test all major features
- [ ] Verify admin account works
- [ ] Test Google OAuth flow
- [ ] Check session persistence
- [ ] Monitor error logs for 24 hours
- [ ] Test on actual mobile devices
- [ ] Verify email delivery
- [ ] Check database connections stable

---

## Progress Tracker

### Overall Progress
| Phase | Status | Started | Completed | Notes |
|-------|--------|---------|-----------|-------|
| Phase 1A | ✅ Completed | Dec 2024 | Dec 2024 | Google Auth |
| Phase 1B | ✅ Completed | Dec 2024 | Dec 2024 | User-Apartment |
| Phase 2 | ✅ Completed | Dec 2024 | Dec 2024 | Security Module |
| Phase 3 | ✅ Completed | Dec 2024 | Dec 2024 | Complaints |
| Phase 4 | Not Started | - | - | Enhanced Features |
| Phase 5 | Not Started | - | - | Reports |
| Phase 6 | Not Started | - | - | Notifications |

### Current Focus
**Phase:** Phase 4 (Enhanced Features) - Ready to Start
**Task:** User Profile Management, Vehicle Management, Amenity Management
**Blockers:** None

### Milestones
- [x] **MVP Complete** (Phase 1A + 1B + 2) - Core functionality ✅
- [ ] **Beta Release** (Phase 1-4) - Feature complete
- [ ] **Production Ready** (Phase 1-6) - Full system

---

## Notes & Decisions

### Architecture Decisions
1. **Role System:** Using string `role` field ('admin', 'resident', 'guard') instead of boolean `isAdmin` for flexibility
2. **Apartment Linking:** Many users to one apartment (family members scenario)
3. **Auth Provider:** Support both local (username/password) and Google OAuth
4. **Session Storage:** PostgreSQL for persistence across server restarts
5. **Notifications:** In-app first, email as enhancement

### Deletion Strategy by Entity
| Entity | Strategy | Reason |
|--------|----------|--------|
| Users | Hard delete | Cascade to bookings, complaints, etc. |
| Bookings | Soft delete (`deletedAt`) | Keep history for reports |
| Visitors | Never delete | Audit trail for security |
| Pre-approved Visitors | Hard delete after 30 days (if expired/cancelled) | Not needed long-term |
| Complaints | Soft delete | Keep for records and reports |
| Notices | Soft delete (`isArchived`) | Keep for audit trail and reference |
| Notifications | Hard delete after 90 days | Keep recent, clean old |
| Vehicles | Hard delete | Can be re-added if needed |
| Password Reset Tokens | Hard delete after 7 days | Security best practice |
| Amenities | Soft delete (`isActive`) | Keep for booking history |

### Security Considerations
1. Passwords hashed with scrypt (not bcrypt for consistency)
2. Sessions stored in database, not memory
3. CSRF protection on forms
4. Rate limiting on auth endpoints
5. Input validation on all endpoints
6. SQL injection prevention via Drizzle ORM
7. XSS prevention via React's default escaping

### Future Considerations
- Mobile app (React Native)
- Payment gateway integration
- Biometric visitor verification
- CCTV integration
- Intercom system integration
- Multi-society support (SaaS model)
- Accounting/billing module

---

## Changelog

### Version 1.0 (Current)
- Initial application with basic features
- Towers, Apartments, Amenities, Bookings, Notices
- Admin and Resident roles
- Local authentication only

### Version 2.0 (After Phase 1A-2)
- Google OAuth integration
- User-Apartment linking
- Guard role
- Security module with visitor management
- Pre-approved visitors

### Version 3.0 (After Phase 3-4)
- Complaints system
- User profile management
- Vehicle management
- Enhanced amenity booking
- UI/UX improvements

### Version 4.0 (After Phase 5-6)
- Reports and analytics dashboard
- In-app notifications
- Email notifications
- Real-time updates (optional)

---

*Last Updated: December 2024*
*Document Version: 2.1*

---

## Appendix: Quick Reference

### All New Tables Summary
| Table | Phase | Purpose |
|-------|-------|---------|
| `password_reset_tokens` | 1A | Store password reset tokens |
| `visitors` | 2 | Visitor entry/exit logs |
| `pre_approved_visitors` | 2 | Pre-approved visitor requests |
| `complaints` | 3 | Resident complaints |
| `complaint_comments` | 3 | Comments on complaints |
| `vehicles` | 4 | Registered vehicles |
| `notifications` | 6 | In-app notifications |
| `notification_preferences` | 6 | User notification settings |

### Role Permissions Matrix
| Feature | Admin | Resident | Guard |
|---------|-------|----------|-------|
| View Dashboard | Own | Own | Guard Dashboard |
| Manage Users | Yes | No | No |
| Manage Properties | Yes | No | No |
| Assign Apartments | Yes | No | No |
| Book Amenities | Yes | Yes | No |
| Approve Bookings | Yes | No | No |
| Manage Amenities | Yes | No | No |
| Create Notices | Yes | No | No |
| File Complaints | Yes | Yes | No |
| Manage Complaints | Yes | No | No |
| Pre-approve Visitors | Yes | Yes | No |
| Log Visitor Entry | Yes | No | Yes |
| Checkout Visitors | Yes | No | Yes |
| View Visitor Logs | Yes | Own Apt | Yes |
| View Reports | Yes | No | No |
| Manage Vehicles | Yes | Own Apt | No |
