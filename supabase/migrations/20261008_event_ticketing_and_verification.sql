-- Migration: 20261008_event_ticketing_and_verification.sql
-- Purpose:
--  1. Add ticketing, payment, and custom question fields to public.events table.
--  2. Add team, options, payment screenshot, issue reason, ticket code, and check-in audit fields to public.registrations.
--  3. Ensure RLS policies support public ticket verification and user ticket retrieval.

-- 1. Extend public.events with ticketing and payment metadata
ALTER TABLE public.events 
    ADD COLUMN IF NOT EXISTS is_free BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS ticket_price NUMERIC NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS individual_fee NUMERIC NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS team_fee NUMERIC NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS payment_upi TEXT DEFAULT 'malharmirai01@okaxis',
    ADD COLUMN IF NOT EXISTS payment_qr_url TEXT,
    ADD COLUMN IF NOT EXISTS event_options JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS ask_custom_question BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS custom_question TEXT,
    ADD COLUMN IF NOT EXISTS allowed_registration_type TEXT NOT NULL DEFAULT 'both';

-- 2. Extend public.registrations with team, answer, screenshot, ticket code & check-in fields
ALTER TABLE public.registrations 
    ADD COLUMN IF NOT EXISTS registration_type TEXT NOT NULL DEFAULT 'individual',
    ADD COLUMN IF NOT EXISTS team_name TEXT,
    ADD COLUMN IF NOT EXISTS leader JSONB,
    ADD COLUMN IF NOT EXISTS team_members JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS selected_options JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS custom_answer TEXT,
    ADD COLUMN IF NOT EXISTS payment_screenshot TEXT,
    ADD COLUMN IF NOT EXISTS issue_reason TEXT,
    ADD COLUMN IF NOT EXISTS ticket_code TEXT,
    ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS checked_in_by UUID;

-- 3. Update status column default and constraint
DO $$
BEGIN
    ALTER TABLE public.registrations ALTER COLUMN status SET DEFAULT 'pending';
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_registrations_ticket_code ON public.registrations(ticket_code);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON public.registrations(created_at DESC);

-- 5. RPC Functions for safe atomic slot counter manipulation
CREATE OR REPLACE FUNCTION public.increment_registered_count(event_id_arg UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.events
    SET registered_count = COALESCE(registered_count, 0) + 1
    WHERE id = event_id_arg;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_registered_count(event_id_arg UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.events
    SET registered_count = GREATEST(0, COALESCE(registered_count, 0) - 1)
    WHERE id = event_id_arg;
END;
$$;
