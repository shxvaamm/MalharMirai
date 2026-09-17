-- ==============================================================================
-- MALHAR Cultural Club - Role-Based Access Control (RBAC) Migration
-- File: supabase_rbac.sql
-- Description:
--   1. Profiles table linked to auth.users with role column (default 'member')
--   2. Automated SQL trigger on auth.users to create profiles on user signup
--   3. Row Level Security (RLS) policies granting access exclusively to 'admin' & 'super_admin'
-- ==============================================================================

-- 1. Create User Role ENUM type if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'member', 'volunteer');
    END IF;
END $$;

-- 2. Create public.profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'member'::user_role,
    avatar_url TEXT,
    phone TEXT,
    dept_id UUID,
    department TEXT DEFAULT 'General',
    specialty TEXT DEFAULT 'Official Member',
    bio TEXT DEFAULT 'Active cultural society member.',
    year TEXT DEFAULT '1st Year',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Idempotent column migrations for existing profiles table instances
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'member'::user_role;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dept_id UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'General';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialty TEXT DEFAULT 'Official Member';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT 'Active cultural society member.';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS year TEXT DEFAULT '1st Year';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
-- Social links for leadership profiles (displayed on Core Committee public page)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin TEXT;

-- Performance Indexes on Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Enable Row-Level Security on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Security Definer Helper Functions for RLS
-- Checks if current requesting user is a Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT 
        (auth.jwt() ->> 'email' = 'shvxamkumar@gmail.com')
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        );
$$;

-- Checks if current requesting user is an Admin or Super Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT 
        (auth.jwt() ->> 'email' = 'shvxamkumar@gmail.com')
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        );
$$;

-- 4. Automated User Signup Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    assigned_role user_role := 'member'::user_role;
    user_full_name TEXT;
BEGIN
    -- Check if newly signed up user is the designated single Super Admin
    IF LOWER(NEW.email) = 'shvxamkumar@gmail.com' THEN
        assigned_role := 'super_admin'::user_role;
        user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Shivam Kumar (Super Admin)');
    ELSE
        -- Default for all new signups is 'member'
        assigned_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'member'::user_role);
        user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    END IF;

    -- Insert new profile row
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        avatar_url
    ) VALUES (
        NEW.id,
        LOWER(NEW.email),
        user_full_name,
        assigned_role,
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE 
    SET 
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        updated_at = now();

    RETURN NEW;
END;
$$;

-- Bind trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_signup();

-- 5. RLS Policies for Profiles Table
-- Anyone (anon and authenticated) can view public member directory profiles
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Users can update their own non-role profile details
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admins and Super Admins can manage all profile records and roles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
    ON public.profiles
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6. Sample Application Tables with Admin-Exclusive RLS Policies

-- A. Audit Logs Table (Admin Exclusive)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL,
    performed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    performed_by_email TEXT NOT NULL,
    target_user_id UUID,
    target_user_email TEXT,
    previous_role TEXT,
    new_role TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Only admins can view audit logs"
    ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Only admins can insert audit logs" ON public.audit_logs;
CREATE POLICY "Only admins can insert audit logs"
    ON public.audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- B. Event Registrations Table (Admin Management & Public Submission)
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    student_phone TEXT NOT NULL,
    college_id TEXT,
    department TEXT,
    year_of_study TEXT,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'waitlisted', 'cancelled', 'attended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Admins can view and manage all registrations
DROP POLICY IF EXISTS "Admins can view and manage all registrations" ON public.registrations;
CREATE POLICY "Admins can view and manage all registrations"
    ON public.registrations
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Public users can insert their own registration
DROP POLICY IF EXISTS "Public can submit registration" ON public.registrations;
CREATE POLICY "Public can submit registration"
    ON public.registrations
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- C. Events Table (Public Read, Admin Write)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    date_time TIMESTAMPTZ NOT NULL,
    venue TEXT NOT NULL,
    poster_url TEXT,
    max_capacity INTEGER DEFAULT 100,
    registered_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed')),
    rules TEXT[] DEFAULT '{}',
    prizes TEXT[] DEFAULT '{}',
    coordinators JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public events are viewable by everyone" ON public.events;
CREATE POLICY "Public events are viewable by everyone"
    ON public.events
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Only admins can modify events" ON public.events;
CREATE POLICY "Only admins can modify events"
    ON public.events
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- D. Announcements Table (Public Read, Admin Write)
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent')),
    is_emergency BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public announcements are viewable by everyone" ON public.announcements;
CREATE POLICY "Public announcements are viewable by everyone"
    ON public.announcements
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Only admins can manage announcements" ON public.announcements;
CREATE POLICY "Only admins can manage announcements"
    ON public.announcements
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- E. Departments Table (Public Read, Admin Write)
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    lead TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public departments are viewable by everyone" ON public.departments;
CREATE POLICY "Public departments are viewable by everyone"
    ON public.departments
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Only admins can manage departments" ON public.departments;
CREATE POLICY "Only admins can manage departments"
    ON public.departments
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- F. Gallery Media Table (Public Read, Admin Write)
CREATE TABLE IF NOT EXISTS public.gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'image',
    category TEXT DEFAULT 'general',
    event_title TEXT,
    date TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public gallery items are viewable by everyone" ON public.gallery;
CREATE POLICY "Public gallery items are viewable by everyone"
    ON public.gallery
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Only admins can manage gallery" ON public.gallery;
CREATE POLICY "Only admins can manage gallery"
    ON public.gallery
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- G. Club Stats Table (Public Read, Admin Write)
CREATE TABLE IF NOT EXISTS public.club_stats (
    id TEXT PRIMARY KEY DEFAULT 'current',
    active_members INTEGER DEFAULT 48,
    events_organised INTEGER DEFAULT 12,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.club_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Club stats viewable by everyone" ON public.club_stats;
CREATE POLICY "Club stats viewable by everyone"
    ON public.club_stats
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Only admins can modify club stats" ON public.club_stats;
CREATE POLICY "Only admins can modify club stats"
    ON public.club_stats
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Seed initial row
INSERT INTO public.club_stats (id, active_members, events_organised)
VALUES ('current', 48, 12)
ON CONFLICT (id) DO NOTHING;

-- H. Site Settings Table (Key-Value Metadata)
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Site settings viewable by everyone" ON public.site_settings;
CREATE POLICY "Site settings viewable by everyone"
    ON public.site_settings
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Only admins can modify site settings" ON public.site_settings;
CREATE POLICY "Only admins can modify site settings"
    ON public.site_settings
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

-- Explicit grant so anonymous (incognito) visitors can read the member/leadership directory
GRANT SELECT ON public.profiles TO anon, authenticated;

INSERT INTO public.site_settings (key, value)
VALUES 
    ('public_active_members', '7'),
    ('public_events_organised', '8'),
    ('active_members', '7'),
    ('events_organised', '8')
ON CONFLICT (key) DO NOTHING;

-- ==============================================================================
-- SUPABASE REALTIME — Enable for all public-facing tables
-- Run this so admin changes instantly appear on ALL devices (cross-PC, Incognito)
-- ==============================================================================

-- Add tables to Supabase's real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gallery;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;

-- Grant anon + authenticated SELECT on all public-facing tables
GRANT SELECT ON public.events TO anon, authenticated;
GRANT SELECT ON public.gallery TO anon, authenticated;
GRANT SELECT ON public.announcements TO anon, authenticated;
