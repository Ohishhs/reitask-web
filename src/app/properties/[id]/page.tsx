import { fetchProjectsForProperty, getPropertyById } from '@/lib/repository'
import Link from 'next/link'

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const property = await getPropertyById(id)

  if (!property) {
    return (
      <main className="min-h-screen bg-stone-100 p-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Property not found</h1>
        </div>
      </main>
    )
  }

  const projects = await fetchProjectsForProperty(property.id)

  return (
    <main className="min-h-screen bg-stone-100 p-6 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">Property detail</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{property.name}</h1>
          </div>
          <Link href="/properties" className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
            Back to properties
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Address</div>
                <div className="mt-2 text-lg font-semibold text-slate-900">{property.address}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Owner</div>
                <div className="mt-2 text-lg font-semibold text-slate-900">{property.owner}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Location</div>
                <div className="mt-2 text-lg font-semibold text-slate-900">{property.city}, {property.state} {property.zip}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Type</div>
                <div className="mt-2 text-lg font-semibold text-slate-900">{property.propertyType}</div>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-stone-50 p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Portfolio notes</div>
              <p className="mt-2 text-sm leading-6 text-stone-600">{property.notes}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Property status</div>
            <div className="mt-3 inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">{property.status}</div>
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-stone-400">Projects</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">{property.projectCount}</div>
              </div>
              <div>
                <div className="text-stone-400">Open tasks</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">{property.openTasks}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Projects for this property</h2>
            <button className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">+ New project</button>
          </div>

          <div className="space-y-4">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="block rounded-xl border border-stone-200 bg-stone-50 p-4 transition hover:border-stone-300">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-stone-400">Project</div>
                    <div className="mt-2 text-lg font-semibold text-slate-900">{project.name}</div>
                  </div>
                  <div className="text-sm font-medium text-stone-600">{project.status}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
