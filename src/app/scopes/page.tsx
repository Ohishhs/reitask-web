import { fetchProjects } from '@/lib/repository'
import ScopeCreateForm from './scope-create-form'

export default async function ScopesPage() {
  const projects = await fetchProjects()
  const scopeItems = projects.flatMap((project) =>
    project.scopeItems.map((item) => ({
      project: project.name,
      title: item.title,
      category: item.category,
      estimate: item.estimate,
      status: item.status,
    })),
  )

  return (
    <main className="min-h-screen bg-stone-100 p-6 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">Project workflow</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Scope of work</h1>
          </div>
          <ScopeCreateForm projects={projects} />
        </div>

        <div className="space-y-4">
          {scopeItems.map((item) => (
            <div key={`${item.project}-${item.title}`} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-stone-400">{item.project}</div>
                  <div className="mt-2 text-xl font-semibold text-slate-900">{item.title}</div>
                  <div className="mt-1 text-sm text-stone-500">{item.category}</div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-slate-700">{item.status}</span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">{item.estimate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
