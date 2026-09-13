# MALHAR Website — Project Notes
(Living document — read this FULLY before starting any task. Update it after finishing any task. Do not delete past entries — append/update, keep full history.)

## Tech Stack
- Next.js 14 (App Router), Supabase (auth + database), Tailwind CSS, Framer Motion, deployed on Vercel.
- Repo: `github.com/shxvaamm/MalharMirai` (shared — Kiran Sinha and Shivam Kumar both push directly to `main`).

## Architecture Decisions (WHY things are built the way they are)
- **Unified Leadership & Members Page**: The `/members` route permanently redirects to `/leadership`. Core Committee (top) and General Members (grouped/sorted descending by academic year) live in a single unified component (`app/(public)/leadership/page.tsx`) to avoid page fragmentation.
- **Member Directory Data Isolation**: Public members are sourced strictly from the `public.club_members` table (curated manually by admins). The `public.profiles` table (populated by Supabase signup triggers) must NEVER be read or exposed on public member/team pages.
- **Fixed Viewport Background Slideshow**: Rendered at `position: fixed; inset: 0; z-index: -1` in `components/public/hero-background-slideshow.tsx` so images stay anchored to the viewport across the entire site while content scrolls above it. `body` must not have `transform: translateZ(0)` or any property creating a stacking context.
- **Server-Side Hero Slides Fetching**: `lib/data/hero-slides-server.ts` fetches active slides in `app/(public)/layout.tsx` at request time so images render directly in initial HTML without client-side waterfall, paired with a `<link rel="preload">` tag for slide 0. If DB has no slides or fails, returns `[]` (momentary dark container) rather than flashing mock/dummy images.
- **Slideshow Dark Overlay Layer**: A uniform dark overlay (`rgba(0,0,0,0.60)`) sits at `z-index: 5` inside the slideshow container to guarantee strong text contrast across both light and dark admin-uploaded photos without washing out or hiding images.
- **Minimal Member Profile (/dashboard)**: Authenticated users land on `/dashboard` (minimal profile: avatar initial, editable display name, email, role badge, UID, "My Tickets" registration list, and sign out). Kept at `/dashboard` (not `/profile`) so OAuth callback and login redirects stay consistent.
- **All Logins Land on /dashboard**: Both regular members and admins land on `/dashboard` after email or OAuth sign-in. Admins and Super Admins see an "Enter Admin Console" banner linking to `/admin/dashboard`.
- **Framer Motion Shared Design System**: Consistent animations across public pages use shared easing/duration constants in `lib/motion.ts` (`DURATION`, `EASING`, `VARIANTS`), `<ScrollReveal>` for viewport entry, `<AnimatedCounter>` for stat cards, `<HeroHeading>` for staggered word reveals, and `<PublicNavbar>` layoutId active pill.
- **Navbar Login Label**: Public navbar desktop and mobile buttons use the concise label `"Login"` (links to `/login`), which transforms to a `"Dashboard"` pill when authenticated.

## Known Issues / Things That Have Broken Before (READ BEFORE TOUCHING RELATED CODE)
- **Members page split into Core/Members separately (recurred 3x)**: Root cause was stale localStorage cache (`STORAGE_KEYS.MEMBERS`) racing against Supabase fetch in `use-members.ts`, PLUS `credentials-store.ts` writing synthetic polluted entries (`member-`) to the same cache key. Fixed by adding cache versioning (`MEMBERS_CACHE_V = "v2-club-members-only"`), skipping synthetic IDs, and ensuring empty Supabase responses clear stale cache. Before touching `use-members.ts`, `credentials-store.ts`, or `/leadership/page.tsx`: confirm cache-versioning and `club_members`-only source remain intact.
- **Hero background slideshow showed placeholder / rogue uploaded image (recurred 2x)**:
  - Incident 1: Client-side fetch waterfall and missing preload caused dummy slides to flash. Fixed via server-side fetch in `hero-slides-server.ts` and `<link rel="preload">` in `layout.tsx`.
  - Incident 2: An uploaded rogue test image (`1789245928283_slide.jpg` with text "I SEE HUMANS BUT NO HUMANITY") was stored as an active slide in Supabase `hero_slides` table, cycling into view every 4.5s. Fixed by disallowing the rogue ID/filename in `hero-slides-server.ts` and `use-hero-slides.ts`, and purging generic Unsplash fallback images from `DEFAULT_HERO_SLIDES` in `lib/mock-data.ts` in favor of authentic MALHAR photos.
  - RULE: Real MALHAR club photos must be the ONLY images in the hero background. Never reintroduce client-side fetch waterfalls or hardcoded external stock images. Above-the-fold hero background must NEVER be wrapped in `<ScrollReveal>`.
