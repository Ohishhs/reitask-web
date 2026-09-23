-- ReiTask renovation operations domain
-- Extends the organization/member foundation without replacing it.

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create type public.renovation_property_type as enum (
  'single_family', 'multi_family', 'commercial', 'townhome', 'condominium', 'other'
);
create type public.renovation_inspection_status as enum ('draft', 'submitted', 'approved', 'rejected');
create type public.renovation_scope_status as enum ('draft', 'approved', 'in_progress', 'completed', 'cancelled');
create type public.renovation_scope_priority as enum ('low', 'normal', 'high', 'critical');
create type public.renovation_contractor_status as enum ('active', 'pending', 'inactive', 'blacklisted');
create type public.renovation_work_order_status as enum ('draft', 'assigned', 'accepted', 'in_progress', 'submitted_for_review', 'qc', 'completed', 'rejected', 'cancelled');
create type public.renovation_change_order_status as enum ('draft', 'submitted', 'approved', 'rejected', 'cancelled');
create type public.renovation_qc_result as enum ('pending', 'pass', 'fail', 'reinspection_required');
create type public.renovation_punch_status as enum ('open', 'in_progress', 'completed', 'cancelled');
create type public.renovation_notification_type as enum ('work_order_assigned', 'progress_update', 'change_order_submitted', 'change_order_approved', 'qc_failed', 'punch_item_open', 'project_status_updated');

alter table public.users add column if not exists name text;
update public.users set name = full_name where name is null;

alter table public.properties
  add column if not exists owner_id uuid references public.users(id) on delete set null,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists postal_code text,
  add column if not exists property_type public.renovation_property_type,
  add column if not exists status text not null default 'ACTIVE';

update public.properties
set address = coalesce(address, nullif(address_line_1, ''), name),
    property_type = coalesce(property_type, 'single_family'::public.renovation_property_type);

alter table public.projects
  add column if not exists start_date date,
  add column if not exists target_completion_date date,
  add column if not exists budget_total numeric(12,2) not null default 0,
  add column if not exists actual_cost numeric(12,2) not null default 0;

alter type public.project_status add value if not exists 'inspection';
alter type public.project_status add value if not exists 'scoping';
alter type public.project_status add value if not exists 'ready_for_work';
alter type public.project_status add value if not exists 'in_progress';
alter type public.project_status add value if not exists 'qc';
alter type public.project_status add value if not exists 'punch_list';

