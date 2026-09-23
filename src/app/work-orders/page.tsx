import { fetchContractors, fetchProjects, fetchWorkOrders } from '@/lib/repository'
import WorkOrderCreateForm from './work-order-create-form'

export default async function WorkOrdersPage() {
  const [workOrders, projects, contractors] = await Promise.all([fetchWorkOrders(), fetchProjects(), fetchContractors()])

  return (
    <main className="min-h-screen bg-stone-100 p-6 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">Execution</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Work Orders</h1>
          </div>
          <WorkOrderCreateForm projects={projects} contractors={contractors} />
        </div>

        <div className="space-y-4">
          {workOrders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-stone-400">{order.id}</div>
                  <div className="mt-2 text-xl font-semibold text-slate-900">{order.title}</div>
                  <div className="mt-1 text-sm text-stone-500">{order.projectName}</div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.12em] text-stone-400">Trade</div>
                    <div className="mt-1 font-medium text-slate-800">{order.trade}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.12em] text-stone-400">Contractor</div>
                    <div className="mt-1 font-medium text-slate-800">{order.contractor}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.12em] text-stone-400">Due</div>
                    <div className="mt-1 font-medium text-slate-800">{order.dueDate}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{order.status}</span>
                  <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">{order.progress}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
