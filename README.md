# TriPro ECM — Enterprise Compliance Management SaaS

A production-ready, lightweight, multi-tenant **Enterprise Compliance Management (ECM)** SaaS platform designed specifically for growing small businesses (10–49 employees), focusing first on Bangladesh statutory requirements followed by USA and international markets.

---

## 1. Product Vision & Philosophy

**Core Operational Workflow:**
$$\text{Know} \longrightarrow \text{Assign} \longrightarrow \text{Monitor} \longrightarrow \text{Verify} \longrightarrow \text{Improve}$$

TriPro ECM eliminates bloated enterprise GRC spreadsheets and replaces them with an actionable operations platform:
- **Know:** Preloaded statutory compliance obligations (e.g., Bangladesh Labour Act 2006, National Cyber Security Act, BIDA/RJSC filings, ISO/IEC 27001:2022, SOC 2 Type II).
- **Assign:** Internal owners with recurrence schedules, deadlines, and granular permission boundaries.
- **Monitor:** Real-time due date alerts, overdue task escalation, vendor contract expirations, and missing evidence notifications.
- **Verify:** Private, access-controlled evidence document locker with tamper-evident audit trails.
- **Improve:** Systematic audit findings and Corrective & Preventive Action (CAPA) tracking with authorized sign-off.

---

## 2. Architecture & Tech Stack

```
                        ┌────────────────────────────────────────┐
                        │          React 18 + Vite (Client)      │
                        │  Tailwind CSS · TanStack Query · Zod   │
                        │      Recharts · Lucide · Firebase      │
                        └───────────────────┬────────────────────┘
                                            │ Bearer ID Token
                                            ▼
                        ┌────────────────────────────────────────┐
                        │         Express 4.x API Gateway        │
                        │  Helmet · CORS Allowlist · Rate Limits │
                        │  Firebase Admin SDK Token Verification │
                        └───────┬───────────┬────────────┬───────┘
                                │           │            │
            ┌───────────────────┘           │            └──────────────────┐
            ▼                               ▼                               ▼
┌───────────────────────┐       ┌───────────────────────┐       ┌───────────────────────┐
│     MongoDB Atlas     │       │    NodeCache Layer    │       │   BullMQ Background   │
│ Multi-Tenant Isolation│       │ Tenant-Scoped In-Mem  │       │ Redis Worker / Cron   │
│   Compound Indexes    │       │  Write Invalidation   │       │ Deadlines & Expiries  │
└───────────────────────┘       └───────────────────────┘       └───────────────────────┘
```

### Frontend (`client/`)
- **Framework:** React 18 with Vite and TypeScript
- **Styling & Design System:** Tailwind CSS with custom brand palette:
  - Primary Brand Color: `#790D16` (Deep Burgundy)
  - Main Body Canvas: `#E5D3AF` (Warm Sand)
  - Contrast Surfaces: `#FFFFFF`, `#FAF7F0` (Cream/Off-white)
- **Data Fetching & Cache:** TanStack Query v5 with automatic request lifecycle management
- **Forms & Validation:** React Hook Form + Zod
- **Analytics:** Recharts responsive charts
- **Identity:** Firebase Authentication + 1-Click Multi-Role Persona Switcher

### Backend (`server/`)
- **Runtime:** Node.js with Express & TypeScript
- **Database:** MongoDB Atlas with Mongoose
- **Identity & Authorization:** Firebase Admin SDK + Centralized RBAC (7 roles: `super-admin`, `organization-admin`, `compliance-manager`, `hr-manager`, `vendor-manager`, `employee`, `auditor`)
- **Tenant Isolation:** Centralized `requireTenantContext` middleware enforcing organization boundaries on every query
- **Caching:** Scoped, bounded `NodeCache` with automatic write invalidation (`CacheKeys.dashboardSummary(orgId)`)
- **Background Jobs:** BullMQ with Redis + automatic in-memory timer fallback
- **Security:** Helmet, CORS origin allowlist, Express Rate Limiter, Zod payload validation, sanitized error handler
- **Logging:** Structured Pino logger with automatic credential & token redaction

---

## 3. Directory Structure

