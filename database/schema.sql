-- ============================================================
-- Attendance Pro SaaS — Full Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- 1. ORGANIZATIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organizations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  logo_url    TEXT,
  owner_id    UUID NOT NULL, -- References auth.users, but we can't do circular FK easily. It's logically tied.
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 2. USERS (Staff & Owners)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id           UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  email            TEXT NOT NULL UNIQUE,
  full_name        TEXT NOT NULL,
  role             TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner','manager','staff')),
  avatar_url       TEXT,
  phone            TEXT,
  department       TEXT,
  designation      TEXT,
  employment_type  TEXT DEFAULT 'full_time' CHECK (employment_type IN ('full_time','part_time','contract')),
  join_date        DATE,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 3. LOCATIONS (Office Geofences)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.locations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  latitude        DOUBLE PRECISION NOT NULL,
  longitude       DOUBLE PRECISION NOT NULL,
  radius_meters   INTEGER NOT NULL DEFAULT 20,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 4. ATTENDANCE RULES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance_rules (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id                      UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  max_entries_per_day         INTEGER NOT NULL DEFAULT 2,
  work_start_time             TIME,
  work_end_time               TIME,
  grace_period_minutes        INTEGER NOT NULL DEFAULT 15,
  overtime_threshold_minutes  INTEGER NOT NULL DEFAULT 60,
  weekend_days                INTEGER[] NOT NULL DEFAULT '{0,6}', -- 0=Sun, 6=Sat
  requires_biometric          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 5. ATTENDANCE LOGS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  org_id              UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id         UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  type                TEXT NOT NULL CHECK (type IN ('entry','exit')),
  timestamp           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  latitude            DOUBLE PRECISION,
  longitude           DOUBLE PRECISION,
  distance_from_zone  DOUBLE PRECISION,
  biometric_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  device_info         TEXT,
  is_valid            BOOLEAN NOT NULL DEFAULT TRUE,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_org_date ON public.attendance_logs (org_id, timestamp DESC);

-- ─────────────────────────────────────────────
-- 6. LEAVES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leave_types (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id              UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  max_days_per_year   INTEGER NOT NULL,
  is_paid             BOOLEAN NOT NULL DEFAULT TRUE,
  carry_forward       BOOLEAN NOT NULL DEFAULT FALSE,
  requires_approval   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.leave_balances (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  leave_type_id   UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
  year            INTEGER NOT NULL,
  total_days      INTEGER NOT NULL,
  used_days       INTEGER NOT NULL DEFAULT 0,
  pending_days    INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, leave_type_id, year)
);

CREATE TABLE IF NOT EXISTS public.leave_requests (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  org_id            UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  leave_type_id     UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
  start_date        DATE NOT NULL,
  end_date          DATE NOT NULL,
  total_days        INTEGER NOT NULL,
  reason            TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  reviewed_by       UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 7. HOLIDAYS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.holidays (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  date            DATE NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('national','company')),
  is_recurring    BOOLEAN NOT NULL DEFAULT FALSE
);

-- ─────────────────────────────────────────────
-- 8. NOTIFICATIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  type            TEXT NOT NULL,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- We also need a webauthn credentials table for biometrics
CREATE TABLE IF NOT EXISTS public.webauthn_credentials (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  credential_id   TEXT NOT NULL UNIQUE,
  public_key      TEXT NOT NULL,
  sign_count      INTEGER NOT NULL DEFAULT 0,
  device_name     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 9. ROW LEVEL SECURITY (Multi-Tenant)
-- ─────────────────────────────────────────────

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;


-- To prevent recursive policies on users table fetching org_id, 
-- create a helper function to get current user's org_id
CREATE OR REPLACE FUNCTION get_my_org_id() RETURNS UUID AS $$
  SELECT org_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_org_owner() RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('owner', 'manager'));
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ORGANIZATIONS
CREATE POLICY "Users view own org" ON public.organizations FOR SELECT USING (id = get_my_org_id());

-- USERS
CREATE POLICY "Users view users in same org" ON public.users FOR SELECT USING (org_id = get_my_org_id() OR id = auth.uid());
CREATE POLICY "Users update own profile" ON public.users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Owners manage all users in org" ON public.users FOR ALL USING (org_id = get_my_org_id() AND is_org_owner());

-- LOCATIONS
CREATE POLICY "Staff view org locations" ON public.locations FOR SELECT USING (org_id = get_my_org_id());
CREATE POLICY "Owners manage locations" ON public.locations FOR ALL USING (org_id = get_my_org_id() AND is_org_owner());

-- ATTENDANCE RULES
CREATE POLICY "Staff view rules" ON public.attendance_rules FOR SELECT USING (org_id = get_my_org_id());
CREATE POLICY "Owners manage rules" ON public.attendance_rules FOR ALL USING (org_id = get_my_org_id() AND is_org_owner());

-- ATTENDANCE LOGS
CREATE POLICY "Staff view own logs" ON public.attendance_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Staff add own logs" ON public.attendance_logs FOR INSERT WITH CHECK (user_id = auth.uid() AND org_id = get_my_org_id());
CREATE POLICY "Owners manage all logs in org" ON public.attendance_logs FOR ALL USING (org_id = get_my_org_id() AND is_org_owner());

-- LEAVE TYPES
CREATE POLICY "Staff view leave types" ON public.leave_types FOR SELECT USING (org_id = get_my_org_id());
CREATE POLICY "Owners manage leave types" ON public.leave_types FOR ALL USING (org_id = get_my_org_id() AND is_org_owner());

-- LEAVE BALANCES
CREATE POLICY "Staff view own balances" ON public.leave_balances FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Owners view all balances in org" ON public.leave_balances FOR ALL USING (
  EXISTS(SELECT 1 FROM public.users WHERE users.id = leave_balances.user_id AND users.org_id = get_my_org_id() AND is_org_owner())
);

