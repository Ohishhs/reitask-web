-- ReiTask V1 database foundation
--
-- Supabase owns auth.users. public.users is the application profile and is
-- intentionally separate from authentication. Tenant access is granted only
-- through organization_members.

create extension if not exists pgcrypto;

create type public.organization_member_role as enum (
  'admin',
  'operations_manager',
  'contractor',
  'owner'
);

create type public.organization_status as enum ('active', 'suspended');
create type public.task_status as enum ('backlog', 'todo', 'in_progress', 'blocked', 'completed', 'cancelled');
create type public.task_priority as enum ('low', 'normal', 'high', 'urgent');
create type public.project_status as enum ('planning', 'active', 'on_hold', 'completed', 'cancelled');
create type public.audit_action as enum ('insert', 'update', 'delete');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status public.organization_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One profile per Supabase Auth identity. Do not insert directly from clients.
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '' check (length(full_name) <= 160),
  avatar_url text check (avatar_url is null or length(avatar_url) <= 2048),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.organization_member_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 200),
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  name text not null check (length(trim(name)) between 1 and 200),
  address_line_1 text,
  address_line_2 text,
  city text,
  state text,
  postal_code text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  name text not null check (length(trim(name)) between 1 and 200),
  description text,
  status public.project_status not null default 'planning',
  starts_on date,
  due_on date,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (due_on is null or starts_on is null or due_on >= starts_on)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  title text not null check (length(trim(title)) between 1 and 240),
  description text,
  status public.task_status not null default 'backlog',
  priority public.task_priority not null default 'normal',
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'completed') = (completed_at is not null))
);

create table public.task_assignees (
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  assigned_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (task_id, user_id)
);

