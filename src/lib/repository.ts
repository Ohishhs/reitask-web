import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseServerClient } from './supabase-server'
import {
  alerts,
  changeOrders,
  notifications,
  properties,
  projects,
  punchItems,
  qcItems,
  todaysWork,
  type Project,
  type Property,
  type WorkOrder,
} from './mock-data'

export type DashboardSnapshot = {
  properties: Property[]
  projects: Project[]
  alerts: string[]
  todaysWork: { time: string; title: string; detail: string }[]
}

export type ContractorSummary = {
  id: string
  name: string
  trade: string
  activeJobs: number
  onTime: string
}

type SupabasePropertyRow = {
  id: string
  address: string
  city: string
  state: string
  postal_code: string | null
  property_type: string
  status: string
  owner?: { name?: string | null } | null
  projects?: { id: string; status: string }[]
}

type SupabaseProjectRow = {
  id: string
  property_id: string
  name: string
  status: string
  start_date: string | null
  target_completion_date: string | null
  budget_total: number | null
  actual_cost: number | null
  property?: { address?: string | null } | null
  scope_items?: {
    title: string
    category: string
    total_estimate: number | null
    status: string
  }[]
  work_orders?: {
    id: string
    project_id: string
    trade: string
    title: string
    due_date: string | null
    status: string
    completion_percentage: number
    project_contractor?: { contractor?: { company_name?: string | null } | null } | null
    work_order_scope_items?: { scope_item?: { title?: string | null } | null }[]
  }[]
}

type SupabaseQualityRow = {
  id: string
  project_id: string
  result: string
  notes: string | null
  project?: { name?: string | null } | null
  inspector?: { name?: string | null } | null
}

type SupabasePunchRow = {
  id: string
  project_id: string
  description: string
  location: string | null
  priority: string
  status: string
  due_date: string | null
  project?: { name?: string | null } | null
}

type SupabaseChangeOrderRow = {
  id: string
  project_id: string
  reason: string
  description: string
  cost_impact: number | null
  status: string
  project?: { name?: string | null } | null
  requester?: { name?: string | null } | null
}

type SupabaseNotificationRow = {
  id: string
  type: string
  title: string
  message: string
  created_at: string
  is_read: boolean
}

async function safeQuery<T>(fallback: T, operation: (client: SupabaseClient) => Promise<T>): Promise<T> {
  const client = await getSupabaseServerClient()
  if (!client) {
    return Promise.resolve(fallback)
  }

  return operation(client).catch(() => fallback)
}

