# ReiTask V1 — Technical Architecture Blueprint

## 1. Executive architecture decision

ReiTask V1 should be built as a web-first monolith with a single application layer and a relational database.

Recommended stack:

- Frontend: Next.js + TypeScript + Tailwind CSS
- Database: PostgreSQL
- Auth + access control: Supabase Auth + Row-Level Security
- Storage: Supabase Storage
- Hosting: Vercel for app, Supabase for data and storage
- Notifications: in-app notifications in V1; email later

This is the right V1 shape because the product risk is not technical complexity; it is operational reliability. The immediate challenge is to move a renovation from property → inspection → scope → contractor → work order → execution → QC → completion without breaking the record or budget trail. The system should optimize for clarity, permissions, and workflow continuity rather than service sprawl.

---

## 2. Core system model

The system should treat the renovation as a single operational chain, not as a loose collection of modules.

```text
USER
├── Admin / Operations Manager
├── Contractor
└── Property Owner
    │
    ▼
PROPERTY
    │
    ▼
PROJECT
├── INSPECTION
│   │
│   ▼
│   INSPECTION AREAS
│       │
│       ▼
│   ISSUES
│       │
│       ▼
│   RECOMMENDED WORK
│
├── SCOPE OF WORK
│   │
│   ▼
│   SCOPE ITEMS
│
├── BUDGET
│   │
│   ▼
│   BUDGET ITEMS
│
├── CONTRACTORS
│   │
│   ▼
│   PROJECT ASSIGNMENTS
│
▼
WORK ORDER
    │
    ▼
EXECUTION
├── Progress Updates
├── Change Orders
├── QC
├── Punch List
└── Completion
    │
    ▼
CONTRACTOR PERFORMANCE
```

Important rules:

- Property is not the same as Project.
- Scope is not the same as a work order.
- Change orders do not replace the original scope; they supplement it.
- Performance analytics are downstream of operational records.

---

## 3. Core entities

### Organization

An organization owns the operational workspace and is the tenant boundary for the app.

Fields:

- id
- name
- slug
- status
- created_at
- updated_at

Relationships:

- one organization has many users
- one organization has many properties
- one organization has many projects
- one organization has many contractors

### User

```text
User
├── id
├── organization_id
├── name
├── email
├── phone
├── role
├── status
├── created_at
└── updated_at
```

Roles:

- ADMIN
- OPERATIONS_MANAGER
- CONTRACTOR
- OWNER

V1 should simplify the UI so Admin and Operations Manager share nearly all permissions.

### Property

```text
Property
├── id
├── organization_id
├── owner_id
├── address
├── city
├── state
├── postal_code
├── property_type
├── status
├── created_at
└── updated_at
```

A property can have multiple projects over time. A property is the asset; a project is the work engagement.

### Project

```text
Project
├── id
├── organization_id
├── property_id
├── name
├── status
├── start_date
├── target_completion_date
├── budget_total
├── actual_cost
├── created_at
└── updated_at
```

Status enum:

- PLANNING
- INSPECTION
- SCOPING
- READY_FOR_WORK
- IN_PROGRESS
- QC
- PUNCH_LIST
- COMPLETED
- ON_HOLD
- CANCELLED

This becomes the project state machine.

---

## 4. Inspection and scope model

### Inspection

```text
Inspection
├── id
├── project_id
├── inspector_user_id
├── inspection_date
├── status
├── notes
├── created_at
└── updated_at
```

### InspectionArea

```text
InspectionArea
├── id
├── inspection_id
├── name
├── description
├── created_at
└── updated_at
```

### InspectionIssue

```text
InspectionIssue
├── id
├── inspection_area_id
├── title
├── description
├── severity
├── recommended_action
├── created_at
└── updated_at
```

This structured approach is important because it allows phases to progress from raw field notes into a coherent scope and budget.

### ScopeItem

```text
ScopeItem
├── id
├── project_id
├── category
├── title
├── description
├── quantity
├── unit
├── labor_estimate
├── material_estimate
├── total_estimate
├── priority
├── status
├── created_by
├── created_at
└── updated_at
```

This is the operational bridge between inspection and contractor execution.

---

## 5. Budget model

The budget should track operational cost without becoming accounting software.

Budget is a project-level derived model, not a full chart-of-accounts.

```text
BudgetItem
├── id
├── project_id
├── scope_item_id
├── category
├── description
├── estimated_cost
├── committed_cost
├── approved_change_order_cost
├── actual_cost
├── remaining_budget
├── status
├── created_at
└── updated_at
```

Required values:

- Estimated Cost
- Committed Cost
- Approved Change Orders
- Actual Cost
- Remaining Budget

This keeps the budget useful for operational decisions while staying simple enough for V1.

