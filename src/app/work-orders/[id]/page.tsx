import { getWorkOrderById } from '@/lib/repository'
import Link from 'next/link'
import ProgressUpdateForm from './progress-update-form'
import AttachmentUploadForm from './attachment-upload-form'
import AttachmentList from './attachment-list'

export default async function WorkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const selectedOrder = await getWorkOrderById(id)

  if (!selectedOrder) {
    return (
      <main className="min-h-screen bg-stone-100 p-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Work order not found</h1>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-100 p-6 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">Execution</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{selectedOrder.title}</h1>
          </div>
          <Link href="/work-orders" className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
            Back to work orders
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Order ID</div>
                <div className="mt-2 text-lg font-semibold text-slate-900">{selectedOrder.id}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Project</div>
                <div className="mt-2 text-lg font-semibold text-slate-900">{selectedOrder.projectName}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Contractor</div>
                <div className="mt-2 text-lg font-semibold text-slate-900">{selectedOrder.contractor}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Trade</div>
                <div className="mt-2 text-lg font-semibold text-slate-900">{selectedOrder.trade}</div>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-stone-50 p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Scope reference</div>
              <div className="mt-2 text-base font-medium text-slate-800">{selectedOrder.scopeReference}</div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Status</div>
              <div className="mt-3 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{selectedOrder.status}</div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Progress</div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{selectedOrder.progress}%</div>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-stone-200">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${selectedOrder.progress}%` }} />
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Due date</div>
              <div className="mt-3 text-lg font-semibold text-slate-900">{selectedOrder.dueDate}</div>
            </div>

            <ProgressUpdateForm workOrderId={selectedOrder.id} />
            <AttachmentUploadForm projectId={selectedOrder.projectId} workOrderId={selectedOrder.id} />
            <AttachmentList projectId={selectedOrder.projectId} />
          </div>
        </div>
      </div>
    </main>
  )
}
