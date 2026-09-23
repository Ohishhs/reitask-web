import { fetchContractors } from '@/lib/repository'
import ContractorCreateForm from './contractor-create-form'

export default async function ContractorsPage() {
  const contractors = await fetchContractors()

  return (
    <main className="min-h-screen bg-stone-100 p-6 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">Operations</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Contractors</h1>
          </div>
          <ContractorCreateForm />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {contractors.map((contractor) => (
            <div key={contractor.name} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-stone-400">{contractor.trade}</div>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">{contractor.name}</h2>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">Active</span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-stone-600">
                <div>
                  <div className="text-stone-400">Jobs</div>
                  <div className="mt-2 text-lg font-semibold text-slate-900">{contractor.activeJobs}</div>
                </div>
                <div>
                  <div className="text-stone-400">On time</div>
                  <div className="mt-2 text-lg font-semibold text-slate-900">{contractor.onTime}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
