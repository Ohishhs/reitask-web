import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  Bell,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  Clock3,
  FileText,
  Filter,
  Home,
  LayoutDashboard,
  MapPin,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  Users,
  X,
} from 'lucide-react'

type TaskStatus = 'In progress' | 'To do' | 'Blocked' | 'Completed'
type Task = {
  id: number
  title: string
  property: string
  location: string
  due: string
  assignee: string
  initials: string
  status: TaskStatus
  priority: 'High' | 'Normal' | 'Low'
}

const initialTasks: Task[] = [
  { id: 1, title: 'Replace damaged kitchen faucet', property: 'Cedar Grove Apartments', location: 'Austin, TX', due: 'Today, 2:00 PM', assignee: 'Maya Chen', initials: 'MC', status: 'In progress', priority: 'High' },
  { id: 2, title: 'HVAC seasonal inspection', property: 'The Juniper House', location: 'Round Rock, TX', due: 'Today, 4:30 PM', assignee: 'Luis Rivera', initials: 'LR', status: 'To do', priority: 'Normal' },
  { id: 3, title: 'Photograph unit 204 turnover', property: 'Cedar Grove Apartments', location: 'Austin, TX', due: 'Tomorrow', assignee: 'Ari Patel', initials: 'AP', status: 'To do', priority: 'Low' },
  { id: 4, title: 'Review pool service invoice', property: 'South Congress Lofts', location: 'Austin, TX', due: 'Tomorrow', assignee: 'You', initials: 'JS', status: 'Blocked', priority: 'High' },
  { id: 5, title: 'Confirm lockbox installation', property: 'The Juniper House', location: 'Round Rock, TX', due: 'Sep 25', assignee: 'Maya Chen', initials: 'MC', status: 'Completed', priority: 'Normal' },
]

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Tasks', icon: ClipboardList, count: '24' },
  { label: 'Properties', icon: Building2 },
  { label: 'People', icon: Users },
  { label: 'Files', icon: FileText },
]

function App() {
  const [activeNav, setActiveNav] = useState('Overview')
  const [tasks, setTasks] = useState(initialTasks)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'All tasks' | TaskStatus>('All tasks')
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    const matchesSearch = `${task.title} ${task.property} ${task.assignee}`.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'All tasks' || task.status === filter
    return matchesSearch && matchesFilter
  }), [filter, search, tasks])

  const completeTask = (id: number) => {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, status: 'Completed' } : task))
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? 'is-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><span /></div>
          <span>ReiTask</span>
          <button className="mobile-close" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>
        <div className="workspace-switcher">
          <div className="workspace-avatar">RD</div>
          <div><strong>ReiTask Demo</strong><span>Operations workspace</span></div>
          <ChevronDown size={15} />
        </div>
        <nav className="primary-nav" aria-label="Primary navigation">
          <span className="nav-label">Workspace</span>
          {navItems.map(({ label, icon: Icon, count }) => (
            <button key={label} className={`nav-item ${activeNav === label ? 'active' : ''}`} onClick={() => { setActiveNav(label); setMobileNavOpen(false) }}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{count && <em>{count}</em>}
            </button>
          ))}
          <span className="nav-label secondary-label">Manage</span>
          <button className="nav-item" onClick={() => setActiveNav('Calendar')}><CalendarDays size={18} strokeWidth={1.8} /><span>Calendar</span></button>
          <button className="nav-item" onClick={() => setActiveNav('Settings')}><Settings2 size={18} strokeWidth={1.8} /><span>Settings</span></button>
        </nav>
        <div className="sidebar-footer">
          <div className="help-card"><div className="help-icon">?</div><div><strong>Need a hand?</strong><span>Visit the help center</span></div><ArrowUpRight size={15} /></div>
          <div className="user-chip"><div className="avatar avatar-you">JS</div><div><strong>Jordan Smith</strong><span>Admin</span></div><MoreHorizontal size={17} /></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <div className="breadcrumbs"><span>ReiTask Demo</span><span>/</span><strong>{activeNav}</strong></div>
          <div className="top-actions"><button className="icon-button" aria-label="Notifications"><Bell size={19} /><i /></button><div className="top-avatar">JS</div></div>
        </header>

        <div className="page-wrap">
          <section className="page-heading">
            <div><p className="eyebrow">Tuesday, September 22, 2026</p><h1>Good morning, Jordan.</h1><p className="heading-copy">Here is what needs your attention across the portfolio.</p></div>
            <button className="primary-button" onClick={() => setShowTaskForm(true)}><Plus size={17} /> New task</button>
          </section>

          <section className="metric-grid" aria-label="Workspace summary">
            <MetricCard label="Open tasks" value="24" delta="8 due this week" icon={<ClipboardList size={18} />} tone="green" />
            <MetricCard label="In progress" value="09" delta="3 need attention" icon={<Clock3 size={18} />} tone="amber" />
            <MetricCard label="Active properties" value="18" delta="Across 3 markets" icon={<Home size={18} />} tone="blue" />
            <MetricCard label="Team members" value="12" delta="2 contractors online" icon={<Users size={18} />} tone="rose" />
          </section>

          <section className="content-grid">
            <div className="tasks-panel panel">
              <div className="panel-heading"><div><h2>Task queue</h2><p>Stay on top of your team&apos;s work.</p></div><button className="text-button">View all <ArrowUpRight size={15} /></button></div>
              <div className="task-toolbar">
                <div className="search-input"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks or properties" /></div>
                <div className="filter-wrap"><Filter size={15} /><select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} aria-label="Filter tasks"><option>All tasks</option><option>In progress</option><option>To do</option><option>Blocked</option><option>Completed</option></select></div>
              </div>
              <div className="task-list">
                {filteredTasks.map((task) => <TaskRow key={task.id} task={task} onComplete={completeTask} />)}
                {filteredTasks.length === 0 && <div className="empty-state">No tasks match that search.</div>}
              </div>
            </div>
            <aside className="right-column">
              <div className="focus-panel panel"><div className="panel-heading compact"><div><h2>Today at a glance</h2><p>Your next checkpoints</p></div><button className="more-button" aria-label="More options"><MoreHorizontal size={18} /></button></div><div className="progress-block"><div className="progress-label"><span>Daily completion</span><strong>64%</strong></div><div className="progress-track"><span /></div><p>7 of 11 scheduled tasks completed</p></div><div className="checkpoint"><div className="checkpoint-time">10:30 <span>AM</span></div><div className="checkpoint-line" /><div><strong>Portfolio sync</strong><p>Weekly planning with the operations team</p></div></div><div className="checkpoint"><div className="checkpoint-time">02:00 <span>PM</span></div><div className="checkpoint-line coral" /><div><strong>Vendor arrival</strong><p>Cedar Grove Apartments · Unit 118</p></div></div><button className="outline-button"><CalendarDays size={16} /> Open calendar</button></div>
              <div className="properties-panel panel"><div className="panel-heading compact"><div><h2>Properties</h2><p>Recent activity</p></div><button className="text-button">See all <ArrowUpRight size={15} /></button></div><PropertyItem name="Cedar Grove Apartments" location="Austin, TX" tasks="8 open tasks" color="green" /><PropertyItem name="The Juniper House" location="Round Rock, TX" tasks="4 open tasks" color="orange" /><PropertyItem name="South Congress Lofts" location="Austin, TX" tasks="2 open tasks" color="blue" /></div>
            </aside>
          </section>
        </div>
      </main>
      {showTaskForm && <TaskModal onClose={() => setShowTaskForm(false)} onCreate={(title) => { setTasks((current) => [{ id: Date.now(), title, property: 'New property', location: 'Austin, TX', due: 'Today', assignee: 'You', initials: 'JS', status: 'To do', priority: 'Normal' }, ...current]); setShowTaskForm(false) }} />}
    </div>
  )
}

