import { fetchProjects } from '@/lib/repository'
import BudgetItemCreateForm from './budget-item-create-form'

export default async function BudgetsPage() {
  const projects = await fetchProjects()
  const totals = projects.reduce(
    (acc, project) => {
      acc.planned += Number.parseFloat(project.budget.replace(/[$,k]/gi, ''))
      acc.actual += Number.parseFloat(project.actualCost.replace(/[$,k]/gi, ''))
      return acc
    },
    { planned: 0, actual: 0 },
  )

  return (
    <main className="min-h-screen bg-stone-100 p-6 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">Project finance</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Budget</h1>
          </div>
          <BudgetItemCreateForm projects={projects} />
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Planned</div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">${totals.planned.toFixed(0)}k</div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Committed</div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">${(totals.planned * 0.85).toFixed(0)}k</div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Actual</div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">${totals.actual.toFixed(0)}k</div>
          </div>
        </div>

        <div className="space-y-4">
          {projects.map((project) => (
            <div key={project.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Project</div>
                  <div className="mt-2 text-xl font-semibold text-slate-900">{project.name}</div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.12em] text-stone-400">Budget</div>
                    <div className="mt-1 font-semibold text-slate-900">{project.budget}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.12em] text-stone-400">Committed</div>
                    <div className="mt-1 font-semibold text-slate-900">{project.actualCost}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.12em] text-stone-400">Remaining</div>
                    <div className="mt-1 font-semibold text-slate-900">${(Number.parseFloat(project.budget.replace(/[$,k]/gi, '')) - Number.parseFloat(project.actualCost.replace(/[$,k]/gi, '') )).toFixed(0)}k</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
