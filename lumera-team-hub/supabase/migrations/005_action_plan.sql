-- ============================================================================
-- LUMERA TEAM HUB — Migration 005: week-by-week Action Plan
-- ============================================================================
-- Run ONCE in the Supabase SQL Editor after 001–004. Additive, safe.
--
-- A schedule of tasks/milestones grouped by week, rendered as a timeline.
-- Whole team can view. Team leads / admins / founder build & manage the plan;
-- the person an item is assigned to can update its status.
-- ============================================================================

create table public.plan_items (
  id          uuid primary key default gen_random_uuid(),
  week_start  date not null,
  title       text not null check (length(title) between 1 and 300),
  description text not null default '',
  category    text not null default 'General',
  owner_id    uuid references public.profiles (id) on delete set null,
  status      text not null default 'planned' check (status in ('planned','in_progress','done')),
  position    integer not null default 0,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index plan_items_week_idx on public.plan_items (week_start, position);

alter table public.plan_items enable row level security;
create trigger plan_items_updated_at before update on public.plan_items
  for each row execute function public.set_updated_at();

create policy "plan_items_select" on public.plan_items for select to authenticated
  using (true);
create policy "plan_items_insert" on public.plan_items for insert to authenticated
  with check (public.is_lead_or_admin() and created_by = (select auth.uid()));
create policy "plan_items_update" on public.plan_items for update to authenticated
  using (public.is_lead_or_admin()
         or created_by = (select auth.uid())
         or owner_id = (select auth.uid()));
create policy "plan_items_delete" on public.plan_items for delete to authenticated
  using (public.is_admin() or created_by = (select auth.uid()));

-- Notify whoever an action-plan item is assigned to.
create or replace function public.notify_plan_assignment()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.owner_id is not null
     and new.owner_id <> coalesce(auth.uid(), new.owner_id)
     and (tg_op = 'INSERT' or new.owner_id is distinct from old.owner_id) then
    insert into public.notifications (user_id, actor_id, type, body, link)
    values (new.owner_id, auth.uid(), 'task_assigned',
            'assigned you an action-plan item: ' || new.title, '/action-plan');
  end if;
  return new;
end;
$$;
create trigger on_plan_assigned
  after insert or update on public.plan_items
  for each row execute function public.notify_plan_assignment();

alter publication supabase_realtime add table public.plan_items;
