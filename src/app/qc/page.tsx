import { fetchProjects, fetchQualityItems } from '@/lib/repository'
import QcCreateForm from './qc-create-form'
import QcResultAction from './qc-result-action'

export default async function QCPage() {
  const [qcItems, projects] = await Promise.all([fetchQualityItems(), fetchProjects()])

  return (
    <main className="min-h-screen bg-stone-100 p-6 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">Quality control</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">QC</h1>
          </div>
          <QcCreateForm projects={projects} />
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Open</div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{qcItems.filter((item) => item.status === 'Open').length}</div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="text-xs uppercase tracking-[0.14em] text-stone-400">In review</div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{qcItems.filter((item) => item.status === 'In review').length}</div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Approved</div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{qcItems.filter((item) => item.status === 'Approved').length}</div>
          </div>
        </div>

        <div className="space-y-4">
          {qcItems.map((item) => (
            <div key={item.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-stone-400">{item.projectName}</div>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">{item.title}</h2>
                  <div className="mt-2 text-sm text-stone-500">{item.area}</div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">{item.severity}</span>
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-slate-700">{item.status}</span>
                </div>
              </div>

              <div className="mt-4 text-sm text-stone-600">Owner: {item.owner}</div>
              <QcResultAction id={item.id} status={item.status} />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