function formatMoney(value: number | null | undefined) {
  return `$${((value ?? 0) / 1000).toFixed(1)}k`
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function mapQualityItem(row: SupabaseQualityRow): (typeof qcItems)[number] {
  const status = row.result === 'PASS' ? 'Approved' : row.result === 'FAIL' ? 'Open' : row.result === 'REINSPECTION_REQUIRED' ? 'In review' : 'Pending'

  return {
    id: row.id,
    projectId: row.project_id,
    projectName: row.project?.name ?? 'Project',
    title: row.notes ?? 'QC inspection',
    area: 'Project review',
    severity: row.result === 'FAIL' ? 'High' : 'Medium',
    status,
    owner: row.inspector?.name ?? 'Unassigned',
  }
}

function mapPunchItem(row: SupabasePunchRow): (typeof punchItems)[number] {
  return {
    id: row.id,
    projectId: row.project_id,
    projectName: row.project?.name ?? 'Project',
    title: row.description,
    location: row.location ?? 'Unspecified',
    priority: row.priority === 'HIGH' || row.priority === 'CRITICAL' ? 'High' : row.priority === 'LOW' ? 'Low' : 'Medium',
    status: row.status === 'COMPLETED' ? 'Complete' : titleCase(row.status) as (typeof punchItems)[number]['status'],
    dueDate: row.due_date ?? 'Not scheduled',
  }
}

function mapChangeOrder(row: SupabaseChangeOrderRow): (typeof changeOrders)[number] {
  return {
    id: row.id,
    projectId: row.project_id,
    projectName: row.project?.name ?? 'Project',
    title: row.description,
    amount: formatMoney(row.cost_impact),
    status: titleCase(row.status) as (typeof changeOrders)[number]['status'],
    requestedBy: row.requester?.name ?? 'Unassigned',
    reason: row.reason,
  }
}

function mapNotification(row: SupabaseNotificationRow): (typeof notifications)[number] {
  return {
    id: row.id,
    type: row.type.includes('CHANGE_ORDER') ? 'Approval' : row.type === 'QC_FAILED' ? 'QC' : row.type === 'WORK_ORDER_ASSIGNED' || row.type === 'PROGRESS_UPDATE' ? 'Scheduling' : 'Issue',
    title: row.title,
    detail: row.message,
    time: new Date(row.created_at).toLocaleDateString(),
    isRead: row.is_read,
  }
}

function mapProperty(row: SupabasePropertyRow): Property {
  const projectCount = row.projects?.length ?? 0
  const openTasks = row.projects?.filter((project) => project.status !== 'COMPLETED').length ?? 0

  return {
    id: row.id,
    name: row.address,
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.postal_code ?? '',
    propertyType: titleCase(row.property_type) as Property['propertyType'],
    status: titleCase(row.status) as Property['status'],
    owner: row.owner?.name ?? 'Unassigned',
    projectCount,
    openTasks,
    notes: openTasks > 0 ? 'Active project work requires attention.' : 'No open project tasks.',
  }
}

function mapProject(row: SupabaseProjectRow): Project {
  const scopeItems = row.scope_items ?? []
  const workOrders = row.work_orders ?? []

  return {
    id: row.id,
    propertyId: row.property_id,
    name: row.name,
    status: titleCase(row.status) as Project['status'],
    progress: workOrders.length === 0
      ? 0
      : Math.round(workOrders.reduce((total, workOrder) => total + workOrder.completion_percentage, 0) / workOrders.length),
    budget: formatMoney(row.budget_total),
    actualCost: formatMoney(row.actual_cost),
    owner: 'Operations team',
    targetDate: row.target_completion_date ?? 'Not scheduled',
    startDate: row.start_date ?? 'Not started',
    description: row.property?.address ? `Renovation work at ${row.property.address}.` : 'Renovation project.',
    nextAction: workOrders.some((workOrder) => workOrder.status === 'QC')
      ? 'Review submitted work and close quality items.'
      : 'Monitor assigned work orders and contractor progress.',
    inspectionIssues: [],
    scopeItems: scopeItems.map((item) => ({
      title: item.title,
      category: item.category,
      estimate: formatMoney(item.total_estimate),
      status: titleCase(item.status) as Project['scopeItems'][number]['status'],
    })),
    workOrders: workOrders.map((workOrder) => ({
      id: workOrder.id,
      projectId: workOrder.project_id,
      contractor: workOrder.project_contractor?.contractor?.company_name ?? 'Unassigned',
      trade: workOrder.trade,
      title: workOrder.title,
      dueDate: workOrder.due_date ?? 'Not scheduled',
      status: titleCase(workOrder.status) as Project['workOrders'][number]['status'],
      progress: workOrder.completion_percentage,
      scopeReference: workOrder.work_order_scope_items?.[0]?.scope_item?.title ?? 'No scope reference',
    })),
  }
}

export async function fetchProperties(): Promise<Property[]> {
  return safeQuery(properties, async (client) => {
    const { data, error } = await client
      .from('properties')
      .select('*, owner:users!properties_owner_id_fkey(name), projects(id, status)')

    if (error) throw error
    return ((data as SupabasePropertyRow[] | null) ?? []).map(mapProperty)
  })
}

export async function fetchProjects(): Promise<Project[]> {
  return safeQuery(projects, async (client) => {
    const { data, error } = await client
      .from('projects')
      .select('*, property:properties(address), scope_items(*), work_orders(*, project_contractor:project_contractors(contractor:contractors(company_name)), work_order_scope_items(scope_item:scope_items(title)))')

    if (error) throw error
    return ((data as SupabaseProjectRow[] | null) ?? []).map(mapProject)
  })
}

export async function fetchProjectsForProperty(propertyId: string): Promise<Project[]> {
  const resolved = await fetchProjects()
  return resolved.filter((project) => project.propertyId === propertyId)
}

export async function fetchContractors(): Promise<ContractorSummary[]> {
  const fallback = Array.from(
    projects
      .flatMap((project) => project.workOrders)
      .reduce((map, workOrder) => {
        const existing = map.get(workOrder.contractor)
        map.set(workOrder.contractor, {
          id: workOrder.contractor,
          name: workOrder.contractor,
          trade: workOrder.trade,
          activeJobs: (existing?.activeJobs ?? 0) + 1,
          onTime: workOrder.status === 'Completed' ? '92%' : '78%',
        })
        return map
      }, new Map<string, ContractorSummary>()),
  ).map(([, contractor]) => contractor)

  return safeQuery(fallback, async (client) => {
    const { data, error } = await client
      .from('contractors')
      .select('id, company_name, trades, status')
      .order('company_name')

    if (error) throw error
    return ((data as { id: string; company_name: string; trades: string[] | null }[] | null) ?? []).map((contractor) => ({
      id: contractor.id,
      name: contractor.company_name,
      trade: contractor.trades?.[0] ?? 'Unspecified trade',
      activeJobs: 0,
      onTime: 'Not enough data',
    }))
  })
}

export async function fetchWorkOrders(): Promise<(WorkOrder & { projectName: string })[]> {
  const resolved = await fetchProjects()
  return resolved.flatMap((project) =>
    project.workOrders.map((workOrder) => ({
      ...workOrder,
      projectName: project.name,
    })),
  )
}

export async function getWorkOrderById(id: string) {
  const resolved = await fetchWorkOrders()
  return resolved.find((workOrder) => workOrder.id === id) ?? null
}

export async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  const [resolvedProjects, resolvedProperties] = await Promise.all([fetchProjects(), fetchProperties()])

  return {
    properties: resolvedProperties,
    projects: resolvedProjects,
    alerts,
    todaysWork,
  }
}

