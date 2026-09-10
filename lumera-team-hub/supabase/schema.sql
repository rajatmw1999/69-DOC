-- ============================================================================
-- LUMERA TEAM HUB — Supabase schema, RLS policies, triggers, storage, realtime
-- ============================================================================
-- Run this entire file ONCE in the Supabase SQL Editor of a fresh project.
-- It is idempotent-ish (drops nothing); re-running on a non-fresh project may
-- error on already-existing objects.
--
-- Roles: admin (Founder/Admin), lead (Team Lead), member.
-- The FIRST user to sign up automatically becomes admin (founder bootstrap).
-- Every subsequent signup requires a pending row in `invites` (admin-created).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions & types
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;

create type public.user_role as enum ('admin', 'lead', 'member');

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text not null,
  name          text not null default '',
  avatar_url    text,
  role          public.user_role not null default 'member',
  department    text not null default 'General',
  bio           text not null default '',
  current_focus text not null default '',
  created_at    timestamptz not null default now()
);

create table public.invites (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  role        public.user_role not null default 'member',
  department  text not null default 'General',
  invited_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  accepted_at timestamptz
);
create unique index invites_pending_email_uidx
  on public.invites (lower(email)) where accepted_at is null;

create table public.channels (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (name ~ '^[a-z0-9][a-z0-9_-]{0,39}$'),
  description text not null default '',
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create table public.channel_messages (
  id         uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels (id) on delete cascade,
  sender_id  uuid not null references public.profiles (id) on delete cascade,
  content    text not null check (length(content) between 1 and 4000),
  created_at timestamptz not null default now(),
  edited_at  timestamptz
);
create index channel_messages_channel_idx
  on public.channel_messages (channel_id, created_at desc);

create table public.direct_messages (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  content      text not null check (length(content) between 1 and 4000),
  created_at   timestamptz not null default now(),
  read_at      timestamptz,
  check (sender_id <> recipient_id)
);
create index direct_messages_pair_idx
  on public.direct_messages (sender_id, recipient_id, created_at desc);
create index direct_messages_recipient_unread_idx
  on public.direct_messages (recipient_id) where read_at is null;

-- Folders: general/product/marketing = everyone; finance = admin+lead; legal = admin.
create table public.documents (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  folder         text not null check (folder in ('general','product','marketing','finance','legal')),
  storage_path   text not null unique,
  file_type      text not null default '',
  size_bytes     bigint not null default 0,
  version        integer not null default 1,
  uploaded_by    uuid references public.profiles (id) on delete set null,
  last_edited_by uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index documents_folder_idx on public.documents (folder, updated_at desc);

create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  lead_id     uuid references public.profiles (id) on delete set null,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create table public.tasks (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  title       text not null check (length(title) between 1 and 200),
  description text not null default '',
  status      text not null default 'todo' check (status in ('todo','in_progress','done')),
  assignee_id uuid references public.profiles (id) on delete set null,
  due_date    date,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index tasks_project_idx  on public.tasks (project_id, status);
create index tasks_assignee_idx on public.tasks (assignee_id, status);

create table public.task_comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.tasks (id) on delete cascade,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  content    text not null check (length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index task_comments_task_idx on public.task_comments (task_id, created_at);

create table public.meetings (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  agenda     text not null default '',
  location   text not null default '',
  starts_at  timestamptz not null,
  ends_at    timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index meetings_starts_idx on public.meetings (starts_at);

create table public.meeting_attendees (
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  primary key (meeting_id, user_id)
);

create table public.meeting_notes (
  id         uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.polls (
  id         uuid primary key default gen_random_uuid(),
  question   text not null check (length(question) between 1 and 300),
  multi      boolean not null default false,
  closes_at  timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.poll_options (
  id       uuid primary key default gen_random_uuid(),
  poll_id  uuid not null references public.polls (id) on delete cascade,
  label    text not null check (length(label) between 1 and 200),
  position integer not null default 0
);
create index poll_options_poll_idx on public.poll_options (poll_id, position);

create table public.poll_votes (
  id         uuid primary key default gen_random_uuid(),
  poll_id    uuid not null references public.polls (id) on delete cascade,
  option_id  uuid not null references public.poll_options (id) on delete cascade,
  voter_id   uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (option_id, voter_id)
);
create index poll_votes_poll_idx on public.poll_votes (poll_id);

create table public.announcements (
  id         uuid primary key default gen_random_uuid(),
  title      text not null check (length(title) between 1 and 200),
  content    text not null,
  author_id  uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.announcement_reactions (
  announcement_id uuid not null references public.announcements (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  emoji           text not null check (emoji in ('👍','❤️','🎉','🚀','👀')),
  primary key (announcement_id, user_id, emoji)
);

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  actor_id   uuid references public.profiles (id) on delete set null,
  type       text not null check (type in ('mention','task_assigned','announcement','meeting_invite','dm','system')),
  body       text not null default '',
  link       text not null default '/',
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, read, created_at desc);

create table public.activity_log (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references public.profiles (id) on delete cascade,
  verb         text not null,
  entity_label text not null default '',
  link         text not null default '/',
  created_at   timestamptz not null default now()
);
create index activity_log_created_idx on public.activity_log (created_at desc);

-- ---------------------------------------------------------------------------
-- 2. Helper functions (SECURITY DEFINER to avoid RLS recursion in policies)
-- ---------------------------------------------------------------------------

create or replace function public.my_role()
returns public.user_role
language sql stable security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()) = 'admin', false);
$$;

create or replace function public.is_lead_or_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()) in ('admin','lead'), false);
$$;

-- Folder-level document access, shared by table RLS and storage policies.
create or replace function public.can_access_folder(f text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select case
    when auth.uid() is null then false
    when f = 'legal'   then public.is_admin()
    when f = 'finance' then public.is_lead_or_admin()
    when f in ('general','product','marketing') then true
    else false
  end;
$$;

create or replace function public.is_project_lead(p_project uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.projects
    where id = p_project and lead_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- 3. Triggers
-- ---------------------------------------------------------------------------

-- 3a. Invite-gated signup + founder bootstrap.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_invite public.invites%rowtype;
  v_name   text;
begin
  v_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1));

  if not exists (select 1 from public.profiles) then
    -- First user ever: the founder. No invite required.
    insert into public.profiles (id, email, name, role, department)
    values (new.id, new.email, v_name, 'admin', 'Leadership');
    return new;
  end if;

  select * into v_invite
  from public.invites
  where lower(email) = lower(new.email) and accepted_at is null
  limit 1;

  if v_invite.id is null then
    raise exception 'SIGNUP_NOT_INVITED: this workspace is invite-only. Ask an admin to invite %', new.email;
  end if;

  insert into public.profiles (id, email, name, role, department)
  values (new.id, new.email, v_name, v_invite.role, v_invite.department);

  update public.invites set accepted_at = now() where id = v_invite.id;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3b. Profile update guard: only admins change roles; never demote the last admin.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if not public.is_admin() then
      raise exception 'Only admins can change roles';
    end if;
    if old.role = 'admin' and new.role <> 'admin'
       and (select count(*) from public.profiles where role = 'admin') <= 1 then
      raise exception 'Cannot demote the last admin';
    end if;
  end if;
  if new.id is distinct from old.id or new.email is distinct from old.email then
    raise exception 'id/email cannot be changed';
  end if;
  return new;
end;
$$;

create trigger on_profile_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

-- 3c. Generic updated_at.
create or replace function public.set_updated_at()
returns trigger language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger tasks_updated_at         before update on public.tasks         for each row execute function public.set_updated_at();
create trigger documents_updated_at     before update on public.documents     for each row execute function public.set_updated_at();
create trigger meeting_notes_updated_at before update on public.meeting_notes for each row execute function public.set_updated_at();

-- 3d. Poll vote integrity: option must belong to poll; single-choice enforced; no voting on closed polls.
create or replace function public.validate_poll_vote()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_poll public.polls%rowtype;
begin
  select p.* into v_poll
  from public.polls p
  join public.poll_options o on o.poll_id = p.id
  where o.id = new.option_id;

  if v_poll.id is null or v_poll.id <> new.poll_id then
    raise exception 'Option does not belong to this poll';
  end if;
  if v_poll.closes_at is not null and v_poll.closes_at < now() then
    raise exception 'This poll is closed';
  end if;
  if not v_poll.multi and exists (
    select 1 from public.poll_votes
    where poll_id = new.poll_id and voter_id = new.voter_id
  ) then
    raise exception 'Already voted in this single-choice poll';
  end if;
  return new;
end;
$$;

create trigger on_poll_vote
  before insert on public.poll_votes
  for each row execute function public.validate_poll_vote();

-- 3e. Notifications: task assignment.
create or replace function public.notify_task_assignment()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.assignee_id is not null
     and new.assignee_id <> auth.uid()
     and (tg_op = 'INSERT' or new.assignee_id is distinct from old.assignee_id) then
    insert into public.notifications (user_id, actor_id, type, body, link)
    values (new.assignee_id, auth.uid(), 'task_assigned',
            'assigned you a task: ' || new.title, '/tasks?task=' || new.id);
  end if;
  return new;
end;
$$;

create trigger on_task_assigned
  after insert or update on public.tasks
  for each row execute function public.notify_task_assignment();

-- 3f. Notifications: announcement broadcast to everyone except the author.
create or replace function public.notify_announcement()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, actor_id, type, body, link)
  select p.id, new.author_id, 'announcement', new.title, '/announcements'
  from public.profiles p
  where p.id <> new.author_id;
  return new;
end;
$$;

create trigger on_announcement_created
  after insert on public.announcements
  for each row execute function public.notify_announcement();

-- 3g. Notifications: meeting attendee added.
create or replace function public.notify_meeting_invite()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_title text;
begin
  if new.user_id <> auth.uid() then
    select title into v_title from public.meetings where id = new.meeting_id;
    insert into public.notifications (user_id, actor_id, type, body, link)
    values (new.user_id, auth.uid(), 'meeting_invite',
            'added you to a meeting: ' || coalesce(v_title, ''), '/meetings');
  end if;
  return new;
end;
$$;

create trigger on_meeting_attendee_added
  after insert on public.meeting_attendees
  for each row execute function public.notify_meeting_invite();

-- 3h. Activity feed writers.
create or replace function public.log_activity(p_verb text, p_label text, p_link text)
returns void
language sql security definer
set search_path = public
as $$
  insert into public.activity_log (actor_id, verb, entity_label, link)
  values (auth.uid(), p_verb, p_label, p_link);
$$;

create or replace function public.activity_router()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if tg_table_name = 'tasks' then
    if tg_op = 'INSERT' then
      perform public.log_activity('created a task', new.title, '/tasks?task=' || new.id);
    elsif tg_op = 'UPDATE' and new.status = 'done' and old.status <> 'done' then
      perform public.log_activity('completed a task', new.title, '/tasks?task=' || new.id);
    end if;
  elsif tg_table_name = 'documents' and tg_op = 'INSERT' then
    perform public.log_activity('uploaded a document', new.name, '/documents');
  elsif tg_table_name = 'meetings' and tg_op = 'INSERT' then
    perform public.log_activity('scheduled a meeting', new.title, '/meetings');
  elsif tg_table_name = 'polls' and tg_op = 'INSERT' then
    perform public.log_activity('opened a poll', new.question, '/meetings');
  elsif tg_table_name = 'announcements' and tg_op = 'INSERT' then
    perform public.log_activity('posted an announcement', new.title, '/announcements');
  elsif tg_table_name = 'projects' and tg_op = 'INSERT' then
    perform public.log_activity('created a project', new.name, '/tasks');
  elsif tg_table_name = 'channels' and tg_op = 'INSERT' then
    perform public.log_activity('created a channel', '#' || new.name, '/messages');
  end if;
  return coalesce(new, old);
end;
$$;

create trigger activity_tasks         after insert or update on public.tasks         for each row execute function public.activity_router();
create trigger activity_documents     after insert on public.documents     for each row execute function public.activity_router();
create trigger activity_meetings      after insert on public.meetings      for each row execute function public.activity_router();
create trigger activity_polls         after insert on public.polls         for each row execute function public.activity_router();
create trigger activity_announcements after insert on public.announcements for each row execute function public.activity_router();
create trigger activity_projects      after insert on public.projects      for each row execute function public.activity_router();
create trigger activity_channels      after insert on public.channels      for each row execute function public.activity_router();

-- ---------------------------------------------------------------------------
-- 4. Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles               enable row level security;
alter table public.invites                enable row level security;
alter table public.channels               enable row level security;
alter table public.channel_messages       enable row level security;
alter table public.direct_messages        enable row level security;
alter table public.documents              enable row level security;
alter table public.projects               enable row level security;
alter table public.tasks                  enable row level security;
alter table public.task_comments          enable row level security;
alter table public.meetings               enable row level security;
alter table public.meeting_attendees      enable row level security;
alter table public.meeting_notes          enable row level security;
alter table public.polls                  enable row level security;
alter table public.poll_options           enable row level security;
alter table public.poll_votes             enable row level security;
alter table public.announcements          enable row level security;
alter table public.announcement_reactions enable row level security;
alter table public.notifications          enable row level security;
alter table public.activity_log           enable row level security;

-- profiles: whole team is visible to authenticated users; edit self (guarded) or admin.
create policy "profiles_select" on public.profiles for select to authenticated
  using (true);
create policy "profiles_update_self" on public.profiles for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

-- invites: admin only.
create policy "invites_admin_all" on public.invites for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- channels: visible to team; anyone can create; creator/admin manage.
create policy "channels_select" on public.channels for select to authenticated
  using (true);
create policy "channels_insert" on public.channels for insert to authenticated
  with check (created_by = (select auth.uid()));
create policy "channels_update" on public.channels for update to authenticated
  using (created_by = (select auth.uid()) or public.is_admin());
create policy "channels_delete" on public.channels for delete to authenticated
  using (created_by = (select auth.uid()) or public.is_admin());

-- channel_messages: team-readable; write as self; edit own; delete own/admin.
create policy "channel_messages_select" on public.channel_messages for select to authenticated
  using (true);
create policy "channel_messages_insert" on public.channel_messages for insert to authenticated
  with check (sender_id = (select auth.uid()));
create policy "channel_messages_update" on public.channel_messages for update to authenticated
  using (sender_id = (select auth.uid()))
  with check (sender_id = (select auth.uid()));
create policy "channel_messages_delete" on public.channel_messages for delete to authenticated
  using (sender_id = (select auth.uid()) or public.is_admin());

-- direct_messages: participants only. Recipient may update (mark read), sender may update own.
create policy "dm_select" on public.direct_messages for select to authenticated
  using (sender_id = (select auth.uid()) or recipient_id = (select auth.uid()));
create policy "dm_insert" on public.direct_messages for insert to authenticated
  with check (sender_id = (select auth.uid()));
create policy "dm_update" on public.direct_messages for update to authenticated
  using (sender_id = (select auth.uid()) or recipient_id = (select auth.uid()))
  with check (sender_id = (select auth.uid()) or recipient_id = (select auth.uid()));
create policy "dm_delete" on public.direct_messages for delete to authenticated
  using (sender_id = (select auth.uid()));

-- documents: folder-gated for every operation.
create policy "documents_select" on public.documents for select to authenticated
  using (public.can_access_folder(folder));
create policy "documents_insert" on public.documents for insert to authenticated
  with check (public.can_access_folder(folder) and uploaded_by = (select auth.uid()));
create policy "documents_update" on public.documents for update to authenticated
  using (public.can_access_folder(folder)
         and (uploaded_by = (select auth.uid()) or public.is_admin()))
  with check (public.can_access_folder(folder));
create policy "documents_delete" on public.documents for delete to authenticated
  using (public.can_access_folder(folder)
         and (uploaded_by = (select auth.uid()) or public.is_admin()));

-- projects: visible to team; leads/admins create; lead/creator/admin manage.
create policy "projects_select" on public.projects for select to authenticated
  using (true);
create policy "projects_insert" on public.projects for insert to authenticated
  with check (public.is_lead_or_admin() and created_by = (select auth.uid()));
create policy "projects_update" on public.projects for update to authenticated
  using (public.is_admin() or lead_id = (select auth.uid()) or created_by = (select auth.uid()));
create policy "projects_delete" on public.projects for delete to authenticated
  using (public.is_admin() or lead_id = (select auth.uid()));

-- tasks: visible to team; anyone creates; assignee/creator/project-lead/admin edit.
create policy "tasks_select" on public.tasks for select to authenticated
  using (true);
create policy "tasks_insert" on public.tasks for insert to authenticated
  with check (created_by = (select auth.uid()));
create policy "tasks_update" on public.tasks for update to authenticated
  using (public.is_admin()
         or assignee_id = (select auth.uid())
         or created_by = (select auth.uid())
         or public.is_project_lead(project_id));
create policy "tasks_delete" on public.tasks for delete to authenticated
  using (public.is_admin()
         or created_by = (select auth.uid())
         or public.is_project_lead(project_id));

-- task_comments
create policy "task_comments_select" on public.task_comments for select to authenticated
  using (true);
create policy "task_comments_insert" on public.task_comments for insert to authenticated
  with check (author_id = (select auth.uid()));
create policy "task_comments_delete" on public.task_comments for delete to authenticated
  using (author_id = (select auth.uid()) or public.is_admin());

-- meetings
create policy "meetings_select" on public.meetings for select to authenticated
  using (true);
create policy "meetings_insert" on public.meetings for insert to authenticated
  with check (created_by = (select auth.uid()));
create policy "meetings_update" on public.meetings for update to authenticated
  using (created_by = (select auth.uid()) or public.is_admin());
create policy "meetings_delete" on public.meetings for delete to authenticated
  using (created_by = (select auth.uid()) or public.is_admin());

-- meeting_attendees: creator/admin manage the list; users may add/remove themselves.
create policy "meeting_attendees_select" on public.meeting_attendees for select to authenticated
  using (true);
create policy "meeting_attendees_insert" on public.meeting_attendees for insert to authenticated
  with check (
    user_id = (select auth.uid())
    or public.is_admin()
    or exists (select 1 from public.meetings m
               where m.id = meeting_id and m.created_by = (select auth.uid()))
  );
create policy "meeting_attendees_delete" on public.meeting_attendees for delete to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_admin()
    or exists (select 1 from public.meetings m
               where m.id = meeting_id and m.created_by = (select auth.uid()))
  );

-- meeting_notes
create policy "meeting_notes_select" on public.meeting_notes for select to authenticated
  using (true);
create policy "meeting_notes_insert" on public.meeting_notes for insert to authenticated
  with check (author_id = (select auth.uid()));
create policy "meeting_notes_update" on public.meeting_notes for update to authenticated
  using (author_id = (select auth.uid()) or public.is_admin());
create policy "meeting_notes_delete" on public.meeting_notes for delete to authenticated
  using (author_id = (select auth.uid()) or public.is_admin());

-- polls / options / votes
create policy "polls_select" on public.polls for select to authenticated
  using (true);
create policy "polls_insert" on public.polls for insert to authenticated
  with check (created_by = (select auth.uid()));
create policy "polls_update" on public.polls for update to authenticated
  using (created_by = (select auth.uid()) or public.is_admin());
create policy "polls_delete" on public.polls for delete to authenticated
  using (created_by = (select auth.uid()) or public.is_admin());

create policy "poll_options_select" on public.poll_options for select to authenticated
  using (true);
create policy "poll_options_insert" on public.poll_options for insert to authenticated
  with check (exists (select 1 from public.polls p
                      where p.id = poll_id and p.created_by = (select auth.uid()))
              or public.is_admin());
create policy "poll_options_delete" on public.poll_options for delete to authenticated
  using (exists (select 1 from public.polls p
                 where p.id = poll_id and p.created_by = (select auth.uid()))
         or public.is_admin());

create policy "poll_votes_select" on public.poll_votes for select to authenticated
  using (true);
create policy "poll_votes_insert" on public.poll_votes for insert to authenticated
  with check (voter_id = (select auth.uid()));
create policy "poll_votes_delete" on public.poll_votes for delete to authenticated
  using (voter_id = (select auth.uid()));

-- announcements: admin-only writes, enforced here (not just in the UI).
create policy "announcements_select" on public.announcements for select to authenticated
  using (true);
create policy "announcements_insert" on public.announcements for insert to authenticated
  with check (public.is_admin() and author_id = (select auth.uid()));
create policy "announcements_update" on public.announcements for update to authenticated
  using (public.is_admin());
create policy "announcements_delete" on public.announcements for delete to authenticated
  using (public.is_admin());

create policy "announcement_reactions_select" on public.announcement_reactions for select to authenticated
  using (true);
create policy "announcement_reactions_insert" on public.announcement_reactions for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "announcement_reactions_delete" on public.announcement_reactions for delete to authenticated
  using (user_id = (select auth.uid()));

-- notifications: private to their owner. Inserts happen via SECURITY DEFINER
-- triggers, plus a narrow client path for @mentions (actor must be self).
create policy "notifications_select" on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
create policy "notifications_insert_mentions" on public.notifications for insert to authenticated
  with check (actor_id = (select auth.uid()) and type = 'mention');
create policy "notifications_update" on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "notifications_delete" on public.notifications for delete to authenticated
  using (user_id = (select auth.uid()));

-- activity_log: team-readable, written only by triggers.
create policy "activity_select" on public.activity_log for select to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- 5. Storage: buckets + policies
-- ---------------------------------------------------------------------------
-- documents bucket (private): object paths are '<folder>/<uuid>-<filename>',
-- so folder access rules apply to the files themselves, not just metadata.
-- avatars bucket (public read): each user writes under '<their-uid>/...'.

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "docs_storage_select" on storage.objects for select to authenticated
  using (bucket_id = 'documents'
         and public.can_access_folder((storage.foldername(name))[1]));
create policy "docs_storage_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents'
              and public.can_access_folder((storage.foldername(name))[1]));
create policy "docs_storage_update" on storage.objects for update to authenticated
  using (bucket_id = 'documents'
         and public.can_access_folder((storage.foldername(name))[1])
         and (owner = (select auth.uid()) or public.is_admin()));
create policy "docs_storage_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'documents'
         and public.can_access_folder((storage.foldername(name))[1])
         and (owner = (select auth.uid()) or public.is_admin()));

create policy "avatars_public_read" on storage.objects for select
  using (bucket_id = 'avatars');
create policy "avatars_own_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars'
              and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars_own_update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars'
         and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars_own_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars'
         and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------------------------------------------------------------------------
-- 6. Realtime
-- ---------------------------------------------------------------------------
-- Postgres Changes respect RLS, so users only receive rows they may read.
alter publication supabase_realtime add table public.channel_messages;
alter publication supabase_realtime add table public.direct_messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.poll_votes;
alter publication supabase_realtime add table public.announcements;
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.task_comments;

-- Vote deletions must carry the full old row so live counts can decrement.
alter table public.poll_votes replica identity full;
alter table public.direct_messages replica identity full;

-- ---------------------------------------------------------------------------
-- 7. Seed: default channels
-- ---------------------------------------------------------------------------
insert into public.channels (name, description) values
  ('general',   'Company-wide chat — everything Lumera'),
  ('dev',       'Engineering: product, infra, releases'),
  ('design',    'Design: UI, brand, research'),
  ('marketing', 'Marketing: launch, growth, content')
on conflict (name) do nothing;
