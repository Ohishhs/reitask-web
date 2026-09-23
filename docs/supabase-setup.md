# ReiTask Supabase Setup

## Required environment

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_ENV`

`SUPABASE_SERVICE_ROLE_KEY` is for server-side administration only. Do not expose it to browser code or commit it.

## Apply migrations

The migrations must be applied in this order:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

The foundation migration creates authentication profiles, organizations, memberships, generic audit support, and base storage policies. The renovation migration adds the operational domain, RLS rules, tenant-integrity triggers, notification triggers, and the private `attachments` bucket.

If the project is not managed with the Supabase CLI, run these files from the SQL editor in order:

1. `supabase/migrations/20260922000000_reitask_v1_foundation.sql`
2. `supabase/migrations/20260922000001_reitask_renovation_domain.sql`

## Create test users

Create at least one Supabase Auth user for each role:

- `admin`
- `operations_manager`
- `contractor`
- `owner`

Add each profile to `public.organization_members` with the correct `organization_id` and role. The application uses membership rows as the authorization source.

For contractor accounts, also set `public.contractors.user_id` to the matching `public.users.id`. This link is required for assigned work-order and progress visibility.

## Run database tests

After linking the project and applying migrations:

```bash
supabase test db
```

The pgTAP checks in `supabase/tests/renovation_schema.sql` verify the core tables and RLS coverage. Role-isolation checks should then be run with the test accounts listed above.

## Verify the workflow

Run the application with real Supabase variables:

```bash
npm run dev
```

Verify the following in separate browser sessions:

- Admin or operations manager can create properties, projects, scope, budgets, contractors, work orders, QC, and punch items.
- Contractor can view assigned work and submit progress and change-order requests.
- Owner can only view permitted property and project information.
- A user cannot read or write another organization's records.
- A project cannot be completed while punch items are open or in progress.
- Uploaded files are stored privately and can only be downloaded through signed URLs.
- Change-order approval, QC failures, punch items, and project status changes create notifications.

## Production checks

```bash
npm run lint
npm run build
npm audit --omit=dev
```

Deploy the application only after the migration has been applied and the role/isolation checks pass against the real Supabase project.
