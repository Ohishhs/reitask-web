import { fetchProjects } from '@/lib/repository'
import InspectionCreateForm from './inspection-create-form'

export default async function InspectionsPage() {
  const projects = await fetchProjects()
  const issues = projects.flatMap((project) =>
    project.inspectionIssues.map((issue) => ({
      project: project.name,
      area: issue.area,
      description: issue.description,
      severity: issue.severity,
      status: issue.status,
    })),
  )

  return (
    <main className="min-h-screen bg-stone-100 p-6 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">Project workflow</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Inspections</h1>
          </div>
          <InspectionCreateForm projects={projects} />
        </div>

        <div className="space-y-4">
          {issues.map((issue) => (
            <div key={`${issue.project}-${issue.area}-${issue.description}`} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-stone-400">{issue.project}</div>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">{issue.area}</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{issue.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">{issue.severity}</span>
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-slate-700">{issue.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
