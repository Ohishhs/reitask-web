-- ReiTask V1 PostgreSQL Blueprint
-- This schema is intentionally relational and operationally focused.
-- It is designed to support the core renovation lifecycle:
-- Property -> Project -> Inspection -> Scope -> Budget -> Contractor -> Work Order -> Progress -> Change Order -> QC -> Punch List -> Completion

create extension if not exists pgcrypto;

create type user_role as enum (
  'ADMIN',
  'OPERATIONS_MANAGER',
  'CONTRACTOR',
  'OWNER'
);

create type user_status as enum (
  'ACTIVE',
  'INVITED',
  'INACTIVE',
  'SUSPENDED'
);

create type property_type as enum (
  'SINGLE_FAMILY',
  'MULTI_FAMILY',
  'COMMERCIAL',
  'TOWNHOME',
  'CONDOMINIUM',
  'OTHER'
);

create type project_status as enum (
  'PLANNING',
  'INSPECTION',
  'SCOPING',
  'READY_FOR_WORK',
  'IN_PROGRESS',
  'QC',
  'PUNCH_LIST',
  'COMPLETED',
  'ON_HOLD',
  'CANCELLED'
);

create type inspection_status as enum (
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED'
);

create type scope_priority as enum (
  'LOW',
  'NORMAL',
  'HIGH',
  'CRITICAL'
);

create type scope_status as enum (
  'DRAFT',
  'APPROVED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
);

create type contractor_status as enum (
  'ACTIVE',
  'PENDING',
  'INACTIVE',
  'BLACKLISTED'
);

create type work_order_status as enum (
  'DRAFT',
  'ASSIGNED',
  'ACCEPTED',
  'IN_PROGRESS',
  'SUBMITTED_FOR_REVIEW',
  'QC',
  'COMPLETED',
  'REJECTED',
  'CANCELLED'
);

create type change_order_status as enum (
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'CANCELLED'
);

create type qc_result as enum (
  'PENDING',
  'PASS',
  'FAIL',
  'REINSPECTION_REQUIRED'
);

create type punch_status as enum (
  'OPEN',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
);

create type notification_type as enum (
  'WORK_ORDER_ASSIGNED',
  'PROGRESS_UPDATE',
  'CHANGE_ORDER_SUBMITTED',
  'CHANGE_ORDER_APPROVED',
  'QC_FAILED',
  'PUNCH_ITEM_OPEN',
  'PROJECT_STATUS_UPDATED'
);

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  role user_role not null,
  status user_status not null default 'ACTIVE',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, email)
);

