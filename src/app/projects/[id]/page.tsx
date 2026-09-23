import { getProjectById, getPropertyById } from '@/lib/repository'
import Link from 'next/link'
import ProjectCompletionAction from './project-completion-action'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await getProjectById(id)

  if (!project) {
    return (
      <main className="min-h-screen bg-stone-100 p-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Project not found</h1>
        </div>
      </main>
    )
  }

  const property = await getPropertyById(project.propertyId)

  return (
    <main className="min-h-screen bg-stone-100 p-6 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">Project detail</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{project.name}</h1>
          </div>
          <Link href={property ? `/properties/${property.id}` : '/properties'} className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
            Back to property
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Property</div>
                <div className="mt-2 text-lg font-semibold text-slate-900">{property?.name}</div>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{project.status}</span>
            </div>

            <div className="mt-5 rounded-xl bg-stone-50 p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Project description</div>
              <p className="mt-2 text-sm leading-6 text-stone-600">{project.description}</p>
            </div>

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Progress</div>
                <div className="text-sm font-medium text-slate-700">{project.progress}%</div>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-stone-200">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${project.progress}%` }} />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Scope items</div>
              {project.scopeItems.map((item) => (
                <div key={item.title} className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 p-3">
                  <div>
                    <div className="font-medium text-slate-800">{item.title}</div>
                    <div className="text-xs text-stone-500">{item.status}</div>
                  </div>
                  <div className="text-sm font-semibold text-slate-700">{item.estimate}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Budget</div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{project.budget}</div>
              <div className="mt-4 text-sm text-stone-600">Actual cost: {project.actualCost}</div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Next action</div>
              <p className="mt-3 text-sm leading-6 text-stone-600">{project.nextAction}</p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Timeline</div>
              <div className="mt-3 space-y-3 text-sm text-stone-600">
                <div>Start: {project.startDate}</div>
                <div>Target: {project.targetDate}</div>
                <div>Owner: {project.owner}</div>
              </div>
            </div>

            <ProjectCompletionAction projectId={project.id} status={project.status} />
          </div>
        </div>
      </div>
    </main>
  )
}