---

## 6. Contractor model

### Contractor

```text
Contractor
├── id
├── organization_id
├── company_name
├── contact_name
├── email
├── phone
├── trades
├── service_area
├── status
├── created_at
└── updated_at
```

### ProjectContractor

```text
ProjectContractor
├── id
├── project_id
├── contractor_id
├── role
├── status
├── assigned_at
├── created_at
└── updated_at
```

We should not attach contractors directly to properties. We attach them to project assignments and work orders.

---

## 7. Work order and execution model

### WorkOrder

```text
WorkOrder
├── id
├── project_id
├── project_contractor_id
├── trade
├── title
├── description
├── start_date
├── due_date
├── status
├── priority
├── completion_percentage
├── created_by
├── created_at
└── updated_at
```

Status enum:

- DRAFT
- ASSIGNED
- ACCEPTED
- IN_PROGRESS
- SUBMITTED_FOR_REVIEW
- QC
- COMPLETED
- REJECTED
- CANCELLED

This is the operational unit that ties scope, contractor, timing, and progress together.

### ProgressUpdate

```text
ProgressUpdate
├── id
├── work_order_id
├── contractor_id
├── status_text
├── completion_percentage
├── notes
├── blocker_notes
├── created_at
└── updated_at
```

This captures progress records, not just final completion.

### ChangeOrder

```text
ChangeOrder
├── id
├── work_order_id
├── project_id
├── requested_by
├── reason
├── description
├── cost_impact
├── schedule_impact
├── status
├── approved_by
├── created_at
├── updated_at
└── approved_at
```

Status enum:

- DRAFT
- SUBMITTED
- APPROVED
- REJECTED
- CANCELLED

Critical rule: Change Order is a complementary approval record; it does not overwrite the original scope.

### QCInspection

```text
QCInspection
├── id
├── work_order_id
├── project_id
├── inspector_user_id
├── result
├── notes
├── due_date
├── created_at
└── updated_at
```

Result enum:

- PENDING
- PASS
- FAIL
- REINSPECTION_REQUIRED

### PunchItem

```text
PunchItem
├── id
├── project_id
├── work_order_id
├── description
├── location
├── assigned_contractor_id
├── priority
├── status
├── due_date
├── completion_date
├── created_at
└── updated_at
```

---

## 8. Notification model

Notification should be a simple, centralized event model rather than a complex messaging system.

```text
Notification
├── id
├── organization_id
├── recipient_user_id
├── type
├── title
├── message
├── related_entity_type
├── related_entity_id
├── is_read
├── created_at
└── read_at
```

Supported notification types in V1:

- WORK_ORDER_ASSIGNED
- PROGRESS_UPDATE
- CHANGE_ORDER_SUBMITTED
- CHANGE_ORDER_APPROVED
- QC_FAILED
- PUNCH_ITEM_OPEN
- PROJECT_STATUS_UPDATED

Later, email and SMS can be implemented as delivery channels without redesigning the central model.

---

## 9. Audit and file model

### AuditLog

```text
AuditLog
├── id
├── organization_id
├── entity_type
├── entity_id
├── action
├── actor_user_id
├── previous_values
├── new_values
├── created_at
└── ip_address
```

This should capture the operational events that matter: budget changes, scope approvals, contractor assignment, QC, and change-order status transitions.

### Attachment

The database keeps metadata only; files live in object storage.

```text
Attachment
├── id
├── organization_id
├── project_id
├── work_order_id
├── inspection_id
├── change_order_id
├── storage_bucket
├── storage_path
├── file_name
├── file_type
├── file_size
├── uploaded_by
├── created_at
└── updated_at
```

Storage layout:

```text
/projects/{project_id}/
  inspections/
  scope/
  work-orders/
  progress/
  change-orders/
  qc/
  punch-list/
```

---

## 10. Permissions and RBAC

The permission model must protect the operational work trail.

### Admin / Operations Manager

Can:

- create properties
- create projects
- create inspections
- create scopes
- manage budgets
- assign contractors
- create work orders
- approve change orders
- perform QC
- manage punch lists
- view contractor performance

### Contractor

Can:

- view assigned projects and work orders
- accept or reject work assignment
- update progress
- upload photos
- submit change-order requests
- respond to punch items
- view relevant scope/budget information

Cannot:

- see other contractors' work
- see internal notes not tied to assigned work
- see unrelated property data
- view organization-wide performance metrics

### Owner / Investor

Can:

- view owned properties
- view project status
- view approved scope
- view budget status
- view progress
- view photos
- view change orders
- view QC
- view completion

Cannot:

- modify operational records by default

This model should be implemented using database policies and server-side authorization checks.

---

## 11. Database architecture overview

