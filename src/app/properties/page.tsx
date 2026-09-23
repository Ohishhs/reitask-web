import { fetchProperties } from '@/lib/repository'
import PropertyCreateForm from './property-create-form'

export default async function PropertiesPage() {
  const properties = await fetchProperties()

  return (
    <main className="min-h-screen bg-stone-100 p-6 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">Portfolio</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Properties</h1>
          </div>
          <PropertyCreateForm />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => (
            <article key={property.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-stone-400">Property</div>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">{property.name}</h2>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  {property.status}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-stone-600">
                <div>{property.address}</div>
                <div>{property.city}, {property.state}</div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-stone-200 pt-4 text-sm">
                <div>
                  <div className="text-stone-400">Projects</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">{property.projectCount}</div>
                </div>
                <div>
                  <div className="text-stone-400">Open tasks</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">{property.openTasks}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