-- LEAVE REQUESTS
CREATE POLICY "Staff view own requests" ON public.leave_requests FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Staff create own requests" ON public.leave_requests FOR INSERT WITH CHECK (user_id = auth.uid() AND org_id = get_my_org_id());
CREATE POLICY "Owners manage all requests in org" ON public.leave_requests FOR ALL USING (org_id = get_my_org_id() AND is_org_owner());

-- HOLIDAYS
CREATE POLICY "Staff view holidays" ON public.holidays FOR SELECT USING (org_id = get_my_org_id());
CREATE POLICY "Owners manage holidays" ON public.holidays FOR ALL USING (org_id = get_my_org_id() AND is_org_owner());

-- NOTIFICATIONS
CREATE POLICY "Staff manage own notifications" ON public.notifications FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Owners view org notifications" ON public.notifications FOR SELECT USING (org_id = get_my_org_id() AND is_org_owner());

-- WEBAUTHN
CREATE POLICY "Staff manage own credentials" ON public.webauthn_credentials FOR ALL USING (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- 10. REALTIME
-- ─────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- ─────────────────────────────────────────────
-- 11. AUTH TRIGGERS (Auto-sync with public.users)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_org_id UUID;
  user_role TEXT;
BEGIN
  user_role := COALESCE(new.raw_user_meta_data->>'role', 'staff');
  
  -- If owner, create a default organization first
  IF user_role = 'owner' THEN
    INSERT INTO public.organizations (name, owner_id)
    VALUES (
      COALESCE(new.raw_user_meta_data->>'full_name', 'My') || '''s Organization',
      new.id
    ) RETURNING id INTO new_org_id;
  ELSE
    -- If staff, expect org_id to be passed from the inviter
    new_org_id := (new.raw_user_meta_data->>'org_id')::uuid;
  END IF;

  -- Insert user profile
  INSERT INTO public.users (id, email, full_name, role, phone, org_id, department, designation)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Unknown User'),
    user_role,
    new.raw_user_meta_data->>'phone',
    new_org_id,
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'designation'
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
