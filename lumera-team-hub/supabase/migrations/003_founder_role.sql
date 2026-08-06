-- ============================================================================
-- LUMERA TEAM HUB — Migration 003: separate Founder role
-- ============================================================================
-- Run ONCE in the Supabase SQL Editor after 001 + 002.
--
-- Adds a 4th role, 'founder', with the SAME access as 'admin' (it reuses the
-- existing admin-gated rules, so nothing else had to be reworked), plus one
-- asymmetry:
--   • an Admin cannot change/remove a Founder
--   • a Founder can change/remove an Admin
-- Also keeps a lockout guard: the last remaining Admin-or-Founder can't be
-- demoted.
--
-- Display labels become: Founder · Admin · Team Lead · Associate  (the old
-- 'member' role is now shown as "Associate"; no data changes for that).
--
-- All comparisons below use role::text, so this whole script is safe to run
-- in one go even though 'founder' is a brand-new enum value.
-- ============================================================================

alter type public.user_role add value if not exists 'founder';

-- Founders count as admins everywhere admin access is checked.
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    (select role::text from public.profiles where id = auth.uid()) in ('admin', 'founder'),
    false);
$$;

create or replace function public.is_lead_or_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    (select role::text from public.profiles where id = auth.uid()) in ('admin', 'lead', 'founder'),
    false);
$$;

-- Role-change guard with the Founder protection + lockout guard.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  -- Only enforce role rules for real logged-in API users. When auth.uid() is
  -- null (service role / SQL editor / dashboard), this is a trusted context —
  -- e.g. promoting the founder — so let it through.
  if new.role is distinct from old.role and auth.uid() is not null then
    if not public.is_admin() then
      raise exception 'Only admins or founders can change roles';
    end if;
    -- Only a founder may change a founder's role (admins cannot touch founders).
    if old.role::text = 'founder' and coalesce(public.my_role()::text, '') <> 'founder' then
      raise exception 'Only a founder can change a founder''s role';
    end if;
    -- Never leave the workspace without at least one admin/founder.
    if old.role::text in ('admin', 'founder')
       and new.role::text not in ('admin', 'founder')
       and (select count(*) from public.profiles where role::text in ('admin', 'founder')) <= 1 then
      raise exception 'Cannot remove the last admin/founder';
    end if;
  end if;
  if new.id is distinct from old.id or new.email is distinct from old.email then
    raise exception 'id/email cannot be changed';
  end if;
  return new;
end;
$$;
