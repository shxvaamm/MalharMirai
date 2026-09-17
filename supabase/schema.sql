-- ==============================================================================
-- MALHAR CULTURAL CLUB - SUPABASE SQL DATABASE SCHEMA & RLS POLICIES
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. ENUM TYPES
-- ==============================================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'member', 'volunteer');
EXCEPTION
    WHEN duplicate_object THEN 
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
END $$;

DO $$ BEGIN
    CREATE TYPE event_status AS ENUM ('upcoming', 'ongoing', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE announcement_priority AS ENUM ('normal', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE media_type AS ENUM ('image', 'video');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE gallery_category AS ENUM ('winners', 'previous_events', 'general');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 2. TABLE DEFINITIONS
-- ==============================================================================

-- 2.1 Departments
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.2 Profiles (Linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'member',
    dept_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    phone TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.3 Events
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    date_time TIMESTAMPTZ NOT NULL,
    venue TEXT NOT NULL,
    poster_url TEXT,
    max_capacity INTEGER NOT NULL DEFAULT 100,
    status event_status NOT NULL DEFAULT 'upcoming',
    registration_deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.4 Registrations
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    student_phone TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(event_id, student_email),
    UNIQUE(event_id, roll_number)
);

-- 2.5 Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority announcement_priority NOT NULL DEFAULT 'normal',
    is_emergency BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.6 Gallery
CREATE TABLE IF NOT EXISTS public.gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    media_url TEXT NOT NULL,
    media_type media_type NOT NULL DEFAULT 'image',
    category gallery_category NOT NULL DEFAULT 'general',
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.7 Audit Logs (For Security & Role Transfer Auditing)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    performed_by_id UUID,
    performed_by_email TEXT NOT NULL,
    target_user_id UUID,
    target_user_email TEXT NOT NULL,
    previous_role TEXT NOT NULL,
    new_role TEXT NOT NULL,
    action_type TEXT NOT NULL, -- e.g. 'ROLE_CHANGE', 'SUPER_ADMIN_TRANSFER'
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. INDEXES & CONSTRAINTS (Single Super Admin Guarantee)
-- ==============================================================================

-- Enforce EXACTLY ONE Super Admin in the database at all times via partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_super_admin 
    ON public.profiles(role) 
    WHERE (role = 'super_admin');

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_dept_id ON public.profiles(dept_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_date_time ON public.events(date_time);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON public.registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON public.audit_logs(action_type);

-- ==============================================================================
-- 4. HELPER FUNCTIONS & TRIGGERS
-- ==============================================================================

-- Function to check if current authenticated user has 'super_admin' role
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT 
        (auth.jwt() ->> 'email' IN ('shvxamkumar@gmail.com'))
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        );
$$;

-- Function to check if current authenticated user has 'admin' or 'super_admin' role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT 
        (auth.jwt() ->> 'email' IN ('shvxamkumar@gmail.com', 'admin@malhar.edu'))
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        );
$$;

-- Function to check if current authenticated user is admin, member, or volunteer
CREATE OR REPLACE FUNCTION public.is_team_member()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT 
        (auth.jwt() ->> 'email' IN ('shvxamkumar@gmail.com', 'admin@malhar.edu'))
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'member', 'volunteer')
        );
$$;

