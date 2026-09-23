export type Property = {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  propertyType: 'Single Family' | 'Multifamily' | 'Condo' | 'Commercial'
  status: 'Active' | 'Watchlist' | 'Completed'
  owner: string
  projectCount: number
  openTasks: number
  notes: string
}

export type ProjectStage = 'Planning' | 'Inspection' | 'Scope' | 'In progress' | 'QC' | 'Punch List' | 'Completed'

export type InspectionIssue = {
  area: string
  description: string
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
  status: 'Open' | 'In review' | 'Pending' | 'Approved'
}

export type ScopeItem = {
  title: string
  category: string
  estimate: string
  status: 'Pending' | 'Approved' | 'In review' | 'Completed'
}

export type WorkOrderStatus = 'Assigned' | 'Accepted' | 'In progress' | 'Submitted for review' | 'QC' | 'Completed'

export type WorkOrder = {
  id: string
  projectId: string
  contractor: string
  trade: string
  title: string
  dueDate: string
  status: WorkOrderStatus
  progress: number
  scopeReference: string
}

export type Project = {
  id: string
  propertyId: string
  name: string
  status: ProjectStage
  progress: number
  budget: string
  actualCost: string
  owner: string
  targetDate: string
  startDate: string
  description: string
  nextAction: string
  inspectionIssues: InspectionIssue[]
  scopeItems: ScopeItem[]
  workOrders: WorkOrder[]
}

export const properties: Property[] = [
  {
    id: 'prop-123-main',
    name: '123 Main Street',
    address: '123 Main Street',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    propertyType: 'Single Family',
    status: 'Active',
    owner: 'Jordan Smith',
    projectCount: 2,
    openTasks: 8,
    notes: 'Kitchen and bath rehab underway with scope approval pending.',
  },
  {
    id: 'prop-456-oak',
    name: '456 Oak Avenue',
    address: '456 Oak Avenue',
    city: 'Round Rock',
    state: 'TX',
    zip: '78664',
    propertyType: 'Multifamily',
    status: 'Watchlist',
    owner: 'Maya Chen',
    projectCount: 1,
    openTasks: 4,
    notes: 'Roof and exterior work are active with QC items still open.',
  },
  {
    id: 'prop-789-pine',
    name: '789 Pine Lane',
    address: '789 Pine Lane',
    city: 'San Antonio',
    state: 'TX',
    zip: '78205',
    propertyType: 'Condo',
    status: 'Completed',
    owner: 'Luis Rivera',
    projectCount: 3,
    openTasks: 2,
    notes: 'Punch list nearly closed; final inspections are scheduled.',
  },
]

