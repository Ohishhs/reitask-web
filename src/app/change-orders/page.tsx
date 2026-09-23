import { fetchChangeOrders, fetchProjects } from '@/lib/repository'
import ChangeOrderCreateForm from './change-order-create-form'
import ChangeOrderDecision from './change-order-decision'

export default async function ChangeOrdersPage() {
  const [changeOrders, projects] = await Promise.all([fetchChangeOrders(), fetchProjects()])

  return (
    <main className="min-h-screen bg-stone-100 p-6 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">Project controls</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Change Orders</h1>
          </div>
          <ChangeOrderCreateForm projects={projects} />
        </div>

        <div className="space-y-4">
          {changeOrders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-stone-400">{order.id}</div>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">{order.title}</h2>
                  <div className="mt-1 text-sm text-stone-500">{order.projectName}</div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.12em] text-stone-400">Amount</div>
                    <div className="mt-1 font-semibold text-slate-900">{order.amount}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.12em] text-stone-400">Requested by</div>
                    <div className="mt-1 font-semibold text-slate-900">{order.requestedBy}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.12em] text-stone-400">Status</div>
                    <div className="mt-1 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{order.status}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-stone-50 p-4 text-sm leading-6 text-stone-600">{order.reason}</div>
              <ChangeOrderDecision id={order.id} status={order.status} />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
