# CampusWash 👕

CampusWash is a college-only clothes sharing, request, and lost-and-found platform built specifically for **Chennai Institute of Technology (CIT Chennai)** students. It enables a circular, collaborative ecosystem inside the campus for lending clothes, posting requests, tracking lost/found items, and managing moderation.

---

## 🚀 Core Modules

1. **Borrow & Lend Board**
   - Post clothes you want to lend (shirts, trousers, blazers, sarees, kurtas, etc.).
   - Request to borrow clothes for a specific timeframe (within owner's limit).
   - Track overlapping requests and approve/reject/return items seamlessly.
   
2. **Item Request Board**
   - Post "I need X clothing item" requests.
   - Others can respond if they have the item and want to help out.
   - Mark requests as fulfilled once resolved.

3. **Lost & Found**
   - Report lost clothes or found items with location details, date, and image upload.
   - Browse listings and claim items.

4. **Feedback System**
   - Submit interactive 1-5 star ratings and suggestions directly from any page header.

5. **Moderation Desk**
   - Review reported items, listings, and requests.
   - Manage user roles (Student, Moderator, Admin).

---

## 🛠️ Tech Stack

| Layer | Technology | Hosting |
|---|---|---|
| **Frontend** | React (Vite) + Tailwind CSS + Lucide Icons | Vercel |
| **Backend** | FastAPI (Python 3.11) + Pydantic v2 | Render |
| **Auth** | Clerk Authentication (Google Sign-In) | Clerk |
| **Database** | Supabase (PostgreSQL) + PostgREST | Supabase |
| **File Storage** | Supabase Storage Buckets | Supabase |

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```ini
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
JWT_SECRET=your-jwt-auth-secret
CLERK_SECRET_KEY=your-clerk-secret-key
CLERK_PEM_PUBLIC_KEY=your-clerk-pem-public-key
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```ini
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
```

---

## 🗄️ Database Setup (Supabase SQL)

Run the following SQL in your Supabase SQL Editor to initialize the database tables, indices, and RLS policies:

```sql
create extension if not exists "uuid-ossp";

-- USERS Table
create table users (
  id               uuid primary key default uuid_generate_v4(),
  firebase_uid     text unique not null, -- Stores Clerk User ID
  email            text unique not null,
  name             text,
  register_number  text unique,
  department       text,
  batch_year       text,
  phone            text,
  profile_complete boolean not null default false,
  role             text not null default 'student' check (role in ('student', 'moderator', 'admin')),
  created_at       timestamptz not null default now()
);
create index idx_users_firebase on users(firebase_uid);
create index idx_users_email on users(email);

-- LEND LISTINGS Table
create table lend_listings (
  id              uuid primary key default uuid_generate_v4(),
  owner_id        uuid not null references users(id) on delete cascade,
  title           text not null,
  description     text,
  item_type       text not null check (item_type in ('shirt','trouser','blazer','saree','kurta','towel','other')),
  size            text,
  color           text,
  image_url       text,
  max_borrow_days integer not null default 3,
  status          text not null default 'available' check (status in ('available','borrowed','unavailable')),
  created_at      timestamptz not null default now()
);
create index idx_lend_owner on lend_listings(owner_id);
create index idx_lend_status on lend_listings(status);

-- BORROW REQUESTS Table
create table borrow_requests (
  id           uuid primary key default uuid_generate_v4(),
  listing_id   uuid not null references lend_listings(id) on delete cascade,
  borrower_id  uuid not null references users(id) on delete cascade,
  reason       text,
  borrow_from  date not null,
  borrow_until date not null,
  status       text not null default 'pending' check (status in ('pending','approved','rejected','returned','overdue')),
  created_at   timestamptz not null default now()
);
create index idx_borrow_listing on borrow_requests(listing_id);
create index idx_borrow_borrower on borrow_requests(borrower_id);
create index idx_borrow_status on borrow_requests(status);

-- ITEM REQUESTS Table
create table item_requests (
  id           uuid primary key default uuid_generate_v4(),
  requester_id uuid not null references users(id) on delete cascade,
  title        text not null,
  description  text,
  item_type    text not null check (item_type in ('shirt','trouser','blazer','saree','kurta','towel','shoes','other')),
  size         text,
  color        text,
  needed_by    date,
  status       text not null default 'open' check (status in ('open','fulfilled','expired')),
  expires_at   timestamptz not null default (now() + interval '7 days'),
  created_at   timestamptz not null default now()
);
create index idx_requests_requester on item_requests(requester_id);
create index idx_requests_status on item_requests(status);

-- REQUEST RESPONSES Table
create table request_responses (
  id           uuid primary key default uuid_generate_v4(),
  request_id   uuid not null references item_requests(id) on delete cascade,
  responder_id uuid not null references users(id) on delete cascade,
  message      text not null,
  created_at   timestamptz not null default now(),
  unique (request_id, responder_id)
);
create index idx_responses_request on request_responses(request_id);

-- LOST ITEMS Table
create table lost_items (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references users(id) on delete cascade,
  title         text not null,
  description   text,
  item_type     text not null check (item_type in ('shirt','trouser','towel','bedsheet','blazer','other')),
  color         text,
  location_lost text,
  date_lost     date,
  image_url     text,
  status        text not null default 'open' check (status in ('open','closed')),
  created_at    timestamptz not null default now()
);
create index idx_lost_user on lost_items(user_id);
create index idx_lost_status on lost_items(status);

-- FOUND ITEMS Table
create table found_items (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references users(id) on delete cascade,
  title          text not null,
  description    text,
  item_type      text not null check (item_type in ('shirt','trouser','towel','bedsheet','blazer','other')),
  color          text,
  location_found text,
  date_found     date,
  image_url      text,
  status         text not null default 'unclaimed' check (status in ('unclaimed','claimed')),
  created_at     timestamptz not null default now()
);
create index idx_found_user on found_items(user_id);
create index idx_found_status on found_items(status);

-- REPORTS Table
create table reports (
  id          uuid primary key default uuid_generate_v4(),
  reporter_id uuid not null references users(id) on delete cascade,
  target_type text not null check (target_type in ('lost_item','found_item','lend_listing','item_request','user')),
  target_id   uuid not null,
  reason      text not null,
  status      text not null default 'pending' check (status in ('pending','resolved','dismissed')),
  resolved_by uuid references users(id),
  created_at  timestamptz not null default now()
);
create index idx_reports_status on reports(status);

-- FEEDBACKS Table
create table feedbacks (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references users(id) on delete cascade,
  message     text not null,
  rating      integer check (rating >= 1 and rating <= 5),
  created_at  timestamptz not null default now()
);
create index idx_feedbacks_user on feedbacks(user_id);

-- Enable RLS for Security
alter table users             enable row level security;
alter table lend_listings     enable row level security;
alter table borrow_requests   enable row level security;
alter table item_requests     enable row level security;
alter table request_responses enable row level security;
alter table lost_items        enable row level security;
alter table found_items       enable row level security;
alter table reports           enable row level security;
alter table feedbacks         enable row level security;

-- PUBLIC READ POLICIES
create policy "public read lend listings" on lend_listings for select using (true);
create policy "public read item requests" on item_requests for select using (true);
create policy "public read lost items" on lost_items for select using (true);
create policy "public read found items" on found_items for select using (true);
create policy "Users can insert feedback" on feedbacks for insert with check (true);
create policy "Admins/Moderators can view feedback" on feedbacks for select using (true);
```

---

## 🏃 Local Setup & Development

### 1. Backend (FastAPI)
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Run server
uvicorn main:app --reload --port 8000
```

### 2. Frontend (React)
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

---

## 📦 Deployment Instructions

### 1. Render (Backend Deployment)
- Create a **Web Service** pointing to the repository.
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Configure Environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`, `CLERK_SECRET_KEY` or `CLERK_PEM_PUBLIC_KEY`).

### 2. Vercel (Frontend Deployment)
- Connect repository to Vercel.
- Configure production environment variables (`VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`).
- Auto-deploys on push to `main` branch.