export const projects: Project[] = [
  {
    id: 'proj-1',
    propertyId: 'prop-123-main',
    name: 'Initial Renovation',
    status: 'QC',
    progress: 72,
    budget: '$28k',
    actualCost: '$21.4k',
    owner: 'Jordan Smith',
    targetDate: 'Sep 24',
    startDate: 'Aug 15',
    description: 'Whole-home refresh focused on kitchens, bathrooms, and finishing work.',
    nextAction: 'Approve final QC report and close open punch items.',
    inspectionIssues: [
      { area: 'Kitchen', description: 'Cabinets damaged and countertop seams uneven.', severity: 'High', status: 'Approved' },
      { area: 'Bathroom', description: 'Leak under sink and wall trim moisture present.', severity: 'Critical', status: 'In review' },
      { area: 'Living room', description: 'Flooring in the east wall needs replacement.', severity: 'Medium', status: 'Open' },
    ],
    scopeItems: [
      { title: 'Replace kitchen cabinets', category: 'Kitchen', status: 'Completed', estimate: '$2,400' },
      { title: 'Repair bathroom plumbing', category: 'Plumbing', status: 'In review', estimate: '$1,150' },
      { title: 'Install flooring', category: 'Flooring', status: 'Completed', estimate: '$3,100' },
    ],
    workOrders: [
      { id: 'WO-001', projectId: 'proj-1', contractor: 'ABC Plumbing', trade: 'Plumbing', title: 'Repair bathroom leak', dueDate: 'Sep 25', status: 'Assigned', progress: 20, scopeReference: 'Repair bathroom plumbing' },
      { id: 'WO-002', projectId: 'proj-1', contractor: 'Studio Finish', trade: 'Painting', title: 'Final touch-up paint', dueDate: 'Sep 27', status: 'In progress', progress: 65, scopeReference: 'Install flooring' },
    ],
  },
  {
    id: 'proj-2',
    propertyId: 'prop-456-oak',
    name: 'Roof Replacement',
    status: 'In progress',
    progress: 43,
    budget: '$41k',
    actualCost: '$19.8k',
    owner: 'Maya Chen',
    targetDate: 'Oct 03',
    startDate: 'Sep 01',
    description: 'Exterior envelope repair including roofing, flashing, and drainage remediation.',
    nextAction: 'Inspect recent waterproofing work and confirm weatherproofing signoff.',
    inspectionIssues: [
      { area: 'Roof', description: 'Multiple underlayment gaps and damaged flashing points.', severity: 'Critical', status: 'Approved' },
      { area: 'Exterior', description: 'Drainage channel is not aligned to the downspout run.', severity: 'High', status: 'Pending' },
      { area: 'Windows', description: 'Seal conditions need reinspection after storm exposure.', severity: 'Medium', status: 'Open' },
    ],
    scopeItems: [
      { title: 'Remove old shingles', category: 'Roofing', status: 'Completed', estimate: '$6,200' },
      { title: 'Install underlayment', category: 'Roofing', status: 'In review', estimate: '$4,100' },
      { title: 'Repair flashing', category: 'Exterior', status: 'Pending', estimate: '$2,700' },
    ],
    workOrders: [
      { id: 'WO-003', projectId: 'proj-2', contractor: 'Bluepeak Electric', trade: 'Electrical', title: 'Review venting and fixtures', dueDate: 'Sep 28', status: 'Submitted for review', progress: 80, scopeReference: 'Repair flashing' },
      { id: 'WO-004', projectId: 'proj-2', contractor: 'Cedar Roofing Co.', trade: 'Roofing', title: 'Install underlayment and flashing', dueDate: 'Sep 30', status: 'In progress', progress: 55, scopeReference: 'Install underlayment' },
    ],
  },
  {
    id: 'proj-3',
    propertyId: 'prop-789-pine',
    name: 'Turnover Refresh',
    status: 'Punch List',
    progress: 91,
    budget: '$19k',
    actualCost: '$17.6k',
    owner: 'Luis Rivera',
    targetDate: 'Sep 19',
    startDate: 'Aug 22',
    description: 'Turnover-ready refurbishment to prepare the unit for occupancy and closeout.',
    nextAction: 'Finalize remaining punch items and schedule final occupant walkthrough.',
    inspectionIssues: [
      { area: 'Paint', description: 'Touch-ups needed around bedroom trim and baseboards.', severity: 'Low', status: 'Pending' },
      { area: 'Lighting', description: 'Bathroom vanity light flickers intermittently.', severity: 'Medium', status: 'Open' },
      { area: 'Cleaning', description: 'Final turnover clean-up still pending full walkthrough.', severity: 'Low', status: 'Approved' },
    ],
    scopeItems: [
      { title: 'Paint touch-ups', category: 'Finishes', status: 'Pending', estimate: '$850' },
      { title: 'Fix light fixtures', category: 'Electrical', status: 'Completed', estimate: '$620' },
      { title: 'Deep clean', category: 'Turnover', status: 'In review', estimate: '$440' },
    ],
    workOrders: [
      { id: 'WO-005', projectId: 'proj-3', contractor: 'Studio Finish', trade: 'Painting', title: 'Final paint punch list', dueDate: 'Sep 19', status: 'Completed', progress: 100, scopeReference: 'Paint touch-ups' },
      { id: 'WO-006', projectId: 'proj-3', contractor: 'Ridge Built', trade: 'Carpentry', title: 'Final trim inspections', dueDate: 'Sep 21', status: 'QC', progress: 90, scopeReference: 'Fix light fixtures' },
    ],
  },
]

export const alerts = [
  '4 work orders overdue',
  '3 change orders awaiting approval',
  '5 QC items failed',
  '7 punch items open',
]

export type QualityIssueRecord = {
  id: string
  projectId: string
  projectName: string
  title: string
  area: string
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
  status: 'Open' | 'In review' | 'Pending' | 'Approved'
  owner: string
}

export type PunchItemRecord = {
  id: string
  projectId: string
  projectName: string
  title: string
  location: string
  priority: 'Low' | 'Medium' | 'High'
  status: 'Open' | 'In progress' | 'Complete'
  dueDate: string
}

export type ChangeOrderRecord = {
  id: string
  projectId: string
  projectName: string
  title: string
  amount: string
  status: 'Pending' | 'Approved' | 'Rejected'
  requestedBy: string
  reason: string
}

export type NotificationRecord = {
  id: string
  type: 'Approval' | 'QC' | 'Scheduling' | 'Issue'
  title: string
  detail: string
  time: string
  isRead: boolean
}

