begin;

select plan(12);

select ok(to_regclass('public.organizations') is not null, 'organizations table exists');
select ok(to_regclass('public.properties') is not null, 'properties table exists');
select ok(to_regclass('public.projects') is not null, 'projects table exists');
select ok(to_regclass('public.inspections') is not null, 'inspections table exists');
select ok(to_regclass('public.scope_items') is not null, 'scope_items table exists');
select ok(to_regclass('public.budget_items') is not null, 'budget_items table exists');
select ok(to_regclass('public.work_orders') is not null, 'work_orders table exists');
select ok(to_regclass('public.progress_updates') is not null, 'progress_updates table exists');
select ok(to_regclass('public.change_orders') is not null, 'change_orders table exists');
select ok(to_regclass('public.qc_inspections') is not null, 'qc_inspections table exists');
select ok(to_regclass('public.punch_items') is not null, 'punch_items table exists');
select ok(
  (select count(*) = 0
   from pg_class table_record
   join pg_namespace namespace_record on namespace_record.oid = table_record.relnamespace
   where namespace_record.nspname = 'public'
     and table_record.relname in ('inspections', 'scope_items', 'budget_items', 'contractors', 'project_contractors', 'work_orders', 'progress_updates', 'change_orders', 'qc_inspections', 'punch_items')
     and not table_record.relrowsecurity),
  'renovation tables have RLS enabled'
);

select * from finish();
rollback;