```text
organizations
├── users
├── properties
│   └── projects
│       ├── inspections
│       ├── inspection_areas
│       ├── inspection_issues
│       ├── scope_items
│       ├── budget_items
│       ├── project_contractors
│       └── work_orders
│           ├── progress_updates
│           ├── change_orders
│           ├── qc_inspections
│           ├── punch_items
│           └── attachments
├── contractors
├── notifications
├── audit_logs
└── attachments
```

This is the dependency backbone:

- organizations
- users
- properties
- projects
- inspections
- scope
- budget
- contractors
- work orders
- progress
- change orders
- qc
- punch list
- completion
- performance

---

## 12. Dashboard strategy

The first dashboard should be operational, not decorative.

The first screen must answer:

> What needs attention right now?

Suggested dashboard blocks:

- Active projects count
- Work orders overdue
- Change orders awaiting approval
- QC failures
- Punch items open
- Today’s work queue
- Budget summary
- Active project table with status and progress

This is operational control center design, not a generic analytics dashboard.

---

## 13. Navigation structure

Keep V1 navigation narrow and operational.

```text
ReiTask
├── Dashboard
├── Properties
├── Projects
├── Inspections
├── Scopes
├── Work Orders
├── Contractors
├── Change Orders
├── QC
├── Punch Lists
├── Budgets
├── Notifications
├── Settings
```

No large multi-level sidebar with 40 modules. The app should support the operational loop, not create feature clutter.

---

## 14. Delivery roadmap

### Phase 0 — Architecture foundation

Required outcome: a user can sign in and reach the correct environment.

Build:

- repository
- Next.js app
- TypeScript
- Tailwind
- Supabase
- env configuration
- database
- auth
- role model
- org model
- base navigation

### Phase 1 — Property → Project

Build:

- Properties
- Property detail
- Projects
- Project detail
- status workflow

### Phase 2 — Inspection → Scope

Build:

- inspections
- inspection areas
- issues
- photos
- scope items
- approval flow

### Phase 3 — Budget

Build:

- cost estimates
- committed costs
- actual costs
- remaining budget

### Phase 4 — Contractors → Work Orders

Build:

- contractor profiles
- project assignments
- work orders
- work-order state transitions

### Phase 5 — Execution

Build:

- contractor dashboard
- work-order acceptance
- progress updates
- photos and notes
- completion submission
- notifications

### Phase 6 — Change Orders

Build:

- change-order request flow
- cost/schedule impact
- approval and rejection
- audit trail

### Phase 7 — QC → Punch → Completion

Build:

- QC inspection
- fail/pass logic
- punch items
- reinspection and completion

### Phase 8 — Contractor Performance

Only after enough real operational data exists.

---

## 15. What we do not build in V1

Deliberately exclude these features from the first product build:

- AI scope generation
- AI estimating
- AI contractor matching
- payments
- accounting
- invoicing
- native mobile apps
- contractor marketplace
- advanced analytics
- complex financial reporting
- automated bidding marketplace
- GPS/time tracking
- chat system
- AI assistant

These become future layers, not V1 foundation.

---

## 16. Dependency chain

The application should be built in dependency order:

```text
AUTH
↓
ORGANIZATION
↓
PROPERTY
↓
PROJECT
↓
INSPECTION
↓
SCOPE
↓
BUDGET
↓
CONTRACTOR
↓
WORK ORDER
↓
PROGRESS
↓
CHANGE ORDER
↓
QC
↓
PUNCH LIST
↓
COMPLETION
↓
PERFORMANCE
```

No module should be built before its upstream operational data is available.

---

## 17. V1 success criterion

ReiTask V1 is successful if an operations manager can take a real property from initial inspection through completion while keeping scope, budget, contractors, work orders, progress, change orders, QC, and punch-list activity in one system.

If the workflow holds without data-loss, approval breakage, or permission leakage, the MVP is valid.

---

## 18. Recommended implementation order from here

1. Technical foundation
   - Next.js
   - TypeScript
   - Tailwind
   - Supabase
   - Git
   - environment variables

2. Database schema
   - actual tables
   - fields
   - enums
   - relationships
   - indexes
   - constraints
   - permissions

3. Authentication + RBAC
   - Admin / Operations / Contractor / Owner

4. Application shell
   - navigation
   - protected routes
   - dashboard framework

5. Property + Project module

6. Inspection module

7. Scope module

8. Budget module

9. Contractors module

10. Work orders module

11. Progress module

12. Change orders module

13. QC module

14. Punch list module

15. Completion workflow

16. Notifications

17. Contractor performance

18. Testing, security, deployment

This is the safe build sequence, and it preserves architectural integrity while keeping the product focused on the real operational problem.