-- ATOMIC SUPER ADMIN TRANSFER TRANSACTION FUNCTION
CREATE OR REPLACE FUNCTION public.transfer_super_admin_rpc(
    target_user_id UUID,
    actor_id UUID,
    actor_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_super_id UUID;
    current_super_email TEXT;
    target_email TEXT;
    target_prev_role user_role;
BEGIN
    -- 1. Identify current Super Admin
    SELECT id, email INTO current_super_id, current_super_email
    FROM public.profiles
    WHERE role = 'super_admin'
    LIMIT 1;

    -- 2. Verify target user exists
    SELECT email, role INTO target_email, target_prev_role
    FROM public.profiles
    WHERE id = target_user_id;

    IF target_email IS NULL THEN
        RAISE EXCEPTION 'Target user not found.';
    END IF;

    IF target_prev_role = 'super_admin' THEN
        RAISE EXCEPTION 'Target user is already the Super Admin.';
    END IF;

    -- 3. Atomic Role Swap inside transaction
    -- If there was a current Super Admin, demote to Admin
    IF current_super_id IS NOT NULL AND current_super_id != target_user_id THEN
        UPDATE public.profiles
        SET role = 'admin'::user_role, updated_at = now()
        WHERE id = current_super_id;
    END IF;

    -- Promote target user to Super Admin
    UPDATE public.profiles
    SET role = 'super_admin'::user_role, updated_at = now()
    WHERE id = target_user_id;

    -- 4. Record in Audit Log
    INSERT INTO public.audit_logs (
        performed_by_id,
        performed_by_email,
        target_user_id,
        target_user_email,
        previous_role,
        new_role,
        action_type,
        details
    ) VALUES (
        actor_id,
        COALESCE(actor_email, current_super_email, 'system'),
        target_user_id,
        target_email,
        target_prev_role::text,
        'super_admin',
        'SUPER_ADMIN_TRANSFER',
        jsonb_build_object(
            'previous_super_admin_id', current_super_id,
            'previous_super_admin_email', current_super_email,
            'new_super_admin_id', target_user_id,
            'new_super_admin_email', target_email,
            'timestamp', now()
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'previous_super_admin', current_super_email,
        'new_super_admin', target_email
    );
END;
$$;

-- Trigger Function: Automatic Profile Creation on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            CASE 
                WHEN NEW.email IN ('shvxamkumar@gmail.com') THEN 'Shivam Kumar (Super Admin)'
                ELSE split_part(NEW.email, '@', 1)
            END
        ),
        NEW.email,
        CASE 
            WHEN NEW.email IN ('shvxamkumar@gmail.com') THEN 'super_admin'::user_role
            ELSE COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'member'::user_role)
        END,
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (email) DO UPDATE 
    SET full_name = EXCLUDED.full_name,
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        updated_at = now();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger Function: Automatic Timestamp Updates
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_events_updated_at ON public.events;
CREATE TRIGGER tr_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_announcements_updated_at ON public.announcements;
CREATE TRIGGER tr_announcements_updated_at
    BEFORE UPDATE ON public.announcements
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5.1 Departments Policies
CREATE POLICY "Departments are viewable by everyone" 
    ON public.departments FOR SELECT 
    USING (true);

CREATE POLICY "Admins can insert departments" 
    ON public.departments FOR INSERT 
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update departments" 
    ON public.departments FOR UPDATE 
    USING (public.is_admin());

CREATE POLICY "Admins can delete departments" 
    ON public.departments FOR DELETE 
    USING (public.is_admin());

-- 5.2 Profiles Policies
CREATE POLICY "Profiles are viewable by everyone" 
    ON public.profiles FOR SELECT 
    USING (true);

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND 
        (role = (SELECT role FROM public.profiles WHERE id = auth.uid()) OR public.is_admin())
    );

CREATE POLICY "Admins have full access to profiles" 
    ON public.profiles FOR ALL 
    USING (public.is_admin());

-- 5.3 Audit Logs Policies (Only Admins / Super Admin can view audit logs)
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (public.is_admin());

-- 5.4 Events Policies
CREATE POLICY "Events are viewable by everyone" 
    ON public.events FOR SELECT 
    USING (true);

CREATE POLICY "Admins can insert events" 
    ON public.events FOR INSERT 
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update events" 
    ON public.events FOR UPDATE 
    USING (public.is_admin());

CREATE POLICY "Admins can delete events" 
    ON public.events FOR DELETE 
    USING (public.is_admin());

-- 5.5 Registrations Policies
CREATE POLICY "Public students can register for events" 
    ON public.registrations FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.events 
            WHERE id = event_id 
            AND status IN ('upcoming', 'ongoing')
            AND (registration_deadline IS NULL OR registration_deadline > timezone('utc'::text, now()))
        )
    );

CREATE POLICY "Admins and team members can view registrations" 
    ON public.registrations FOR SELECT 
    USING (public.is_team_member());

CREATE POLICY "Admins can update registrations" 
    ON public.registrations FOR UPDATE 
    USING (public.is_admin());

CREATE POLICY "Admins can delete registrations" 
    ON public.registrations FOR DELETE 
    USING (public.is_admin());

-- 5.6 Announcements Policies
CREATE POLICY "Announcements are viewable by everyone" 
    ON public.announcements FOR SELECT 
    USING (true);

CREATE POLICY "Admins can insert announcements" 
    ON public.announcements FOR INSERT 
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update announcements" 
    ON public.announcements FOR UPDATE 
    USING (public.is_admin());

CREATE POLICY "Admins can delete announcements" 
    ON public.announcements FOR DELETE 
    USING (public.is_admin());

-- 5.7 Gallery Policies
CREATE POLICY "Gallery items are viewable by everyone" 
    ON public.gallery FOR SELECT 
    USING (true);

CREATE POLICY "Admins can insert gallery items" 
    ON public.gallery FOR INSERT 
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update gallery items" 
    ON public.gallery FOR UPDATE 
    USING (public.is_admin());

CREATE POLICY "Admins can delete gallery items" 
    ON public.gallery FOR DELETE 
    USING (public.is_admin());
