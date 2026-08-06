-- ============================================================================
-- LUMERA TEAM HUB — Migration 004: birthdays
-- ============================================================================
-- Run ONCE in the Supabase SQL Editor after 001–003. Additive, safe.
--
-- Adds a birthday to each profile. Only month + day are shown in the app
-- (the year is never displayed), so no one's age is revealed.
--
-- No new RLS needed: the existing "profiles_update_self" policy already lets
-- a user edit their own row and lets admins/founders edit anyone's — so you
-- can fill in the whole team's birthdays yourself.
-- ============================================================================

alter table public.profiles add column if not exists birthday date;
