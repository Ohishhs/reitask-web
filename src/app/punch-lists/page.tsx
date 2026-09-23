import { fetchContractors, fetchProjects, fetchPunchItems } from '@/lib/repository'
import PunchItemCreateForm from './punch-item-create-form'
import PunchItemStatus from './punch-item-status'

export default async function PunchListsPage() {
  const [punchItems, projects, contractors] = await Promise.all([fetchPunchItems(), fetchProjects(), fetchContractors()])

  return (
    <main className="min-h-screen bg-stone-100 p-6 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">Closeout</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Punch Lists</h1>
          </div>
          <PunchItemCreateForm projects={projects} contractors={contractors} />
        </div>

        <div className="space-y-4">
          {punchItems.map((item) => (
            <div key={item.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-stone-400">{item.projectName}</div>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">{item.title}</h2>
                  <div className="mt-1 text-sm text-stone-500">{item.location}</div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.12em] text-stone-400">Priority</div>
                    <div className="mt-1 font-semibold text-slate-900">{item.priority}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.12em] text-stone-400">Due</div>
                    <div className="mt-1 font-semibold text-slate-900">{item.dueDate}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.12em] text-stone-400">Status</div>
                    <div className="mt-1 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{item.status}</div>
                  </div>
                </div>
              </div>
              <PunchItemStatus id={item.id} status={item.status} />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
