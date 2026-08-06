-- ============================================================================
-- LUMERA TEAM HUB — Migration 002: collaboration upgrade
-- ============================================================================
-- Run this ONCE in the Supabase SQL Editor of a project that already has
-- schema.sql applied. It is ADDITIVE: no existing data is deleted.
--
-- Adds: group chats, message reply/forward/delete support, chat file
-- attachments, cross-device read receipts, job titles, contract-gated
-- invites, private meeting notes, next steps, weekly reports, and the
-- read-only master document.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Job titles (display roles) on profiles & invites
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists title text not null default '';
alter table public.invites  add column if not exists title text not null default '';

-- Contract files required for invites (storage paths in the 'contracts' bucket)
alter table public.invites add column if not exists nda_path text;
alter table public.invites add column if not exists ip_path text;
alter table public.invites add column if not exists contract_path text;

-- Copy the title from the invite at signup (replaces the 001 version).
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
    insert into public.profiles (id, email, name, role, department, title)
    values (new.id, new.email, v_name, 'admin', 'Leadership', 'Founder & CEO');
    return new;
  end if;

  select * into v_invite
  from public.invites
  where lower(email) = lower(new.email) and accepted_at is null
  limit 1;

  if v_invite.id is null then
    raise exception 'SIGNUP_NOT_INVITED: this workspace is invite-only. Ask an admin to invite %', new.email;
  end if;

  insert into public.profiles (id, email, name, role, department, title)
  values (new.id, new.email, v_name, v_invite.role, v_invite.department, coalesce(v_invite.title, ''));

  update public.invites set accepted_at = now() where id = v_invite.id;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Group chats: private channels with an explicit member list
-- ---------------------------------------------------------------------------
alter table public.channels add column if not exists is_private boolean not null default false;
alter table public.channels add column if not exists display_name text;

