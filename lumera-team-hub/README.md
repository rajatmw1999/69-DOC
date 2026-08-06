# Lumera Team Hub

Internal team collaboration platform for **Lumera** — an AI-powered personal finance and
financial literacy startup. Built for a ~12-person team: chat, documents, kanban tasks,
meetings, polls, announcements, and a team directory, all behind real authentication with
role-based access enforced **in the database** via Supabase Row Level Security.

**Stack:** React 18 + Vite · Supabase (Auth, Postgres, Storage, Realtime) · no CSS framework
(hand-rolled nebula-purple design system).

---

## 👀 Just want to see it? Open `preview.html`

**[`preview.html`](preview.html)** is a single, self-contained file — **double-click it and it
opens in your browser.** No install, no terminal, no Supabase, no internet required (React is
inlined). It runs the full UI on realistic dummy Lumera data so you can click through every
screen immediately.

- Pick any teammate on the login screen to see **their** personalised dashboard, role and permissions.
- Switch accounts anytime from the avatar menu (top-right) — compare an **admin** (Avyan, can post
  announcements, sees the Admin panel and Legal/Finance folders) with a **member** (e.g. Nora, who
  can't). The difference is obvious.
- Everything is clickable: send messages, drag kanban cards, vote in polls (live bars), react to
  announcements, browse the team.

> `preview.html` is a **design/UX preview only** — it uses in-memory dummy data and resets on
> refresh. The real product is the React + Supabase app below, where data persists and access
> rules are enforced by the database. Build order in the app is unchanged.

---

## 1. Manual Supabase setup (do this once, ~10 minutes)

### 1.1 Create the project
1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Pick any name (e.g. `lumera-team-hub`), a strong database password, and a region close to your team.
3. Wait for the project to finish provisioning.

### 1.2 Run the schema
1. In the Supabase dashboard, open **SQL Editor** → **New query**.
2. Paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.
3. Then, in a new query, paste and run [`supabase/migrations/002_features.sql`](supabase/migrations/002_features.sql)
   — it adds group chats, message reply/forward/attachments, read receipts, job titles,
   contract-attached invites, private meeting notes, next steps, weekly reports, and the
   master document. (Projects that ran `schema.sql` before this migration existed just
   run `002_features.sql` on top — it's additive and safe with existing data.)
4. Then run [`supabase/migrations/003_founder_role.sql`](supabase/migrations/003_founder_role.sql)
   — it adds the **Founder** role (same access as Admin, but an Admin can't demote a
   Founder while a Founder can demote an Admin). Roles now display as
   Founder · Admin · Team Lead · Associate. After running it, promote yourself to Founder:
   ```sql
   update public.profiles set role = 'founder'
   where id = (select id from public.profiles order by created_at limit 1);
   ```
   (Run that as a separate query after 003 — it makes the first/earliest account the Founder.)
5. Then run [`supabase/migrations/004_birthdays.sql`](supabase/migrations/004_birthdays.sql)
   — adds birthdays to profiles (only month/day are ever shown). On someone's birthday,
   everyone who opens the app gets a pop-up reminder that day, a dashboard birthday card
   appears, and admins get a one-click "Post wish" button. Set birthdays from each person's
   profile (you can edit anyone's as an admin).
6. Then run [`supabase/migrations/005_action_plan.sql`](supabase/migrations/005_action_plan.sql)
   — adds the week-by-week **Action Plan** timeline (schedule of tasks/milestones grouped by
   week, with owners, categories, status, and live progress). Whole team can view; team
   leads/admins/founder build and manage it; the assignee can update their item's status.
3. You should see “Success”. This single script creates:
   - all 19 tables with relations and indexes,
   - every RLS policy (roles: `admin` / `lead` / `member`),
   - triggers (invite-gated signup, founder bootstrap, notifications, activity feed,
     role-change guards, poll-vote integrity),
   - the `documents` (private) and `avatars` (public) storage buckets **and** their access policies,
   - realtime publication for chat, DMs, notifications, votes, tasks and announcements,
   - the four default channels (#general, #dev, #design, #marketing).

> Run it on a **fresh** project. It is not designed to be re-run on top of itself.

### 1.3 Configure Auth
In **Authentication → Sign In / Up → Email**: make sure **Email** provider is enabled and
**Confirm email** is ON (it is by default).

In **Authentication → URL Configuration**:
- **Site URL**: where the app runs — `http://localhost:5173` during development,
  your production URL later (e.g. `https://hub.lumera.app`).
- **Redirect URLs**: add both
  - `http://localhost:5173/**`
  - `https://your-production-domain/**`

> ⚠️ **Email sending:** Supabase’s built-in email service is heavily rate-limited
> (a few emails/hour) and fine for trying things out, but for a real team you should plug in
> your own SMTP under **Project Settings → Auth → SMTP** (Resend, Postmark, SES…) so
> confirmations, invitations and password resets actually arrive.

### 1.4 Get your keys
**Project Settings → API**: copy the **Project URL** and the **anon / public** key.

### 1.5 Configure the app
```bash
cd lumera-team-hub
cp .env.example .env       # then edit .env:
# VITE_SUPABASE_URL=https://<your-ref>.supabase.co
# VITE_SUPABASE_ANON_KEY=<your-anon-key>
npm install
npm run dev                # http://localhost:5173
```

### 1.6 Bootstrap your team
1. **You sign up first.** The very first account to register automatically becomes
   **Founder/Admin** (no invite needed). Confirm your email, log in.
2. Go to **Admin** (sidebar) → **Invite member** → enter a teammate’s email, role and department.
3. Send them the app URL — they use **Sign up** with that exact email address.
   Anyone without a pending invite is **rejected at the database level**, so signup is
   effectively closed to the public.

---

## 2. Roles & what they can do

| Capability | Member | Team Lead | Founder/Admin |
|---|---|---|---|
| Chat, DMs, create channels, vote, react, comment | ✅ | ✅ | ✅ |
| See General / Product / Marketing documents | ✅ | ✅ | ✅ |
| See **Finance** documents | ❌ | ✅ | ✅ |
| See **Legal** documents | ❌ | ❌ | ✅ |
| Create projects | ❌ | ✅ | ✅ |
| Edit any task in their project | assignee/creator only | ✅ (their projects) | ✅ |
| Post announcements | ❌ | ❌ | ✅ |
| Invite members / change roles | ❌ | ❌ | ✅ |

Every one of these rules is enforced by **RLS policies or triggers in Postgres** — the UI
hides what you can’t do, but the database is the actual gatekeeper. Storage objects use the
same folder rules as document metadata (paths are `<folder>/<uuid>-<filename>`), so a member
cannot fetch a Legal file even with a direct API call.

Safety rails: only admins can change roles, the **last remaining admin cannot be demoted**,
and DM sender identity can’t be spoofed.

### Verified by tests
The schema ships tested: 23 functional assertions (founder bootstrap, invite gate,
role-change guards, folder visibility per role, DM privacy, task-edit permissions,
single-choice vote enforcement, notification privacy, spoofing attempts) were run against
the exact `schema.sql` on Postgres 16 with simulated `authenticated` sessions — all pass.

---

## 3. Feature map

- **Dashboard** — personal greeting, stat tiles (your open tasks, unread DMs, your meetings,
  pending polls), latest announcements, your task list, recent docs, upcoming meetings,
  live team activity feed.
- **Messages** — channels + 1:1 DMs over Supabase Realtime, @mentions (with real notification
  records), unread badges (DB-backed for DMs, per-device for channels), day dividers,
  compact message grouping, channel creation.
- **Documents** — real upload/download via Supabase Storage, five folders with role-gated
  access, search + uploader filter, versioning (upload new version bumps `v` and tracks
  `last_edited_by`).
- **Tasks** — projects with leads, 3-column kanban with drag & drop, assignees, due dates
  (overdue highlighting), task comments (live), deep links (`/tasks?task=<id>`).
- **Meetings & Polls** — scheduler with attendee picker (attendees get notified),
  agenda, minutes/notes per meeting; polls with single/multi choice, live vote bars,
  voter avatars, vote changing.
- **Announcements** — admin-only posting, broadcast notifications, emoji reactions.
- **Team** — directory with search/department filter, profile pages with role badge,
  current focus, open tasks; self-serve profile editing + avatar upload.
- **Admin** — invite management (create/revoke), member role management.
- **Global** — topbar search across people/docs/tasks/meetings/announcements, notification
  bell with live updates, toasts, loading/empty/error states, responsive down to mobile
  (drawer sidebar).

## 4. Project structure

```
lumera-team-hub/
├── supabase/schema.sql     # entire backend: tables, RLS, triggers, storage, realtime
├── src/
│   ├── main.jsx            # entry
│   ├── App.jsx             # router + auth gate
│   ├── styles.css          # nebula design system
│   ├── lib/supabase.js     # client
│   ├── lib/util.js         # formatting, mentions, folder rules
│   ├── context/AuthContext.jsx
│   ├── components/         # Layout (sidebar/topbar/bell), ui primitives, icons
│   └── pages/              # Login, Signup, ForgotPassword, ResetPassword, Dashboard,
│                           # Messages, Documents, Tasks, Meetings, Announcements,
│                           # Team, Profile, Admin
└── .env.example
```

## 5. Deploying

Any static host works (Vercel, Netlify, Cloudflare Pages):

```bash
npm run build   # outputs dist/
```

- Set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` as build-time env vars on the host.
- Configure an SPA fallback (all routes → `index.html`). On Netlify: `/* /index.html 200`
  in `_redirects`; Vercel and CF Pages handle it automatically for Vite SPAs.
- Add the production URL to Supabase **Auth → URL Configuration** (Site URL + redirect list).

## 6. Known trade-offs

- **Channel unread counts** are tracked per device (localStorage); DM unread counts are
  database-backed. Cross-device channel read-sync would need a `channel_reads` table.
- **Mention notifications** are inserted by the sender’s client (RLS pins `actor_id` to the
  real sender and restricts the type to `mention`), so a mention can’t be forged as a
  system notification.
- Kanban drag & drop is mouse-oriented; on touch devices use the status dropdown in the
  task modal.
- The anon key in the frontend is public by design — all authorization lives in RLS.