function MetricCard({ label, value, delta, icon, tone }: { label: string; value: string; delta: string; icon: React.ReactNode; tone: string }) {
  return <div className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><div className="metric-main"><span>{label}</span><strong>{value}</strong><small>{delta}</small></div><ArrowUpRight className="metric-arrow" size={17} /></div>
}

function TaskRow({ task, onComplete }: { task: Task; onComplete: (id: number) => void }) {
  return <div className={`task-row ${task.status === 'Completed' ? 'is-complete' : ''}`}><button className="check-button" onClick={() => onComplete(task.id)} aria-label={`Complete ${task.title}`}><Check size={14} /></button><div className="task-details"><strong>{task.title}</strong><span><MapPin size={13} />{task.property} <i>·</i> {task.location}</span></div><div className="task-due"><span className={`priority-dot ${task.priority.toLowerCase()}`} />{task.due}</div><div className={`status-pill ${task.status.toLowerCase().replace(' ', '-')}`}>{task.status}</div><div className="avatar task-avatar">{task.initials}</div><button className="row-more" aria-label={`More options for ${task.title}`}><MoreHorizontal size={17} /></button></div>
}

function PropertyItem({ name, location, tasks, color }: { name: string; location: string; tasks: string; color: string }) {
  return <div className="property-item"><div className={`property-thumb ${color}`}><Building2 size={19} /></div><div><strong>{name}</strong><span><MapPin size={12} />{location}</span></div><em>{tasks}</em><ArrowUpRight size={15} /></div>
}

function TaskModal({ onClose, onCreate }: { onClose: () => void; onCreate: (title: string) => void }) {
  const [title, setTitle] = useState('')
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="modal"><div className="modal-header"><div><p className="eyebrow">New work item</p><h2>Create a task</h2></div><button className="modal-close" onClick={onClose} aria-label="Close"><X size={19} /></button></div><label>Task title<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What needs to get done?" onKeyDown={(event) => event.key === 'Enter' && title.trim() && onCreate(title.trim())} /></label><label>Property<select><option>Cedar Grove Apartments</option><option>The Juniper House</option><option>South Congress Lofts</option></select></label><div className="modal-actions"><button className="outline-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={!title.trim()} onClick={() => onCreate(title.trim())}><Plus size={16} /> Create task</button></div></div></div>
}

export default App
