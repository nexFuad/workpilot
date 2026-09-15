export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading data">
      {Array.from({ length: count }, (_, index) => (
        <article
          key={index}
          className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="size-9 rounded-xl bg-slate-100" />
            <div className="flex-1 space-y-2">
              <span className="block h-4 w-1/2 rounded bg-slate-100" />
              <span className="block h-3 w-3/4 rounded bg-slate-100" />
            </div>
          </div>
          <span className="mt-4 block h-9 w-full rounded-xl bg-slate-100" />
        </article>
      ))}
    </div>
  );
}

export function FormPageSkeleton() {
  return (
    <section className="w-full animate-pulse space-y-6" aria-label="Loading form">
      <div>
        <span className="block h-3 w-28 rounded bg-slate-100" />
        <span className="mt-3 block h-8 w-56 rounded bg-slate-100" />
        <span className="mt-3 block h-4 w-96 max-w-full rounded bg-slate-100" />
      </div>
      <div className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
        {Array.from({ length: 10 }, (_, index) => (
          <div key={index} className="space-y-2">
            <span className="block h-3 w-28 rounded bg-slate-100" />
            <span className="block h-11 w-full rounded-xl bg-slate-100" />
          </div>
        ))}
      </div>
    </section>
  );
}