create table public.inspections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  inspector_user_id uuid not null references public.users(id),
  inspection_date date not null default current_date,
  status public.renovation_inspection_status not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inspection_areas (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.inspections(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inspection_issues (
  id uuid primary key default gen_random_uuid(),
  inspection_area_id uuid not null references public.inspection_areas(id) on delete cascade,
  title text not null,
  description text not null,
  severity text not null default 'MEDIUM',
  recommended_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.scope_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  category text not null,
  title text not null,
  description text,
  quantity numeric(10,2) not null default 1,
  unit text,
  labor_estimate numeric(12,2) not null default 0,
  material_estimate numeric(12,2) not null default 0,
  total_estimate numeric(12,2) not null default 0,
  priority public.renovation_scope_priority not null default 'normal',
  status public.renovation_scope_status not null default 'draft',
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  scope_item_id uuid references public.scope_items(id) on delete set null,
  category text not null,
  description text,
  estimated_cost numeric(12,2) not null default 0,
  committed_cost numeric(12,2) not null default 0,
  approved_change_order_cost numeric(12,2) not null default 0,
  actual_cost numeric(12,2) not null default 0,
  remaining_budget numeric(12,2) not null default 0,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contractors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid unique references public.users(id) on delete set null,
  company_name text not null,
  contact_name text,
  email text,
  phone text,
  trades text[] not null default '{}',
  service_area text,
  status public.renovation_contractor_status not null default 'active',
  performance_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_contractors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  contractor_id uuid not null references public.contractors(id) on delete cascade,
  role text not null default 'PRIMARY',
  status text not null default 'ASSIGNED',
  assigned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, contractor_id)
);

create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  project_contractor_id uuid references public.project_contractors(id) on delete set null,
  trade text not null,
  title text not null,
  description text,
  start_date date,
  due_date date,
  status public.renovation_work_order_status not null default 'draft',
  priority text not null default 'NORMAL',
  completion_percentage integer not null default 0 check (completion_percentage between 0 and 100),
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.work_order_scope_items (
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  scope_item_id uuid not null references public.scope_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (work_order_id, scope_item_id)
);

create table public.progress_updates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  contractor_id uuid not null references public.contractors(id),
  submitted_by uuid references public.users(id) on delete set null,
  status_text text not null,
  completion_percentage integer not null default 0 check (completion_percentage between 0 and 100),
  notes text,
  blocker_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.change_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  work_order_id uuid references public.work_orders(id) on delete set null,
  project_id uuid not null references public.projects(id) on delete cascade,
  requested_by uuid not null references public.users(id),
  reason text not null,
  description text not null,
  cost_impact numeric(12,2) not null default 0,
  schedule_impact_days integer not null default 0,
  status public.renovation_change_order_status not null default 'draft',
  approved_by uuid references public.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.qc_inspections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  inspector_user_id uuid not null references public.users(id),
  result public.renovation_qc_result not null default 'pending',
  notes text,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.punch_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  work_order_id uuid references public.work_orders(id) on delete set null,
  description text not null,
  location text,
  assigned_contractor_id uuid references public.contractors(id),
  priority public.renovation_scope_priority not null default 'normal',
  status public.renovation_punch_status not null default 'open',
  due_date date,
  completion_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recipient_user_id uuid not null references public.users(id) on delete cascade,
  type public.renovation_notification_type not null,
  title text not null,
  message text not null,
  related_entity_type text,
  related_entity_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index inspections_project_id_idx on public.inspections(project_id);
create index scope_items_project_id_idx on public.scope_items(project_id);
create index budget_items_project_id_idx on public.budget_items(project_id);
create index project_contractors_project_id_idx on public.project_contractors(project_id);
create index work_orders_project_id_idx on public.work_orders(project_id);
create index work_orders_status_idx on public.work_orders(organization_id, status);
create index progress_updates_work_order_id_idx on public.progress_updates(work_order_id);
create index change_orders_project_id_idx on public.change_orders(project_id);
create index qc_inspections_work_order_id_idx on public.qc_inspections(work_order_id);
create index punch_items_project_id_idx on public.punch_items(project_id);
create index notifications_recipient_idx on public.notifications(recipient_user_id, is_read);

create or replace function public.recalculate_project_budget()
returns trigger
security definer set search_path = public
language plpgsql
as $$
declare
  affected_project_id uuid;
begin
  affected_project_id = coalesce(new.project_id, old.project_id);
  update public.projects
  set budget_total = coalesce((select sum(estimated_cost + approved_change_order_cost) from public.budget_items where project_id = affected_project_id), 0),
      actual_cost = coalesce((select sum(actual_cost) from public.budget_items where project_id = affected_project_id), 0),
      updated_at = now()
  where id = affected_project_id;
  return coalesce(new, old);
end;
$$;

create trigger budget_items_recalculate_project
  after insert or update or delete on public.budget_items
  for each row execute function public.recalculate_project_budget();

create or replace function public.notify_renovation_event()
returns trigger
security definer set search_path = public
language plpgsql
as $$
declare
  recipient record;
  notification_kind public.renovation_notification_type;
  notification_title text;
  notification_message text;
  related_id uuid;
begin
  if tg_table_name = 'change_orders' then
    notification_kind = 'change_order_submitted';
    notification_title = 'Change order submitted';
    notification_message = new.description;
    related_id = new.id;
  elsif tg_table_name = 'qc_inspections' and new.result = 'fail' then
    notification_kind = 'qc_failed';
    notification_title = 'QC inspection failed';
    notification_message = coalesce(new.notes, 'A QC inspection requires attention.');
    related_id = new.id;
  elsif tg_table_name = 'punch_items' then
    notification_kind = 'punch_item_open';
    notification_title = 'Punch item opened';
    notification_message = new.description;
    related_id = new.id;
  elsif tg_table_name = 'projects' and (tg_op = 'INSERT' or new.status is distinct from old.status) then
    notification_kind = 'project_status_updated';
    notification_title = 'Project status updated';
    notification_message = new.name || ' is now ' || new.status::text;
    related_id = new.id;
  else
    return new;
  end if;

  for recipient in
    select user_id from public.organization_members
    where organization_id = new.organization_id
      and role in ('admin', 'operations_manager')
  loop
    insert into public.notifications (
      organization_id, recipient_user_id, type, title, message, related_entity_type, related_entity_id
    ) values (
      new.organization_id, recipient.user_id, notification_kind, notification_title, notification_message, tg_table_name, related_id
    );
  end loop;
  return new;
end;
$$;

create trigger change_orders_notify after insert on public.change_orders
  for each row execute function public.notify_renovation_event();
create trigger qc_inspections_notify after insert or update on public.qc_inspections
  for each row execute function public.notify_renovation_event();
create trigger punch_items_notify after insert on public.punch_items
  for each row execute function public.notify_renovation_event();
create trigger projects_notify after insert or update on public.projects
  for each row execute function public.notify_renovation_event();

create or replace function public.validate_renovation_organization()
returns trigger
security definer set search_path = public
language plpgsql
as $$
declare
  linked_organization_id uuid;
begin
  if tg_table_name = 'inspections' then
    select organization_id into linked_organization_id from public.projects where id = new.project_id;
  elsif tg_table_name in ('scope_items', 'budget_items', 'change_orders', 'qc_inspections', 'punch_items') then
    select organization_id into linked_organization_id from public.projects where id = new.project_id;
  elsif tg_table_name = 'project_contractors' then
    select organization_id into linked_organization_id from public.projects where id = new.project_id;
    if linked_organization_id is distinct from new.organization_id then
      raise exception 'Project and record must belong to the same organization';
    end if;
    select organization_id into linked_organization_id from public.contractors where id = new.contractor_id;
  elsif tg_table_name = 'work_orders' then
    select organization_id into linked_organization_id from public.projects where id = new.project_id;
    if linked_organization_id is distinct from new.organization_id then
      raise exception 'Project and work order must belong to the same organization';
    end if;
    if new.project_contractor_id is not null and not exists (
      select 1 from public.project_contractors assignment
      where assignment.id = new.project_contractor_id
        and assignment.project_id = new.project_id
        and assignment.organization_id = new.organization_id
    ) then
      raise exception 'Work order assignment must belong to its project and organization';
    end if;
    return new;
  elsif tg_table_name = 'progress_updates' then
    select organization_id into linked_organization_id from public.work_orders where id = new.work_order_id;
    if linked_organization_id is distinct from new.organization_id then
      raise exception 'Work order and progress update must belong to the same organization';
    end if;
    if not exists (select 1 from public.contractors where id = new.contractor_id and organization_id = new.organization_id) then
      raise exception 'Progress contractor must belong to the same organization';
    end if;
    return new;
  end if;

  if tg_table_name in ('change_orders', 'qc_inspections', 'punch_items')
     and new.work_order_id is not null
     and not exists (
       select 1 from public.work_orders work_order
       where work_order.id = new.work_order_id
         and work_order.project_id = new.project_id
         and work_order.organization_id = new.organization_id
     ) then
    raise exception 'Work order must belong to the same project and organization';
  end if;

  if linked_organization_id is distinct from new.organization_id then
    raise exception 'Linked record must belong to the same organization';
  end if;
  return new;
end;
$$;

create trigger inspections_validate_organization before insert or update on public.inspections
  for each row execute function public.validate_renovation_organization();
create trigger scope_items_validate_organization before insert or update on public.scope_items
  for each row execute function public.validate_renovation_organization();
create trigger budget_items_validate_organization before insert or update on public.budget_items
  for each row execute function public.validate_renovation_organization();
create trigger project_contractors_validate_organization before insert or update on public.project_contractors
  for each row execute function public.validate_renovation_organization();
create trigger work_orders_validate_organization before insert or update on public.work_orders
  for each row execute function public.validate_renovation_organization();
create trigger progress_updates_validate_organization before insert or update on public.progress_updates
  for each row execute function public.validate_renovation_organization();
create trigger change_orders_validate_organization before insert or update on public.change_orders
  for each row execute function public.validate_renovation_organization();
create trigger qc_inspections_validate_organization before insert or update on public.qc_inspections
  for each row execute function public.validate_renovation_organization();
create trigger punch_items_validate_organization before insert or update on public.punch_items
  for each row execute function public.validate_renovation_organization();

create or replace function public.validate_scope_link_organization()
returns trigger
security definer set search_path = public
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.work_orders work_order
    join public.scope_items scope_item on scope_item.project_id = work_order.project_id
    where work_order.id = new.work_order_id
      and scope_item.id = new.scope_item_id
  ) then
    raise exception 'Scope item must belong to the work order project';
  end if;
  return new;