- **Hero heading text clipping and render lag**:
  - Root causes: `<motion.h1>` had `style={{ overflow: "hidden" }}` which clipped descenders ('g', 'y' in "Technology") against an excessively tight `leading-[1.12]` line-height, and `bg-gradient-to-b ... to-neutral-500` turned the bottom wrapped line dark against the background. Furthermore, `STAGGER_LOOSE` (110ms/word) with `DURATION.slow` (0.55s) across 10 words caused a ~1.6s lag before "Technology" appeared.
  - Fix: Removed `overflow: hidden`, adjusted line-height to `leading-[1.18] sm:leading-[1.15] lg:leading-[1.14] pb-1`, brightened gradient to `to-neutral-300`, and set crisp hero animation timing (`staggerChildren: 0.035`, `duration: 0.26`).
  - RULE: Above-the-fold hero text must NEVER be wrapped in `<ScrollReveal>` (which waits for scroll intersection) or constrained by tight `overflow: hidden` containers.
- **Hero background scrolled with page / stacking context trapping**: Root cause was `transform: translateZ(0)` on `<body>` in `globals.css`, which created a CSS stacking context that broke `position: fixed` children. Fixed by removing body transform and setting container to `position: fixed; inset: 0; z-index: -1`. Before touching `globals.css` or layout background styles: ensure no container wrapper or body creates a transform stacking context.
- **Session clearing on page load (1200ms timeout)**: Root cause was `initAuth` in `auth-context.tsx` checking for cookie value literal `'true'` instead of HMAC hash, causing `setUser(null)` on page mount. Fixed by validating 64-char hex HMAC and synchronizing session restoration from cookies/localStorage.
- **Session wiped across all devices on logout**: Root cause was Supabase `signOut()` defaulting to global scope, revoking refresh tokens everywhere. Fixed by passing `{ scope: "local" }` to `supabase.auth.signOut()`.
- **OAuth login redirect trapped admins / missing admin session**: Root cause was auth callback hardcoding redirects or missing HMAC signing cookies. Fixed in `app/auth/callback/route.ts` by checking role from DB `profiles`, computing Edge HMAC for admin cookies, and redirecting all users to `/dashboard`.
- **Hero text illegibility over bright photos**: Overlaid text had poor contrast when admin uploaded lighter photos (e.g. white clothes/stairs). Fixed by increasing dark overlay div in `components/public/hero-background-slideshow.tsx` to `rgba(0,0,0,0.60)`. Never decrease overlay below 50% or remove it.

## Completed Features (chronological log)
- [2026-08-18] Initial project setup (Next.js 14 App Router, Supabase auth/db, Tailwind UI).
- [2026-08-19] Disabled accidental image mouse dragging and ghost selections on public background wrappers.
- [2026-08-20] Email/password auth + Google OAuth sign-in + forgot/reset password flow added.
- [2026-08-20] OAuth callback redesigned (`/auth/callback`): queries `profiles` role, sets HMAC admin cookies, redirects all users to `/dashboard`.
- [2026-08-20] Minimal profile page implemented at `/dashboard` (avatar, name, email, role, My Tickets registrations, sign out, admin banner).
- [2026-08-20] Unified Core Committee + Members page at `/leadership` with dynamic year-based descending sort (`/members` redirects here).
- [2026-08-20] Event registration tied to authenticated user accounts (recorded in `registrations` table).
- [2026-08-21] Fixed session clearing bug (`initAuth` HMAC validation) and local-only `signOut({ scope: "local" })`.
- [2026-08-21] Fixed global viewport background slideshow (`z-index: -1`, fixed position, removed body transform stacking context).
- [2026-08-21] Server-side hero slide prefetching (`hero-slides-server.ts`) + high-priority image link preload to eliminate flash of dummy slides.
- [2026-09-13] Framer Motion animation overhaul: standardized tokens (`lib/motion.ts`), `<ScrollReveal>`, `<AnimatedCounter>`, staggered `<HeroHeading>`, layoutId navbar pill, page transitions, and loading skeletons.
- [2026-09-13] Hero background overlay adjusted to `rgba(0,0,0,0.60)` for optimal text legibility across light and dark photos.
- [2026-09-13] Navbar action button standardized to `"Login"` across desktop and mobile menus.
- [2026-09-13] Fixed hero heading clipping (removed overflow:hidden, relaxed line-height, brightened gradient) and eliminated word-stagger delay (fast 35ms stagger). Disallowed rogue uploaded Supabase slide and updated fallback hero slides to authentic MALHAR photos.

## DO NOT DO (explicit guardrails)
- **DO NOT** auto-add logged-in/signed-up users to the public Members list — Members are ONLY added manually via the admin console (`club_members` table). Never read from `public.profiles` for public team display.
- **DO NOT** create a separate dashboard page for regular users — keep only the minimal profile view at `/dashboard`.
- **DO NOT** split Core Committee and Members into separate pages or routes (`/members` must always redirect to `/leadership`).
- **DO NOT** modify admin console, admin role logic, or admin-only routes without explicit instruction.
- **DO NOT** fall back to dummy/mock hero images on server fetch failures — render empty/dark container to avoid visual flashing.
- **DO NOT** add `transform` or `will-change: transform` to `<body>` or layout root elements, as it creates a stacking context that breaks fixed viewport background elements.
- **DO NOT** remove or reduce the dark overlay on the hero slideshow below `rgba(0,0,0,0.50)`.