```
TriPro/
├── package.json                 # Unified workspace scripts
├── README.md                    # System documentation
├── server/
│   ├── .env.example             # Server environment template
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── app.ts               # Express configuration, Helmet, CORS, routes
│   │   ├── server.ts            # HTTP server startup & graceful shutdown
│   │   ├── config/              # MongoDB, Firebase Admin, Redis, Storage
│   │   ├── constants/           # Roles & Granular Permissions
│   │   ├── middleware/          # Auth, RBAC, Tenant isolation, Validation, Rate limiter
│   │   ├── models/              # Mongoose schemas with compound indexes
│   │   ├── cache/               # NodeCache tenant key builder & invalidator
│   │   ├── queues/              # BullMQ background job dispatcher
│   │   ├── workers/             # Expiry & overdue check background worker
│   │   ├── controllers/         # Compliance, Tasks, Evidence, HR, TPRM, Risks, CAPA
│   │   ├── routes/v1/           # Modular Express router endpoints
│   │   ├── scripts/             # Super-Admin CLI bootstrap & realistic seed script
│   │   └── __tests__/           # Jest unit & integration test suite
└── client/
    ├── .env.example             # Client environment template
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── App.tsx              # Router & ProtectedRoute config
        ├── context/             # AuthContext (with Demo Switcher) & ToastContext
        ├── services/            # Axios client with Bearer token interceptor
        ├── components/          # Layout (Sidebar, Navbar), Modals, Drawers, Cards
        └── pages/               # Landing, Login, Dashboard, Compliance, TPRM, etc.
```

---

## 4. Getting Started

### Prerequisites
- **Node.js** >= 18.0.0 (`v24.14.0` verified)
- **MongoDB** (Local instance `mongodb://127.0.0.1:27017` or MongoDB Atlas URI)
- **Redis** (Optional — BullMQ automatically falls back to an in-memory scheduler if absent)

### Installation
From the root workspace:

```bash
# Install backend dependencies
cd server
npm.cmd install

# Install frontend dependencies
cd ../client
npm.cmd install
```

---

## 5. Environment Configuration

### Backend (`server/.env`)
Copy `server/.env.example` to `server/.env`:

```env
NODE_ENV=development
PORT=5000

# MongoDB Connection URI (Replace with your Atlas or local connection string)
MONGODB_URI=mongodb://127.0.0.1:27017/tripro_ecm

# Allowed Client Origin for CORS
CLIENT_ORIGIN=http://localhost:5173

# Firebase Admin SDK Configuration (Optional in local development mode)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Optional Redis connection for BullMQ asynchronous workers
REDIS_URL=

# Super-Admin One-Time Bootstrap Secret
BOOTSTRAP_SECRET=tripro_secure_bootstrap_key_change_in_production

# Evidence Document Storage Provider ('local' | 's3' | 'gcs')
DOCUMENT_STORAGE_PROVIDER=local
DOCUMENT_STORAGE_PATH=./uploads

# Cache TTL in seconds for short-lived NodeCache
CACHE_TTL_SECONDS=300
```

### Frontend (`client/.env`)
Copy `client/.env.example` to `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=tripro-ecm.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tripro-ecm
VITE_FIREBASE_STORAGE_BUCKET=tripro-ecm.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
```

---

## 6. Secure Super-Admin Bootstrap CLI

In strict adherence to SaaS security best practices:
- **No Initial Admin Created Automatically:** The database initializes without any default super-admin account to eliminate backdoor risks.
- **Unprivileged Public Signup:** Public registration and ordinary login via Firebase Authentication default exclusively to the unprivileged `role: "employee"`.
- **API Role Isolation:** Organization member management APIs explicitly forbid assigning or elevating anyone to `role: "super-admin"`.

### Step-by-Step Super-Admin Setup:

#### 1. Configure Server Environment
Ensure `server/.env` contains your `MONGODB_URI` and your Firebase credentials (either via environment variables or a service account JSON file):

```env
MONGODB_URI=mongodb://127.0.0.1:27017/tripro_ecm

# Option A: Environment variables
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Option B: Or path to downloaded service account JSON file
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
```

*(Note: In local development, if Firebase credentials are not yet configured, the CLI safely operates in development simulated verification mode).*