create table properties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  owner_id uuid references users(id),
  address text not null,
  city text not null,
  state text not null,
  postal_code text,
  property_type property_type not null default 'SINGLE_FAMILY',
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  name text not null,
  status project_status not null default 'PLANNING',
  start_date date,
  target_completion_date date,
  budget_total numeric(12,2) default 0,
  actual_cost numeric(12,2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table inspections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  inspector_user_id uuid not null references users(id),
  inspection_date date not null,
  status inspection_status not null default 'DRAFT',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table inspection_areas (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references inspections(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table inspection_issues (
  id uuid primary key default gen_random_uuid(),
  inspection_area_id uuid not null references inspection_areas(id) on delete cascade,
  title text not null,
  description text not null,
  severity text not null default 'MEDIUM',
  recommended_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table scope_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  category text not null,
  title text not null,
  description text,
  quantity numeric(10,2) default 1,
  unit text,
  labor_estimate numeric(12,2) default 0,
  material_estimate numeric(12,2) default 0,
  total_estimate numeric(12,2) default 0,
  priority scope_priority not null default 'NORMAL',
  status scope_status not null default 'DRAFT',
  created_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table budget_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  scope_item_id uuid references scope_items(id) on delete set null,
  category text not null,
  description text,
  estimated_cost numeric(12,2) default 0,
  committed_cost numeric(12,2) default 0,
  approved_change_order_cost numeric(12,2) default 0,
  actual_cost numeric(12,2) default 0,
  remaining_budget numeric(12,2) default 0,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table contractors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  company_name text not null,
  contact_name text,
  email text,
  phone text,
  trades text[] default '{}',
  service_area text,
  status contractor_status not null default 'ACTIVE',
  performance_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table project_contractors (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  contractor_id uuid not null references contractors(id) on delete cascade,
  role text not null default 'PRIMARY',
  status text not null default 'ASSIGNED',
  assigned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, contractor_id)
);

create table work_orders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  project_contractor_id uuid references project_contractors(id) on delete set null,
  trade text not null,
  title text not null,
  description text,
  start_date date,
  due_date date,
  status work_order_status not null default 'DRAFT',
  priority text not null default 'NORMAL',
  completion_percentage integer not null default 0 check (completion_percentage between 0 and 100),
  created_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table work_order_scope_items (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references work_orders(id) on delete cascade,
  scope_item_id uuid not null references scope_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (work_order_id, scope_item_id)
);

create table progress_updates (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references work_orders(id) on delete cascade,
  contractor_id uuid not null references contractors(id),
  status_text text not null,
  completion_percentage integer not null default 0 check (completion_percentage between 0 and 100),
  notes text,
  blocker_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table change_orders (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid references work_orders(id) on delete set null,
  project_id uuid not null references projects(id) on delete cascade,
  requested_by uuid not null references users(id),
  reason text not null,
  description text not null,
  cost_impact numeric(12,2) default 0,
  schedule_impact_days integer default 0,
  status change_order_status not null default 'DRAFT',
  approved_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz
);

create table qc_inspections (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references work_orders(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  inspector_user_id uuid not null references users(id),
  result qc_result not null default 'PENDING',
  notes text,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table punch_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  work_order_id uuid references work_orders(id) on delete set null,
  description text not null,
  location text,
  assigned_contractor_id uuid references contractors(id),
  priority scope_priority not null default 'NORMAL',
  status punch_status not null default 'OPEN',
  due_date date,
  completion_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  recipient_user_id uuid not null references users(id) on delete cascade,
  type notification_type not null,
  title text not null,
  message text not null,
  related_entity_type text,
  related_entity_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  actor_user_id uuid references users(id),
  previous_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now(),
  ip_address inet
);

create table attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  work_order_id uuid references work_orders(id) on delete cascade,
  inspection_id uuid references inspections(id) on delete cascade,
  change_order_id uuid references change_orders(id) on delete cascade,
  storage_bucket text not null,
  storage_path text not null,
  file_name text not null,
  file_type text,
  file_size bigint,
  uploaded_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_users_organization on users(organization_id);
create index idx_properties_organization on properties(organization_id);
create index idx_projects_property on projects(property_id);
create index idx_projects_status on projects(status);
create index idx_inspections_project on inspections(project_id);
create index idx_scope_items_project on scope_items(project_id);
create index idx_budget_items_project on budget_items(project_id);
create index idx_project_contractors_project on project_contractors(project_id);
create index idx_work_orders_project on work_orders(project_id);
create index idx_work_orders_status on work_orders(status);
create index idx_progress_updates_work_order on progress_updates(work_order_id);
create index idx_change_orders_project on change_orders(project_id);
create index idx_change_orders_status on change_orders(status);
create index idx_qc_inspections_work_order on qc_inspections(work_order_id);
create index idx_punch_items_project on punch_items(project_id);
create index idx_notifications_recipient on notifications(recipient_user_id, is_read);
create index idx_audit_logs_entity on audit_logs(entity_type, entity_id);

-- Supabase RLS notes:
-- 1. Enable RLS on all tables.
-- 2. Create policies by organization_id and by role.
-- 3. Restrict contractor access to only assigned work orders and project scope.
-- 4. Restrict owner access to owned properties and approved project data.
-- 5. Keep admin/operations policies broad within the organization.
-- 6. Enforce audits for budget, scope, and approval-changing events.

-- Example policy pattern (not a complete policy set):
-- alter table projects enable row level security;
-- create policy "org_members_can_read_projects" on projects
--   for select using (organization_id = auth.jwt() ->> 'organization_id');

-- end