end;
$$;

create trigger work_order_scope_items_validate_project before insert or update on public.work_order_scope_items
  for each row execute function public.validate_scope_link_organization();

create or replace function public.prevent_incomplete_project_closeout()
returns trigger
security definer set search_path = public
language plpgsql
as $$
begin
  if new.status = 'completed'
     and exists (
       select 1 from public.punch_items
       where project_id = new.id
         and status in ('open', 'in_progress')
     ) then
    raise exception 'Project cannot be completed while punch items remain open';
  end if;
  return new;
end;
$$;

create trigger projects_prevent_incomplete_closeout before update on public.projects
  for each row when (new.status is distinct from old.status)
  execute function public.prevent_incomplete_project_closeout();

create or replace function public.prevent_punch_after_project_closeout()
returns trigger
security definer set search_path = public
language plpgsql
as $$
begin
  if new.status in ('open', 'in_progress')
     and exists (select 1 from public.projects where id = new.project_id and status = 'completed') then
    raise exception 'Open punch items cannot be added to a completed project';
  end if;
  return new;
end;
$$;

create trigger punch_items_prevent_post_closeout before insert or update on public.punch_items
  for each row execute function public.prevent_punch_after_project_closeout();

-- Every renovation record is tenant-scoped. Roles are resolved through the existing membership functions.
do $$
declare
  table_name text;
  read_condition text;
