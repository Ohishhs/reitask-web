import { fetchDashboardSnapshot } from '@/lib/repository'

export default async function HomePage() {
  const snapshot = await fetchDashboardSnapshot()

  const stats = [
    { label: 'Projects', value: String(snapshot.projects.length), delta: `${snapshot.projects.filter((project) => project.status !== 'Completed').length} requiring action`, tone: 'green' },
    { label: 'Work orders', value: String(snapshot.projects.reduce((total, project) => total + project.workOrders.length, 0)), delta: 'Across active workstreams', tone: 'amber' },
    { label: 'Budget', value: `$${snapshot.projects.reduce((total, project) => total + Number.parseFloat(project.budget.replace(/[$,k]/gi, '')), 0).toFixed(0)}k`, delta: 'Planned', tone: 'blue' },
    { label: 'QC failures', value: String(snapshot.projects.reduce((total, project) => total + project.inspectionIssues.filter((issue) => issue.status === 'Open' || issue.status === 'Pending').length, 0)), delta: 'Needs review', tone: 'rose' },
  ]

  const projectRows = snapshot.projects.slice(0, 3).map((project) => ({
    name: project.name,
    progress: project.progress,
    budget: project.budget,
    status: project.status,
  }))

  return (
    <main className="min-h-screen bg-stone-100 text-slate-800">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-72 border-r border-stone-200 bg-stone-50 p-6 lg:flex lg:flex-col">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
              R
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">ReiTask</div>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-stone-200 bg-white p-3">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500">Workspace</div>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <div className="font-medium">ReiTask Demo</div>
                <div className="text-xs text-stone-500">Operations workspace</div>
              </div>
              <div className="rounded-lg bg-stone-100 px-2 py-1 text-xs font-medium text-stone-600">Ops</div>
            </div>
          </div>

          <nav className="space-y-2 text-sm">
            {['Dashboard', 'Properties', 'Projects', 'Inspections', 'Scopes', 'Work Orders', 'Contractors', 'Change Orders', 'QC', 'Punch Lists', 'Budgets', 'Notifications'].map((item, index) => (
              <button
                key={item}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition ${
                  index === 0 ? 'bg-slate-900 text-white' : 'text-stone-600 hover:bg-stone-200/80'
                }`}
              >
                <span>{item}</span>
                {index === 0 && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">12</span>}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1">
          <header className="border-b border-stone-200 bg-stone-50/80 px-5 py-4 sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-stone-500">ReiTask Demo / <span className="font-semibold text-slate-700">Dashboard</span></div>
              <div className="flex items-center gap-3">
                <button className="rounded-full border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700">Notifications</button>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 font-semibold text-amber-900">JS</div>
              </div>
            </div>
          </header>

          <main className="p-5 sm:p-8">
            <section className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">Tuesday, September 22, 2026</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Good morning, Jordan.</h1>
                <p className="mt-2 text-sm text-stone-500">Here is what needs your attention across the portfolio.</p>
              </div>
              <button className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
                + New project
              </button>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      stat.tone === 'green' ? 'bg-emerald-100 text-emerald-700' :
                      stat.tone === 'amber' ? 'bg-amber-100 text-amber-700' :
                      stat.tone === 'blue' ? 'bg-sky-100 text-sky-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {stat.label.charAt(0)}
                    </div>
                    <div className="text-xs text-stone-400">↗</div>
                  </div>
                  <div className="mt-5 text-xs uppercase tracking-[0.14em] text-stone-400">{stat.label}</div>
                  <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{stat.value}</div>
                  <div className="mt-1 text-xs text-stone-500">{stat.delta}</div>
                </div>
              ))}
            </section>

            <section className="mt-8 grid gap-6 xl:grid-cols-[1.6fr_0.8fr]">
              <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Projects</h2>
                    <p className="text-xs text-stone-500">Active operational pipeline</p>
                  </div>
                  <button className="text-sm font-medium text-slate-700">View all</button>
                </div>

                <div className="overflow-hidden rounded-xl border border-stone-200">
                  <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
                    <thead className="bg-stone-50 text-stone-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">Property</th>
                        <th className="px-4 py-3 font-medium">Progress</th>
                        <th className="px-4 py-3 font-medium">Budget</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 bg-white">
                      {projectRows.map((project) => (
                        <tr key={project.name}>
                          <td className="px-4 py-3 font-medium text-slate-800">{project.name}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-2.5 w-20 overflow-hidden rounded-full bg-stone-200">
                                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${project.progress}%` }} />
                              </div>
                              <span className="text-xs text-stone-500">{project.progress}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-stone-600">{project.budget}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                              {project.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Today&apos;s work</h2>
                    <button className="text-sm font-medium text-slate-700">Focus</button>
                  </div>
                  <div className="space-y-4">
                    {snapshot.todaysWork.map((item) => (
                      <div key={item.time} className="flex gap-3 rounded-xl bg-stone-50 p-3">
                        <div className="w-12 text-xs font-medium uppercase tracking-[0.12em] text-stone-400">{item.time}</div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-slate-800">{item.title}</div>
                          <div className="text-xs text-stone-500">{item.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Alerts</h2>
                  </div>
                  <div className="space-y-3 text-sm">
                    {snapshot.alerts.map((alert) => (
                      <div key={alert} className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 p-2 text-amber-900">
                        <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                        <span>{alert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </main>
  )
}