export async function fetchQualityItems() {
  return safeQuery(qcItems, async (client) => {
    const { data, error } = await client.from('qc_inspections').select('*, project:projects(name), inspector:users!qc_inspections_inspector_user_id_fkey(name)')
    if (error) throw error
    return ((data as SupabaseQualityRow[] | null) ?? []).map(mapQualityItem)
  })
}

export async function fetchPunchItems() {
  return safeQuery(punchItems, async (client) => {
    const { data, error } = await client.from('punch_items').select('*, project:projects(name)')
    if (error) throw error
    return ((data as SupabasePunchRow[] | null) ?? []).map(mapPunchItem)
  })
}

export async function fetchChangeOrders() {
  return safeQuery(changeOrders, async (client) => {
    const { data, error } = await client.from('change_orders').select('*, project:projects(name), requester:users!change_orders_requested_by_fkey(name)')
    if (error) throw error
    return ((data as SupabaseChangeOrderRow[] | null) ?? []).map(mapChangeOrder)
  })
}

export async function fetchNotifications() {
  return safeQuery(notifications, async (client) => {
    const { data, error } = await client.from('notifications').select('id, type, title, message, created_at, is_read').order('created_at', { ascending: false })
    if (error) throw error
    return ((data as SupabaseNotificationRow[] | null) ?? []).map(mapNotification)
  })
}

export async function getProjectById(id: string) {
  const resolved = await fetchProjects()
  return resolved.find((project) => project.id === id) ?? null
}

export async function getPropertyById(id: string) {
  const resolved = await fetchProperties()
  return resolved.find((property) => property.id === id) ?? null
}