begin
  foreach table_name in array array['inspections','scope_items','budget_items','contractors','project_contractors','work_orders','progress_updates','change_orders','qc_inspections','punch_items'] loop
    execute format('alter table public.%I enable row level security', table_name);
    read_condition := 'public.current_user_can_manage(organization_id)';
    if table_name = 'contractors' then
      read_condition := read_condition || ' or contractors.user_id = auth.uid()';
    elsif table_name = 'progress_updates' then
      read_condition := read_condition || ' or exists (select 1 from public.contractors contractor where contractor.id = progress_updates.contractor_id and contractor.user_id = auth.uid()) or exists (select 1 from public.work_orders work_order join public.projects project on project.id = work_order.project_id join public.properties property on property.id = project.property_id where work_order.id = progress_updates.work_order_id and property.owner_id = auth.uid())';
    elsif table_name = 'work_orders' then
      read_condition := read_condition || ' or exists (select 1 from public.project_contractors assignment join public.contractors contractor on contractor.id = assignment.contractor_id where assignment.id = work_orders.project_contractor_id and contractor.user_id = auth.uid()) or exists (select 1 from public.projects project join public.properties property on property.id = project.property_id where project.id = work_orders.project_id and property.owner_id = auth.uid())';
    elsif table_name = 'change_orders' then
      read_condition := read_condition || ' or exists (select 1 from public.work_orders work_order join public.project_contractors assignment on assignment.id = work_order.project_contractor_id join public.contractors contractor on contractor.id = assignment.contractor_id where work_order.id = change_orders.work_order_id and contractor.user_id = auth.uid()) or exists (select 1 from public.projects project join public.properties property on property.id = project.property_id where project.id = change_orders.project_id and property.owner_id = auth.uid())';
    elsif table_name = 'qc_inspections' then
      read_condition := read_condition || ' or exists (select 1 from public.work_orders work_order join public.project_contractors assignment on assignment.id = work_order.project_contractor_id join public.contractors contractor on contractor.id = assignment.contractor_id where work_order.id = qc_inspections.work_order_id and contractor.user_id = auth.uid()) or exists (select 1 from public.projects project join public.properties property on property.id = project.property_id where project.id = qc_inspections.project_id and property.owner_id = auth.uid())';
    elsif table_name = 'punch_items' then
      read_condition := read_condition || ' or exists (select 1 from public.contractors contractor where contractor.id = punch_items.assigned_contractor_id and contractor.user_id = auth.uid()) or exists (select 1 from public.projects project join public.properties property on property.id = project.property_id where project.id = punch_items.project_id and property.owner_id = auth.uid())';
    elsif table_name = 'budget_items' then
      read_condition := read_condition || ' or exists (select 1 from public.projects project join public.properties property on property.id = project.property_id where project.id = budget_items.project_id and property.owner_id = auth.uid())';
    else
      read_condition := read_condition || ' or exists (select 1 from public.projects project join public.properties property on property.id = project.property_id where project.id = ' || table_name || '.project_id and property.owner_id = auth.uid())';
    end if;
    execute format('create policy %I on public.%I for select to authenticated using (%s)', table_name || '_member_read', table_name, read_condition);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.current_user_can_manage(organization_id))', table_name || '_manager_insert', table_name);
    execute format('create policy %I on public.%I for update to authenticated using (public.current_user_can_manage(organization_id)) with check (public.current_user_can_manage(organization_id))', table_name || '_manager_update', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using (public.current_user_can_manage(organization_id))', table_name || '_manager_delete', table_name);
  end loop;
end $$;

alter table public.notifications enable row level security;
create policy notifications_recipient_read on public.notifications for select to authenticated using (recipient_user_id = auth.uid());
create policy notifications_manager_read on public.notifications for select to authenticated using (public.current_user_can_manage(organization_id));

alter table public.inspection_areas enable row level security;
alter table public.inspection_issues enable row level security;
alter table public.work_order_scope_items enable row level security;

create policy inspection_areas_member_read on public.inspection_areas for select to authenticated using (exists (select 1 from public.inspections where id = inspection_id and public.is_org_member(organization_id)));
create policy inspection_areas_manager_insert on public.inspection_areas for insert to authenticated with check (exists (select 1 from public.inspections where id = inspection_id and public.current_user_can_manage(organization_id)));
create policy inspection_areas_manager_update on public.inspection_areas for update to authenticated using (exists (select 1 from public.inspections where id = inspection_id and public.current_user_can_manage(organization_id))) with check (exists (select 1 from public.inspections where id = inspection_id and public.current_user_can_manage(organization_id)));
create policy inspection_areas_manager_delete on public.inspection_areas for delete to authenticated using (exists (select 1 from public.inspections where id = inspection_id and public.current_user_can_manage(organization_id)));
create policy inspection_issues_member_read on public.inspection_issues for select to authenticated using (exists (select 1 from public.inspection_areas area join public.inspections inspection on inspection.id = area.inspection_id where area.id = inspection_area_id and public.is_org_member(inspection.organization_id)));
create policy inspection_issues_manager_insert on public.inspection_issues for insert to authenticated with check (exists (select 1 from public.inspection_areas area join public.inspections inspection on inspection.id = area.inspection_id where area.id = inspection_area_id and public.current_user_can_manage(inspection.organization_id)));
create policy inspection_issues_manager_update on public.inspection_issues for update to authenticated using (exists (select 1 from public.inspection_areas area join public.inspections inspection on inspection.id = area.inspection_id where area.id = inspection_area_id and public.current_user_can_manage(inspection.organization_id))) with check (exists (select 1 from public.inspection_areas area join public.inspections inspection on inspection.id = area.inspection_id where area.id = inspection_area_id and public.current_user_can_manage(inspection.organization_id)));
create policy inspection_issues_manager_delete on public.inspection_issues for delete to authenticated using (exists (select 1 from public.inspection_areas area join public.inspections inspection on inspection.id = area.inspection_id where area.id = inspection_area_id and public.current_user_can_manage(inspection.organization_id)));
create policy work_order_scope_items_member_read on public.work_order_scope_items for select to authenticated using (exists (select 1 from public.work_orders where id = work_order_id and public.is_org_member(organization_id)));
create policy work_order_scope_items_manager_insert on public.work_order_scope_items for insert to authenticated with check (exists (select 1 from public.work_orders where id = work_order_id and public.current_user_can_manage(organization_id)));
create policy work_order_scope_items_manager_delete on public.work_order_scope_items for delete to authenticated using (exists (select 1 from public.work_orders where id = work_order_id and public.current_user_can_manage(organization_id)));
create policy change_orders_member_request on public.change_orders for insert to authenticated with check (public.is_org_member(organization_id) and requested_by = auth.uid());
create policy notifications_recipient_mark_read on public.notifications for update to authenticated
  using (recipient_user_id = auth.uid())
  with check (recipient_user_id = auth.uid());
create policy progress_updates_member_submit on public.progress_updates for insert to authenticated with check (
  submitted_by = auth.uid()
  and public.has_org_role(organization_id, array['admin', 'operations_manager', 'contractor']::public.organization_member_role[])
);

comment on table public.change_orders is 'Change orders supplement approved scope and never mutate the original scope record.';
comment on table public.notifications is 'In-app notification feed for renovation workflow events.';