create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete restrict,
  body text not null check (length(trim(body)) between 1 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  uploaded_by uuid not null references public.users(id) on delete restrict,
  bucket_id text not null default 'attachments' check (bucket_id = 'attachments'),
  storage_path text not null check (length(trim(storage_path)) between 1 and 1024),
  file_name text not null check (length(trim(file_name)) between 1 and 255),
  content_type text,
  byte_size bigint check (byte_size is null or byte_size >= 0),
  created_at timestamptz not null default now(),
  check (task_id is not null or project_id is not null),
  unique (bucket_id, storage_path)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations(id) on delete set null,
  actor_id uuid references public.users(id) on delete set null,
  table_name text not null,
  record_id uuid,
  action public.audit_action not null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index organization_members_user_id_idx on public.organization_members (user_id);
create index clients_organization_id_idx on public.clients (organization_id);
create index properties_organization_id_idx on public.properties (organization_id);
create index properties_client_id_idx on public.properties (client_id);
create index projects_organization_id_status_idx on public.projects (organization_id, status);
create index tasks_organization_id_status_idx on public.tasks (organization_id, status);
create index tasks_project_id_idx on public.tasks (project_id);
create index tasks_due_at_idx on public.tasks (organization_id, due_at) where status not in ('completed', 'cancelled');
create index task_assignees_user_id_idx on public.task_assignees (user_id);
create index task_comments_task_id_created_at_idx on public.task_comments (task_id, created_at);
create index attachments_organization_id_idx on public.attachments (organization_id);
create index audit_logs_organization_id_created_at_idx on public.audit_logs (organization_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_set_updated_at before update on public.organizations
for each row execute function public.set_updated_at();
create trigger users_set_updated_at before update on public.users
for each row execute function public.set_updated_at();
create trigger organization_members_set_updated_at before update on public.organization_members
for each row execute function public.set_updated_at();
create trigger clients_set_updated_at before update on public.clients
for each row execute function public.set_updated_at();
create trigger properties_set_updated_at before update on public.properties
for each row execute function public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects
for each row execute function public.set_updated_at();
create trigger tasks_set_updated_at before update on public.tasks
for each row execute function public.set_updated_at();
create trigger task_comments_set_updated_at before update on public.task_comments
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
security definer set search_path = public
language plpgsql
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_org_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = target_organization_id and user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(
  target_organization_id uuid,
  allowed_roles public.organization_member_role[]
)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = target_organization_id
      and user_id = auth.uid()
      and role = any (allowed_roles)
  );
$$;

create or replace function public.current_user_can_manage(target_organization_id uuid)
returns boolean
language sql
stable
as $$
  select public.has_org_role(target_organization_id, array['admin', 'operations_manager']::public.organization_member_role[]);
$$;

create or replace function public.audit_row_change()
returns trigger
security definer set search_path = public
language plpgsql
as $$
declare
  organization_value uuid;
  record_value uuid;
begin
  if tg_op = 'DELETE' then
    record_value := old.id;
    organization_value := old.organization_id;
  else
    record_value := new.id;
    organization_value := new.organization_id;
  end if;
  insert into public.audit_logs (organization_id, actor_id, table_name, record_id, action, old_data, new_data)
  values (
    organization_value,
    auth.uid(),
    tg_table_name,
    record_value,
    lower(tg_op)::public.audit_action,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

create trigger clients_audit after insert or update or delete on public.clients
for each row execute function public.audit_row_change();
create trigger properties_audit after insert or update or delete on public.properties
for each row execute function public.audit_row_change();
create trigger projects_audit after insert or update or delete on public.projects
for each row execute function public.audit_row_change();
create trigger tasks_audit after insert or update or delete on public.tasks
for each row execute function public.audit_row_change();

-- Cross-tenant foreign keys cannot be expressed with the simple column FKs above.
-- These checks reject mismatched organization references at write time.
create or replace function public.validate_same_organization()
returns trigger
language plpgsql
as $$
begin
  if tg_table_name = 'projects' and new.client_id is not null and not exists (
    select 1 from public.clients where id = new.client_id and organization_id = new.organization_id
  ) then raise exception 'client does not belong to organization'; end if;
  if tg_table_name = 'projects' and new.property_id is not null and not exists (
    select 1 from public.properties where id = new.property_id and organization_id = new.organization_id
  ) then raise exception 'property does not belong to organization'; end if;
  if tg_table_name = 'tasks' and new.project_id is not null and not exists (
    select 1 from public.projects where id = new.project_id and organization_id = new.organization_id
  ) then raise exception 'project does not belong to organization'; end if;
  if tg_table_name = 'tasks' and new.property_id is not null and not exists (
    select 1 from public.properties where id = new.property_id and organization_id = new.organization_id
  ) then raise exception 'property does not belong to organization'; end if;
  if tg_table_name = 'attachments' and new.task_id is not null and not exists (
    select 1 from public.tasks where id = new.task_id and organization_id = new.organization_id
  ) then raise exception 'task does not belong to organization'; end if;
  if tg_table_name = 'attachments' and new.project_id is not null and not exists (
    select 1 from public.projects where id = new.project_id and organization_id = new.organization_id
  ) then raise exception 'project does not belong to organization'; end if;
  return new;
end;
$$;

create trigger projects_validate_organization before insert or update on public.projects
for each row execute function public.validate_same_organization();
create trigger tasks_validate_organization before insert or update on public.tasks
for each row execute function public.validate_same_organization();
create trigger attachments_validate_organization before insert or update on public.attachments
for each row execute function public.validate_same_organization();

alter table public.organizations enable row level security;
alter table public.users enable row level security;
alter table public.organization_members enable row level security;
alter table public.clients enable row level security;
alter table public.properties enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.task_comments enable row level security;
alter table public.attachments enable row level security;
alter table public.audit_logs enable row level security;

create policy users_select_self_or_member on public.users for select to authenticated
using (id = auth.uid() or exists (
  select 1 from public.organization_members viewer
  join public.organization_members target on target.organization_id = viewer.organization_id
  where viewer.user_id = auth.uid() and target.user_id = users.id
));
create policy users_update_self on public.users for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

create policy organizations_select_member on public.organizations for select to authenticated
using (public.is_org_member(id));
create policy organizations_update_admin on public.organizations for update to authenticated
using (public.has_org_role(id, array['admin']::public.organization_member_role[]))
with check (public.has_org_role(id, array['admin']::public.organization_member_role[]));

create policy members_select_same_org on public.organization_members for select to authenticated
using (public.is_org_member(organization_id));
create policy members_manage_admin on public.organization_members for all to authenticated
using (public.has_org_role(organization_id, array['admin']::public.organization_member_role[]))
with check (public.has_org_role(organization_id, array['admin']::public.organization_member_role[]));

create policy clients_member_access on public.clients for select to authenticated using (public.is_org_member(organization_id));
create policy clients_manager_write on public.clients for all to authenticated
using (public.current_user_can_manage(organization_id)) with check (public.current_user_can_manage(organization_id));
create policy properties_member_access on public.properties for select to authenticated using (public.is_org_member(organization_id));
create policy properties_manager_write on public.properties for all to authenticated
using (public.current_user_can_manage(organization_id)) with check (public.current_user_can_manage(organization_id));
create policy projects_member_access on public.projects for select to authenticated using (public.is_org_member(organization_id));
create policy projects_manager_write on public.projects for all to authenticated
using (public.current_user_can_manage(organization_id)) with check (public.current_user_can_manage(organization_id));

create policy tasks_member_access on public.tasks for select to authenticated using (public.is_org_member(organization_id));
create policy tasks_manager_write on public.tasks for insert to authenticated
with check (public.current_user_can_manage(organization_id));
create policy tasks_manager_update on public.tasks for update to authenticated
using (public.current_user_can_manage(organization_id)) with check (public.current_user_can_manage(organization_id));
create policy tasks_assignee_update on public.tasks for update to authenticated
using (
  exists (select 1 from public.task_assignees where task_id = tasks.id and user_id = auth.uid())
  and public.is_org_member(organization_id)
)
with check (public.is_org_member(organization_id));
create policy tasks_manager_delete on public.tasks for delete to authenticated
using (public.has_org_role(organization_id, array['admin']::public.organization_member_role[]));
create policy task_assignees_member_access on public.task_assignees for select to authenticated using (
  exists (select 1 from public.tasks where id = task_id and public.is_org_member(organization_id))
);
create policy task_assignees_manager_write on public.task_assignees for all to authenticated using (
  exists (select 1 from public.tasks where id = task_id and public.current_user_can_manage(organization_id))
) with check (
  exists (select 1 from public.tasks where id = task_id and public.current_user_can_manage(organization_id))
);

create policy task_comments_member_access on public.task_comments for select to authenticated using (
  exists (select 1 from public.tasks where id = task_id and public.is_org_member(organization_id))
);
create policy task_comments_member_create on public.task_comments for insert to authenticated with check (
  author_id = auth.uid() and exists (select 1 from public.tasks where id = task_id and public.is_org_member(organization_id))
);
create policy task_comments_author_update on public.task_comments for update to authenticated
using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy task_comments_author_delete on public.task_comments for delete to authenticated using (author_id = auth.uid());

create policy attachments_member_access on public.attachments for select to authenticated using (public.is_org_member(organization_id));
create policy attachments_member_create on public.attachments for insert to authenticated with check (
  uploaded_by = auth.uid() and public.is_org_member(organization_id)
);
create policy attachments_uploader_delete on public.attachments for delete to authenticated using (
  uploaded_by = auth.uid() or public.current_user_can_manage(organization_id)
);

-- Audit records are append-only from triggers and never writable by clients.
create policy audit_logs_member_read on public.audit_logs for select to authenticated using (public.is_org_member(organization_id));

-- Storage object access mirrors attachment metadata. Create the bucket in the
-- Supabase dashboard or storage migration if it is not already provisioned.
create policy attachments_storage_read on storage.objects for select to authenticated using (
  bucket_id = 'attachments' and public.is_org_member((storage.foldername(name))[1]::uuid)
);
create policy attachments_storage_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'attachments' and public.is_org_member((storage.foldername(name))[1]::uuid)
);
create policy attachments_storage_delete on storage.objects for delete to authenticated using (
  bucket_id = 'attachments' and public.is_org_member((storage.foldername(name))[1]::uuid)
);

-- Development seed: creates a demo organization and sample records only when
-- at least one Auth user already exists. No fake auth.users rows are created.
do $$
declare
  seed_org uuid := '00000000-0000-0000-0000-000000000001';
  seed_user uuid;
  seed_client uuid := '00000000-0000-0000-0000-000000000002';
  seed_property uuid := '00000000-0000-0000-0000-000000000003';
  seed_project uuid := '00000000-0000-0000-0000-000000000004';
begin
  insert into public.organizations (id, name, slug)
  values (seed_org, 'ReiTask Development', 'reitask-development')
  on conflict (id) do nothing;

  insert into public.clients (id, organization_id, name, notes)
  values (seed_client, seed_org, 'Sample Client', 'Development seed record')
  on conflict (id) do nothing;
  insert into public.properties (id, organization_id, client_id, name, city, state)
  values (seed_property, seed_org, seed_client, 'Sample Property', 'Austin', 'TX')
  on conflict (id) do nothing;
  insert into public.projects (id, organization_id, client_id, property_id, name, status)
  values (seed_project, seed_org, seed_client, seed_property, 'Sample Project', 'active')
  on conflict (id) do nothing;

  select id into seed_user from auth.users order by created_at limit 1;
  if seed_user is not null then
    insert into public.users (id, email, full_name)
    select id, coalesce(email, ''), coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name', '')
    from auth.users where id = seed_user
    on conflict (id) do nothing;
    insert into public.organization_members (organization_id, user_id, role)
    values (seed_org, seed_user, 'admin')
    on conflict (organization_id, user_id) do nothing;
  end if;
end;
$$;

comment on table public.users is 'Application profile; authentication identity is owned by auth.users.';
comment on table public.organization_members is 'The only tenant membership and role source for application authorization.';
comment on table public.attachments is 'Metadata for objects stored in the private attachments bucket.';
comment on table public.audit_logs is 'Append-only record of protected business-data changes.';