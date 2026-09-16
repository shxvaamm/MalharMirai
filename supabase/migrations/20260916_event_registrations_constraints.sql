-- Migration: 20260916_event_registrations_constraints.sql
-- Purpose: 
--  1. Drop NOT NULL on student_phone so phone is optional and accepts genuine NULL values.
--  2. Drop NOT NULL on roll_number if the column exists in the schema.
--  3. Ensure user_id column exists for linking authenticated users.
--  4. Deduplicate any existing records before adding constraints.
--  5. Enforce unique constraint on (event_id, student_email) to prevent duplicate registrations.
--  6. Enforce unique index on (event_id, user_id) where user_id IS NOT NULL.

-- Step 1: Drop NOT NULL constraint on student_phone
ALTER TABLE public.registrations 
    ALTER COLUMN student_phone DROP NOT NULL;

-- Step 2: Safely drop NOT NULL on roll_number if column exists
DO $$ 
BEGIN
    ALTER TABLE public.registrations ALTER COLUMN roll_number DROP NOT NULL;
    RAISE NOTICE 'Successfully dropped NOT NULL constraint on roll_number';
EXCEPTION 
    WHEN undefined_column THEN
        RAISE NOTICE 'Column roll_number does not exist on public.registrations; skipped gracefully.';
END $$;

-- Step 3: Add user_id column if it doesn't exist yet
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'registrations' 
          AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.registrations 
            ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added user_id column to public.registrations';
    ELSE
        RAISE NOTICE 'user_id column already exists on public.registrations';
    END IF;
END $$;

-- Step 4: Remove any existing duplicate registrations, keeping the MOST RECENT entry
DELETE FROM public.registrations a
USING public.registrations b
WHERE a.event_id = b.event_id
  AND LOWER(TRIM(a.student_email)) = LOWER(TRIM(b.student_email))
  AND (
    a.created_at < b.created_at
    OR (
      a.created_at = b.created_at
      AND a.ctid < b.ctid
    )
  );

-- Step 5: Enforce database-level UNIQUE constraint on (event_id, student_email)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_event_student_email'
    ) THEN
        ALTER TABLE public.registrations 
            ADD CONSTRAINT unique_event_student_email UNIQUE (event_id, student_email);
        RAISE NOTICE 'Added unique_event_student_email constraint';
    ELSE
        RAISE NOTICE 'unique_event_student_email constraint already exists';
    END IF;
END $$;

-- Step 6: Enforce database-level UNIQUE index on (event_id, user_id) where user_id IS NOT NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_event_user_id 
    ON public.registrations (event_id, user_id) 
    WHERE user_id IS NOT NULL;