export const qcItems: QualityIssueRecord[] = [
  {
    id: 'QC-101',
    projectId: 'proj-1',
    projectName: 'Initial Renovation',
    title: 'Cabinet alignment issue',
    area: 'Kitchen',
    severity: 'High',
    status: 'Open',
    owner: 'Jordan Smith',
  },
  {
    id: 'QC-102',
    projectId: 'proj-1',
    projectName: 'Initial Renovation',
    title: 'Bathroom leak verification',
    area: 'Bathroom',
    severity: 'Critical',
    status: 'In review',
    owner: 'Maya Chen',
  },
  {
    id: 'QC-201',
    projectId: 'proj-2',
    projectName: 'Roof Replacement',
    title: 'Flashing seal inspection',
    area: 'Roof',
    severity: 'Critical',
    status: 'Pending',
    owner: 'Maya Chen',
  },
  {
    id: 'QC-301',
    projectId: 'proj-3',
    projectName: 'Turnover Refresh',
    title: 'Trim touch-up review',
    area: 'Bedroom',
    severity: 'Low',
    status: 'Approved',
    owner: 'Luis Rivera',
  },
]

export const punchItems: PunchItemRecord[] = [
  {
    id: 'PUNCH-101',
    projectId: 'proj-1',
    projectName: 'Initial Renovation',
    title: 'Touch up baseboard paint',
    location: 'Living room',
    priority: 'Medium',
    status: 'Open',
    dueDate: 'Sep 24',
  },
  {
    id: 'PUNCH-201',
    projectId: 'proj-2',
    projectName: 'Roof Replacement',
    title: 'Finalize downspout alignment',
    location: 'Rear fascia',
    priority: 'High',
    status: 'In progress',
    dueDate: 'Sep 28',
  },
  {
    id: 'PUNCH-301',
    projectId: 'proj-3',
    projectName: 'Turnover Refresh',
    title: 'Final turnover clean',
    location: 'Primary bath',
    priority: 'Low',
    status: 'Complete',
    dueDate: 'Sep 19',
  },
]

export const changeOrders: ChangeOrderRecord[] = [
  {
    id: 'CO-101',
    projectId: 'proj-1',
    projectName: 'Initial Renovation',
    title: 'Additional cabinet hardware allowance',
    amount: '$1,250',
    status: 'Pending',
    requestedBy: 'Jordan Smith',
    reason: 'Hardware upgrade and additional cabinet trim required for final finish.',
  },
  {
    id: 'CO-201',
    projectId: 'proj-2',
    projectName: 'Roof Replacement',
    title: 'Drainage correction addendum',
    amount: '$2,400',
    status: 'Approved',
    requestedBy: 'Maya Chen',
    reason: 'Installation variance required additional gutter and downspout alignment to meet drainage specs.',
  },
  {
    id: 'CO-301',
    projectId: 'proj-3',
    projectName: 'Turnover Refresh',
    title: 'Final clean and touch-up reserve',
    amount: '$680',
    status: 'Pending',
    requestedBy: 'Luis Rivera',
    reason: 'Final punch list balancing and turnover cleaning reserve for occupancy prep.',
  },
]

export const notifications: NotificationRecord[] = [
  { id: 'N-101', type: 'Approval', title: 'Change order awaiting approval', detail: 'Additional cabinet hardware for Initial Renovation', time: '2h ago', isRead: false },
  { id: 'N-102', type: 'QC', title: 'QC item assigned', detail: 'Bathroom leak verification is in review', time: '5h ago', isRead: false },
  { id: 'N-103', type: 'Scheduling', title: 'Contractor check-in scheduled', detail: 'Cedar Roofing Co. confirm site visit for tomorrow', time: 'Today', isRead: true },
  { id: 'N-104', type: 'Issue', title: 'Punch item requires attention', detail: 'Finalize downspout alignment on Roof Replacement', time: 'Yesterday', isRead: true },
]

export const todaysWork = [
  { time: '09:30', title: 'Scope approval', detail: '123 Main Street' },
  { time: '11:00', title: 'Contractor check-in', detail: 'ABC Plumbing' },
  { time: '14:00', title: 'QC review', detail: '456 Oak Avenue' },
]

export function getPropertyById(id: string) {
  return properties.find((property) => property.id === id)
}

export function getProjectById(id: string) {
  return projects.find((project) => project.id === id)
}

export function getProjectsForProperty(propertyId: string) {
  return projects.filter((project) => project.propertyId === propertyId)
}

export function getWorkOrdersForProject(projectId: string) {
  return projects.find((project) => project.id === projectId)?.workOrders ?? []
}
