import { fetchProjects, fetchProperties } from '@/lib/repository'
import ProjectCreateForm from './project-create-form'

export default async function ProjectsPage() {
  const [projects, properties] = await Promise.all([fetchProjects(), fetchProperties()])

  return (
    <main className="min-h-screen bg-stone-100 p-6 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">Operations</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Projects</h1>
          </div>
          <ProjectCreateForm properties={properties} />
        </div>

        <div className="space-y-4">
          {projects.map((project) => (
            <article key={project.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-stone-400">Project</div>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">{project.name}</h2>
                  <div className="mt-2 text-sm text-stone-500">Owner: {project.owner}</div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-slate-700">{project.status}</span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">{project.budget}</span>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.5fr_0.5fr] lg:items-center">
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.12em] text-stone-400">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-stone-200">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-[0.12em] text-stone-400">Target</div>
                  <div className="mt-2 text-base font-semibold text-slate-900">{project.targetDate}</div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-[0.12em] text-stone-400">Status</div>
                  <div className="mt-2 text-base font-semibold text-slate-900">{project.status}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