create table public.channel_members (
  channel_id uuid not null references public.channels (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  added_by   uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (channel_id, user_id)
);
alter table public.channel_members enable row level security;

create or replace function public.is_channel_member(p_channel uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.channel_members
    where channel_id = p_channel and user_id = auth.uid()
  );
$$;

-- The creator of a private channel is automatically its first member.
create or replace function public.add_group_creator()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.is_private and new.created_by is not null then
    insert into public.channel_members (channel_id, user_id, added_by)
    values (new.id, new.created_by, new.created_by)
    on conflict do nothing;
  end if;
  return new;
end;
$$;
create trigger on_private_channel_created
  after insert on public.channels
  for each row execute function public.add_group_creator();

-- Notify people when they're added to a group chat.
create or replace function public.notify_group_add()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_chan public.channels%rowtype;
begin
  select * into v_chan from public.channels where id = new.channel_id;
  if v_chan.is_private and new.user_id <> coalesce(auth.uid(), new.user_id) then
    insert into public.notifications (user_id, actor_id, type, body, link)
    values (new.user_id, auth.uid(), 'system',
            'added you to the group ' || coalesce(v_chan.display_name, v_chan.name),
            '/messages?channel=' || new.channel_id);
  end if;
  return new;
end;
$$;
create trigger on_channel_member_added
  after insert on public.channel_members
  for each row execute function public.notify_group_add();

-- Visibility: public channels for everyone, private ones for members only.
drop policy "channels_select" on public.channels;
create policy "channels_select" on public.channels for select to authenticated
  using (not is_private or public.is_channel_member(id));

drop policy "channel_messages_select" on public.channel_messages;
create policy "channel_messages_select" on public.channel_messages for select to authenticated
  using (exists (select 1 from public.channels c
                 where c.id = channel_id
                   and (not c.is_private or public.is_channel_member(c.id))));

drop policy "channel_messages_insert" on public.channel_messages;
create policy "channel_messages_insert" on public.channel_messages for insert to authenticated
  with check (sender_id = (select auth.uid())
              and exists (select 1 from public.channels c
                          where c.id = channel_id
                            and (not c.is_private or public.is_channel_member(c.id))));

-- Membership list: members see it; members/creator/admin manage it.
create policy "channel_members_select" on public.channel_members for select to authenticated
  using (public.is_channel_member(channel_id)
         or exists (select 1 from public.channels c where c.id = channel_id and not c.is_private));
create policy "channel_members_insert" on public.channel_members for insert to authenticated
  with check (public.is_channel_member(channel_id)
              or exists (select 1 from public.channels c
                         where c.id = channel_id and c.created_by = (select auth.uid())));
create policy "channel_members_delete" on public.channel_members for delete to authenticated
  using (user_id = (select auth.uid())
         or public.is_admin()
         or exists (select 1 from public.channels c
                    where c.id = channel_id and c.created_by = (select auth.uid())));

-- ---------------------------------------------------------------------------
-- 3. Read receipts (cross-device unread + "seen by")
-- ---------------------------------------------------------------------------
create table public.channel_reads (
  channel_id   uuid not null references public.channels (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (channel_id, user_id)
);
alter table public.channel_reads enable row level security;

create policy "channel_reads_select" on public.channel_reads for select to authenticated
  using (true);
create policy "channel_reads_upsert" on public.channel_reads for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "channel_reads_update" on public.channel_reads for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 4. Message features: reply, forward, attachments; allow file-only messages
-- ---------------------------------------------------------------------------
alter table public.channel_messages
  add column if not exists reply_to uuid references public.channel_messages (id) on delete set null,
  add column if not exists forwarded_from text,
  add column if not exists file_path text,
  add column if not exists file_name text,
  add column if not exists file_size bigint;

alter table public.direct_messages
  add column if not exists reply_to uuid references public.direct_messages (id) on delete set null,
  add column if not exists forwarded_from text,
  add column if not exists file_path text,
  add column if not exists file_name text,
  add column if not exists file_size bigint;

alter table public.channel_messages drop constraint channel_messages_content_check;
alter table public.channel_messages add constraint channel_messages_content_check
  check (length(content) <= 4000 and (length(content) >= 1 or file_path is not null));

alter table public.direct_messages drop constraint direct_messages_content_check;
alter table public.direct_messages add constraint direct_messages_content_check
  check (length(content) <= 4000 and (length(content) >= 1 or file_path is not null));

-- Live deletion events need the full old row for RLS filtering.
alter table public.channel_messages replica identity full;

-- ---------------------------------------------------------------------------
-- 5. Private meeting notes
-- ---------------------------------------------------------------------------
alter table public.meeting_notes add column if not exists is_private boolean not null default false;

create table public.meeting_note_access (
  note_id uuid not null references public.meeting_notes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (note_id, user_id)
);
alter table public.meeting_note_access enable row level security;

-- SECURITY DEFINER helpers so the two tables' policies don't recurse into
-- each other (note policy ↔ access-list policy).
create or replace function public.has_note_access(p_note uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.meeting_note_access
    where note_id = p_note and user_id = auth.uid()
  );
$$;

create or replace function public.is_note_author(p_note uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.meeting_notes
    where id = p_note and author_id = auth.uid()
  );
$$;

drop policy "meeting_notes_select" on public.meeting_notes;
create policy "meeting_notes_select" on public.meeting_notes for select to authenticated
  using (not is_private
         or author_id = (select auth.uid())
         or public.has_note_access(id));

create policy "meeting_note_access_select" on public.meeting_note_access for select to authenticated
  using (user_id = (select auth.uid()) or public.is_note_author(note_id));
create policy "meeting_note_access_insert" on public.meeting_note_access for insert to authenticated
  with check (public.is_note_author(note_id));
create policy "meeting_note_access_delete" on public.meeting_note_access for delete to authenticated
  using (public.is_note_author(note_id));

-- ---------------------------------------------------------------------------
-- 6. Next steps
-- ---------------------------------------------------------------------------
create table public.next_steps (
  id         uuid primary key default gen_random_uuid(),
  title      text not null check (length(title) between 1 and 300),
  details    text not null default '',
  owner_id   uuid references public.profiles (id) on delete set null,
  due_date   date,
  status     text not null default 'open' check (status in ('open','done')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.next_steps enable row level security;
create trigger next_steps_updated_at before update on public.next_steps
  for each row execute function public.set_updated_at();

create policy "next_steps_select" on public.next_steps for select to authenticated
  using (true);
create policy "next_steps_insert" on public.next_steps for insert to authenticated
  with check (created_by = (select auth.uid()));
create policy "next_steps_update" on public.next_steps for update to authenticated
  using (created_by = (select auth.uid()) or owner_id = (select auth.uid()) or public.is_admin());
create policy "next_steps_delete" on public.next_steps for delete to authenticated
  using (created_by = (select auth.uid()) or public.is_admin());

-- ---------------------------------------------------------------------------
-- 7. Weekly reports
-- ---------------------------------------------------------------------------
create table public.weekly_reports (
  id         uuid primary key default gen_random_uuid(),
  week_start date not null,
  title      text not null default '',
  content    text not null default '',
  file_path  text,
  file_name  text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.weekly_reports enable row level security;
create trigger weekly_reports_updated_at before update on public.weekly_reports
  for each row execute function public.set_updated_at();

create policy "weekly_reports_select" on public.weekly_reports for select to authenticated
  using (true);
create policy "weekly_reports_insert" on public.weekly_reports for insert to authenticated
  with check (created_by = (select auth.uid()));
create policy "weekly_reports_update" on public.weekly_reports for update to authenticated
  using (created_by = (select auth.uid()) or public.is_admin());
create policy "weekly_reports_delete" on public.weekly_reports for delete to authenticated
  using (created_by = (select auth.uid()) or public.is_admin());

-- ---------------------------------------------------------------------------
-- 8. Master document (single, read-only for the team, editable by admins)
-- ---------------------------------------------------------------------------
create table public.master_document (
  id         integer primary key check (id = 1),
  title      text not null default 'Lumera Master Document',
  content    text not null default '',
  file_path  text,
  file_name  text,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.master_document enable row level security;
insert into public.master_document (id) values (1) on conflict do nothing;

create policy "master_document_select" on public.master_document for select to authenticated
  using (true);
create policy "master_document_update" on public.master_document for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 9. Storage: chat attachments + invite contracts
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('chat-files', 'chat-files', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('contracts', 'contracts', false)
on conflict (id) do nothing;

create or replace function public.my_email()
returns text
language sql stable security definer
set search_path = public
as $$
  select lower(email) from public.profiles where id = auth.uid();
$$;

-- chat-files: any team member can share and fetch; sender or admin can delete.
create policy "chat_files_select" on storage.objects for select to authenticated
  using (bucket_id = 'chat-files');
create policy "chat_files_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-files');
create policy "chat_files_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'chat-files' and (owner = (select auth.uid()) or public.is_admin()));

-- contracts: admins manage everything; each person can read files under
-- their own email folder (contracts/<email>/...).
create policy "contracts_admin_all" on storage.objects for all to authenticated
  using (bucket_id = 'contracts' and public.is_admin())
  with check (bucket_id = 'contracts' and public.is_admin());
create policy "contracts_own_read" on storage.objects for select to authenticated
  using (bucket_id = 'contracts'
         and (storage.foldername(name))[1] = public.my_email());

-- ---------------------------------------------------------------------------
-- 10. Realtime additions
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.channels;
alter publication supabase_realtime add table public.channel_members;
alter publication supabase_realtime add table public.channel_reads;
