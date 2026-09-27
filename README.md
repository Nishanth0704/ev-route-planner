# ⚡ EV Route & Charging Planner

An intelligent EV route and charging planner web application.

---

## 🚀 Features Implemented So Far

- **Step 1: Frontend Dashboard**
  - EV-themed dark UI with green accents
  - Responsive layout (desktop and mobile)
  - Vehicle selector, trip location inputs, battery settings with 0–100% validation
  - Map placeholder
  - Trip summary & charging station metrics
- **Step 2: Dynamic EV Dataset**
  - Integrated full EV catalog dataset (`evVehicles.csv` — 164 vehicles, 48 brands)
  - Dynamic cascading brand & model dropdowns
  - Real specs displayed: Vehicle Type, Battery Capacity, Range, Efficiency
  - Modular service layer (`vehicleService.js`) ready for backend transition
- **Step 3: Supabase Authentication + Google Login**
  - Supabase client initialization (`src/services/supabase.js`)
  - Google OAuth sign-in with redirect and state recovery
  - Authentication context (`AuthContext.jsx`) with live auth state listeners
  - Protected routes (`ProtectedRoute.jsx`) preventing unauthenticated dashboard access
  - Google user avatar, name, and email displayed in the header
  - Logout functionality with instant redirect to login
  - Supabase database `profiles` schema with Row Level Security (RLS) (`supabase/schema.sql`)

---

## 🛠️ Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> **Security Note:** Only the public/anon key should be placed here. Never expose your Supabase `service_role` secret in the frontend code.

---

### 2. Configure Google OAuth in Supabase

Follow these steps to connect Google OAuth with your Supabase project:

1. **Create or Open Supabase Project:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard) and open your project.

2. **Obtain Google OAuth Credentials:**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/).
   - Navigate to **APIs & Services > Credentials**.
   - Click **Create Credentials > OAuth client ID**.
   - Select **Web application** as the application type.
   - Under **Authorized redirect URIs**, add your Supabase project callback URL:
     ```text
     https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback
     ```
     *(You can find this exact callback URL in your Supabase Authentication > Providers > Google settings)*
   - Click **Create** and copy the generated **Client ID** and **Client Secret**.

3. **Configure Google Provider in Supabase:**
   - In Supabase Dashboard, go to **Authentication > Providers**.
   - Find and expand **Google**.
   - Toggle **Enable Google provider**.
   - Paste your **Client ID** and **Client Secret**.
   - Click **Save**.

4. **Configure Redirect URLs in Supabase:**
   - In Supabase Dashboard, go to **Authentication > URL Configuration**.
   - Set **Site URL** to:
     ```text
     http://localhost:5173
     ```
   - Under **Redirect URLs**, add:
     ```text
     http://localhost:5173/**
     ```
   *(When deploying to production, add your production domain here as well.)*

---

### 3. Run Database Migrations (User Profiles Table)

1. Open your Supabase Dashboard and go to the **SQL Editor**.
2. Copy the contents of `supabase/schema.sql`.
3. Paste and run the query to create:
   - The `profiles` table linked to `auth.users`
   - Row Level Security (RLS) policies allowing users to read and update only their own profile
   - A trigger that automatically synchronizes Google account metadata (name, email, avatar) upon login.

---

### 4. Running the Development Server

```bash
# If using the portable node installation in this environment:
$env:PATH = "C:\Users\nissh\.gemini\antigravity\scratch\nodejs\node-v22.14.0-win-x64;$env:PATH"

# Run Vite dev server
npm run dev
```

Visit `http://localhost:5173` in your browser.