#### 2. Sign Up via Firebase Authentication
Create your account through the TriPro client web app signup screen (`http://localhost:5173/signup`) or directly in the [Firebase Console](https://console.firebase.google.com/) under **Authentication > Users**. Copy your **Firebase User UID** (e.g. `a1B2c3D4e5F6g7H8...`).

#### 3. Execute the Server Bootstrap Command
Run the bootstrap command from the workspace root (or inside `server/`):

```bash
npm run admin:bootstrap -- --uid=YOUR_FIREBASE_UID
```

#### What This Command Does:
1. **Verifies Firebase UID:** Uses Firebase Admin SDK to ensure the UID is valid and retrieves verified account details.
2. **Connects to MongoDB:** Safely connects using `MONGODB_URI` from `server/.env`.
3. **Single Super-Admin Safeguard:** Validates that no super-admin already exists in the database. If a super-admin exists, the command rejects further elevation to prevent unauthorized takeovers.
4. **Prevents Duplicates:** Looks up existing user records by Firebase UID and normalized email, updating the existing record rather than creating duplicate accounts.
5. **Assigns Super-Admin Privileges:** Safely provisions or updates the user document with `role: "super-admin"` and `status: "active"`.
6. **Graceful Connection Teardown:** Cleanly closes MongoDB connections upon completion or failure.

#### Recovery / Re-assignment Procedure:
If you need to reassign or recover the super-admin account when an existing super-admin is already present in MongoDB, pass the explicit `--recovery` flag:

```bash
npm run admin:bootstrap -- --uid=YOUR_FIREBASE_UID --recovery
```

---

## 7. Database Seeding

To populate realistic enterprise compliance data (Bangladesh Labour Act 2006, Cyber Security Act, BIDA/RJSC, ISO 27001, vendors, risk matrix, CAPA, audit history):

```bash
cd server
npm run seed
```

**Pre-seeded Demo Personas:**
- **Org Admin / CEO:** `orgadmin@apexdigital.com.bd`
- **Compliance Lead:** `compliance@apexdigital.com.bd`
- **HR Coordinator:** `hr@apexdigital.com.bd`
- **Vendor Manager:** `vendor@apexdigital.com.bd`
- **Lead Auditor (Read-Only):** `auditor@globalcompliance.io`
- **Employee:** `rahim.chowdhury@apexdigital.com.bd`
- **Super-Admin:** `superadmin@tripro.local`

---

## 8. Running the Application

### Development Mode

**Terminal 1 — Backend Server:**
```bash
cd server
npm run dev
# Starts API server on http://localhost:5000
# Liveness Health check: http://localhost:5000/health
```

**Terminal 2 — Frontend Client:**
```bash
cd client
npm run dev
# Starts Vite dev server on http://localhost:5173
```

Navigate to **`http://localhost:5173`** to access the application.

---

## 9. Automated Testing & Verification

Run the automated backend test suite (testing RBAC enforcement, Zod validation bounds, tenant isolation, and NodeCache invalidation):

```bash
cd server
npm test
```

**Test Results:**
- `rbac.test.ts` (Super-admin permissions, Auditor read-only boundaries, Employee least-privilege) — **PASS**
- `validation.test.ts` (Obligation, Task, Vendor, and 5x5 Risk matrix schema bounds) — **PASS**
- `cache.test.ts` (Tenant-scoped cache keys, targeted tenant invalidation) — **PASS**

**Production Build Verification:**
```bash
cd client
npm run build
# Compiles TypeScript and creates optimized Vite production bundle
```

---

## 10. Compliance Features Implemented

1. **Compliance Register:** Lifecycle states (`not_started`, `in_progress`, `pending_review`, `compliant`, `non_compliant`, `needs_attention`), framework filters, slide-out drawer with history log.
2. **Tasks & Deadlines:** Assignees, priority badges, overdue filters, comment activity logs.
3. **Evidence Locker:** Secure file upload with MIME/size limits, access-controlled download, expiry warnings.
4. **HR Statutory Compliance:** Bangladesh Labour Act 2006 statutory requirements (Sec 5 appointment letter, Sec 6 service book), safety briefings, training logs.
5. **Vendor Registry & Basic TPRM:** 0-100 risk score, risk classification (Low, Medium, High, Critical), contract expiry tracking, security due diligence checklist.
6. **Risk Register:** Interactive 5x5 Likelihood × Impact heat map visualizer, automated risk score calculation (1-25).
7. **Findings & Corrective Actions (CAPA):** Audit deficiency tracking, corrective action plans, authorized verification sign-off.
8. **Policy Management:** Versioning, content view, formal employee acknowledgment tracking.
9. **Notification Center:** Real-time in-app alerts for overdue tasks, document expirations, and assignments.
10. **Reports & Analytics:** Recharts analytics, aggregated compliance health score, one-click CSV export.
11. **Platform Administration:** Multi-tenant organization provisioning and global audit trails.
"# TriPro" 
